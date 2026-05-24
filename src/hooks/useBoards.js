import { useState, useEffect } from 'react';
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
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useBoards = (user) => {
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBoards([]);
      setCurrentBoard(null);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'boards'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setBoards(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Effect to ensure currentBoard is valid or set to default
  useEffect(() => {
    if (loading) return;

    // IMPORTANT: If the current board belongs to another user (shared board),
    // don't override it — useTasks handles fetching from the owner's collection.
    if (currentBoard?.ownerId && currentBoard.ownerId !== user?.uid) {
      return;
    }

    if (boards.length > 0) {
      // If no board selected, or selected own board no longer exists
      if (!currentBoard || !boards.find(b => b.id === currentBoard.id)) {
        setCurrentBoard(boards[0]);
      }
    } else {
      setCurrentBoard(null);
    }
  }, [boards, currentBoard, loading, user]);

  const createBoard = async (boardData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'boards'), {
        ...boardData,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error creating board:', err);
      throw err;
    }
  };

  const updateBoard = async (boardId, boardData) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'boards', boardId), boardData);
    } catch (err) {
      console.error('Error updating board:', err);
      throw err;
    }
  };

  const deleteBoard = async (boardId) => {
    if (!user) return;
    try {
      const boardRef = doc(db, 'users', user.uid, 'boards', boardId);
      const boardSnap = await getDoc(boardRef);
      if (!boardSnap.exists()) {
        throw new Error('Board does not exist');
      }

      const refsToDelete = [boardRef];

      // 2. Query and delete all tasks associated with this board (from owner's tasks subcollection)
      try {
        const tasksQuery = query(
          collection(db, 'users', user.uid, 'tasks'),
          where('boardId', '==', boardId)
        );
        const tasksSnap = await getDocs(tasksQuery);
        tasksSnap.forEach((taskDoc) => {
          refsToDelete.push(taskDoc.ref);
        });
      } catch (err) {
        console.warn('Failed to query tasks for cascading board delete:', err);
      }

      // 3. Query and delete all comments associated with this board
      try {
        const commentsQuery = query(
          collection(db, 'comments'),
          where('boardId', '==', boardId)
        );
        const commentsSnap = await getDocs(commentsQuery);
        commentsSnap.forEach((commentDoc) => {
          refsToDelete.push(commentDoc.ref);
        });
      } catch (err) {
        console.warn('Failed to query comments for cascading board delete:', err);
      }

      // 4. Query and delete all members in boards/{boardId}/members
      try {
        const membersQuery = collection(db, 'boards', boardId, 'members');
        const membersSnap = await getDocs(membersQuery);
        membersSnap.forEach((memberDoc) => {
          const memberUid = memberDoc.id;
          if (memberUid !== user.uid) {
            refsToDelete.push(doc(db, 'users', memberUid, 'sharedBoards', boardId));
          }
          refsToDelete.push(memberDoc.ref);
        });
      } catch (err) {
        console.warn('Failed to query members for cascading board delete:', err);
      }

      // 5. Delete in chunks of MAX_BATCH_SIZE (Firestore commit limits to 500 operations)
      const MAX_BATCH_SIZE = 500;
      for (let i = 0; i < refsToDelete.length; i += MAX_BATCH_SIZE) {
        const chunkBatch = writeBatch(db);
        const chunk = refsToDelete.slice(i, i + MAX_BATCH_SIZE);
        chunk.forEach(ref => {
          chunkBatch.delete(ref);
        });
        await chunkBatch.commit();
      }

      console.log(`Cascading delete successful for board: ${boardId}`);
    } catch (err) {
      console.error('Error cascading delete board:', err);
      throw err;
    }
  };

  return { 
    boards, 
    currentBoard, 
    setCurrentBoard, 
    createBoard, 
    updateBoard, 
    deleteBoard 
  };
};
