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
    
    // First, set current user as owner
    const ownerCollaborator = {
      uid: user.uid,
      id: 'owner',
      displayName: user.displayName || 'You',
      photoURL: user.photoURL,
      email: user.email,
      role: ROLES.OWNER
    };
    
    // Check if this is a shared board (stored in user's sharedBoards subcollection)
    const checkSharedBoard = async () => {
      try {
        const sharedBoardRef = doc(db, 'users', user.uid, 'sharedBoards', currentBoard.id);
        const sharedSnap = await getDoc(sharedBoardRef);
        
        if (sharedSnap.exists()) {
          // User is a collaborator on this board
          const sharedData = sharedSnap.data();
          setCollaborators([ownerCollaborator, {
            uid: sharedData.ownerId,
            id: 'collaborator',
            displayName: sharedData.ownerName || 'Board Owner',
            role: sharedData.role || ROLES.EDITOR,
            isShared: true
          }]);
        } else {
          // User owns this board - just set as owner
          setCollaborators([ownerCollaborator]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error checking shared board:', err);
        setCollaborators([ownerCollaborator]);
        setLoading(false);
      }
    };

    checkSharedBoard();
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

  // Share a board with another user
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

      // Find the user by email
      const targetUser = await findUserByEmail(email);
      
      if (!targetUser) {
        throw new Error('User not found. They must sign up first before you can share boards with them.');
      }

      // Prevent sharing with yourself
      if (targetUser.uid === user.uid) {
        throw new Error('You cannot share a board with yourself');
      }

      // Check if already shared
      const existingSharedRef = doc(db, 'users', targetUser.uid, 'sharedBoards', boardId);
      const existingShared = await getDoc(existingSharedRef);
      
      if (existingShared.exists()) {
        throw new Error('This board is already shared with this user');
      }

      // Add to target user's sharedBoards subcollection
      await setDoc(existingSharedRef, {
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        ownerEmail: user.email,
        boardName: boardData.name,
        boardColor: boardData.color,
        role: role,
        sharedAt: serverTimestamp()
      });

      // Create notification for the target user
      await addDoc(collection(db, 'users', targetUser.uid, 'notifications'), {
        type: 'invite',
        title: 'Board Invitation',
        message: `${user.displayName || 'Someone'} invited you to "${boardData.name}"`,
        boardId: boardId,
        boardName: boardData.name,
        fromUserId: user.uid,
        fromUserName: user.displayName || user.email,
        role: role,
        read: false,
        createdAt: serverTimestamp()
      });

      return { success: true, message: 'Board shared successfully!' };
    } catch (err) {
      console.error('Error sharing board:', err);
      throw err;
    }
  };

  // Remove a collaborator
  const removeCollaborator = async (boardId, collaboratorId) => {
    if (!user || !boardId || !collaboratorId) return;

    try {
      // If collaboratorId is 'owner', they own the board - can't remove
      if (collaboratorId === 'owner') {
        throw new Error('Cannot remove board owner');
      }

      // Get collaborator's UID from the stored data
      const collabRef = doc(db, 'users', user.uid, 'boards', boardId, 'collaborators', collaboratorId);
      await deleteDoc(collabRef);
      
      return { success: true };
    } catch (err) {
      console.error('Error removing collaborator:', err);
      throw err;
    }
  };

  // Update collaborator role
  const updateCollaboratorRole = async (boardId, collaboratorId, newRole) => {
    if (!user || !boardId || !collaboratorId) return;

    try {
      await updateDoc(doc(db, 'users', user.uid, 'boards', boardId, 'collaborators', collaboratorId), {
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
    removeCollaborator,
    updateCollaboratorRole,
    getUserRoleForBoard,
    isBoardOwner
  };
};
