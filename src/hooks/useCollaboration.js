import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ROLES } from '../utils/constants';

export const useCollaboration = (user, currentBoard) => {
  const [collaborators, setCollaborators] = useState([]);
  const [sharedBoards, setSharedBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch collaborators for current board
  useEffect(() => {
    if (!user || !currentBoard) {
      setCollaborators([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Check if this is an owned board or a shared board
    const checkBoardAndCollaborators = async () => {
      try {
        // First check if user owns this board
        const ownedBoardRef = doc(db, 'users', user.uid, 'boards', currentBoard.id);
        const ownedBoardSnap = await getDoc(ownedBoardRef);

        if (ownedBoardSnap.exists()) {
          // User owns this board
          const ownerCollaborator = {
            uid: user.uid,
            id: user.uid,
            displayName: user.displayName || 'You',
            photoURL: user.photoURL,
            email: user.email,
            role: ROLES.OWNER
          };
          setCollaborators([ownerCollaborator]);
        } else {
          // Check if this is a shared board
          const sharedBoardRef = doc(db, 'users', user.uid, 'sharedBoards', currentBoard.id);
          const sharedSnap = await getDoc(sharedBoardRef);

          if (sharedSnap.exists()) {
            const sharedData = sharedSnap.data();
            const currentUserCollaborator = {
              uid: user.uid,
              id: user.uid,
              displayName: user.displayName || 'You',
              photoURL: user.photoURL,
              email: user.email,
              role: sharedData.role || ROLES.EDITOR
            };
            const boardOwnerCollaborator = {
              uid: sharedData.ownerId,
              id: sharedData.ownerId,
              displayName: sharedData.ownerName || 'Board Owner',
              email: sharedData.ownerEmail || '',
              photoURL: null,
              role: ROLES.OWNER,
              isOwner: true
            };
            setCollaborators([boardOwnerCollaborator, currentUserCollaborator]);
          } else {
            // Fallback: treat as owner
            const ownerCollaborator = {
              uid: user.uid,
              id: user.uid,
              displayName: user.displayName || 'You',
              photoURL: user.photoURL,
              email: user.email,
              role: ROLES.OWNER
            };
            setCollaborators([ownerCollaborator]);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Error checking board collaborators:', err);
        setCollaborators([]);
        setLoading(false);
      }
    };

    checkBoardAndCollaborators();
  }, [user, currentBoard?.id]);

  // Fetch all shared boards (boards shared with this user)
  useEffect(() => {
    if (!user) {
      setSharedBoards([]);
      return;
    }

    setLoading(true);
    
    // Listen to sharedBoards subcollection
    const q = query(
      collection(db, 'users', user.uid, 'sharedBoards'),
      orderBy('sharedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setSharedBoards(items);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching shared boards:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Get user's role for a specific board
  const getUserRoleForBoard = useCallback(async (boardId) => {
    if (!user || !boardId) return ROLES.VIEWER;

    try {
      // First check if user owns the board
      const boardRef = doc(db, 'users', user.uid, 'boards', boardId);
      const boardSnap = await getDoc(boardRef);
      
      if (boardSnap.exists()) {
        return ROLES.OWNER;
      }

      // Check if board is shared with user
      const sharedRef = doc(db, 'users', user.uid, 'sharedBoards', boardId);
      const sharedSnap = await getDoc(sharedRef);
      
      if (sharedSnap.exists()) {
        return sharedSnap.data().role || ROLES.EDITOR;
      }

      return ROLES.VIEWER;
    } catch (err) {
      console.error('Error getting user role:', err);
      return ROLES.VIEWER;
    }
  }, [user]);

  // Check if user is owner of a board
  const isBoardOwner = useCallback(async (boardId) => {
    if (!user || !boardId) return false;
    
    try {
      const boardRef = doc(db, 'users', user.uid, 'boards', boardId);
      const boardSnap = await getDoc(boardRef);
      return boardSnap.exists();
    } catch (err) {
      console.error('Error checking board ownership:', err);
      return false;
    }
  }, [user]);

  // Look up user by email from users collection
  const findUserByEmail = async (email) => {
    try {
      // Query the users collection - requires an index on email
      // For now, we'll try a simple approach
      const q = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase()),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (err) {
      console.error('Error finding user by email:', err);
      // If query fails (e.g., no index), return null
      return null;
    }
  };

  // Send an invite — only creates the notification, board is NOT shared until accepted
  const shareBoard = async (boardId, email, role = ROLES.EDITOR) => {
    if (!user || !boardId || !email) {
      throw new Error('Missing required parameters');
    }

    try {
      // Get the board details first
      const boardRef = doc(db, 'users', user.uid, 'boards', boardId);
      const boardSnap = await getDoc(boardRef);
      
      if (!boardSnap.exists()) {
        throw new Error('Board not found');
      }

      const boardData = boardSnap.data();

      // Find the invitee by email
      const targetUser = await findUserByEmail(email);
      
      if (!targetUser) {
        throw new Error('User not found. They must sign up for TaskFlow first before you can invite them.');
      }

      // Prevent inviting yourself
      if (targetUser.uid === user.uid) {
        throw new Error('You cannot invite yourself to your own board.');
      }

      // Check if already accepted (board already in their sharedBoards)
      const existingSharedRef = doc(db, 'users', targetUser.uid, 'sharedBoards', boardId);
      const existingShared = await getDoc(existingSharedRef);
      if (existingShared.exists()) {
        throw new Error('This board is already shared with this user.');
      }

      // Check if there's already a pending invite notification for this board+user
      const pendingInviteQuery = query(
        collection(db, 'users', targetUser.uid, 'notifications'),
        where('type', '==', 'invite'),
        where('boardId', '==', boardId),
        where('status', '==', 'pending'),
        limit(1)
      );
      const pendingSnap = await getDocs(pendingInviteQuery);
      if (!pendingSnap.empty) {
        throw new Error('An invitation is already pending for this user.');
      }

      // Create the invite notification (board is NOT added to sharedBoards yet)
      await addDoc(collection(db, 'users', targetUser.uid, 'notifications'), {
        type: 'invite',
        status: 'pending',
        title: 'Board Invitation',
        message: `${user.displayName || user.email || 'Someone'} invited you to "${boardData.name}"`,
        boardId: boardId,
        boardName: boardData.name,
        boardColor: boardData.color || null,
        fromUserId: user.uid,
        fromUserName: user.displayName || user.email,
        fromUserEmail: user.email,
        role: role,
        read: false,
        createdAt: serverTimestamp()
      });

      return { success: true, message: `Invitation sent to ${email}!` };
    } catch (err) {
      console.error('Error sending board invitation:', err);
      throw err;
    }
  };

  // Accept an invite — adds the board to sharedBoards and marks notification accepted
  const acceptInvite = async (notification) => {
    if (!user || !notification) return;

    const { boardId, boardName, boardColor, fromUserId, fromUserName, fromUserEmail, role } = notification;

    try {
      // 1. Write to sharedBoards — this grants access
      const sharedRef = doc(db, 'users', user.uid, 'sharedBoards', boardId);
      await setDoc(sharedRef, {
        ownerId: fromUserId,
        ownerName: fromUserName || 'Board Owner',
        ownerEmail: fromUserEmail || '',
        boardName: boardName,
        boardColor: boardColor || null,
        role: role || ROLES.EDITOR,
        sharedAt: serverTimestamp(),
        acceptedAt: serverTimestamp()
      });

      // 2. Mark notification as accepted
      await updateDoc(doc(db, 'users', user.uid, 'notifications', notification.id), {
        status: 'accepted',
        read: true,
        readAt: serverTimestamp()
      });

      return { success: true };
    } catch (err) {
      console.error('Error accepting invite:', err);
      throw err;
    }
  };

  // Reject an invite — simply deletes the notification, board is never added
  const rejectInvite = async (notificationId) => {
    if (!user || !notificationId) return;

    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', notificationId), {
        status: 'rejected',
        read: true,
        readAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Error rejecting invite:', err);
      throw err;
    }
  };


  // Remove a collaborator (deletes their sharedBoards entry)
  const removeCollaborator = async (boardId, collaboratorUid) => {
    if (!user || !boardId || !collaboratorUid) return;

    try {
      // Cannot remove the board owner
      if (collaboratorUid === user.uid) {
        throw new Error('Cannot remove yourself as board owner');
      }

      // Delete the sharedBoards entry from the target user's subcollection
      const sharedRef = doc(db, 'users', collaboratorUid, 'sharedBoards', boardId);
      await deleteDoc(sharedRef);
      
      return { success: true };
    } catch (err) {
      console.error('Error removing collaborator:', err);
      throw err;
    }
  };

  // Update collaborator role (updates their sharedBoards entry)
  const updateCollaboratorRole = async (boardId, collaboratorUid, newRole) => {
    if (!user || !boardId || !collaboratorUid) return;

    try {
      const sharedRef = doc(db, 'users', collaboratorUid, 'sharedBoards', boardId);
      await updateDoc(sharedRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating collaborator role:', err);
      throw err;
    }
  };

  return {
    collaborators,
    sharedBoards,
    loading,
    shareBoard,
    acceptInvite,
    rejectInvite,
    removeCollaborator,
    updateCollaboratorRole,
    getUserRoleForBoard,
    isBoardOwner
  };
};
