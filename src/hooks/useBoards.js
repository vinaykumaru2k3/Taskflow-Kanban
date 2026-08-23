import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
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
      console.info(`Boards snapshot updated for user ${user.uid}: ${items.length} boards`);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Sync currentBoard whenever the boards list changes.
  // [fix] Only depend on boards/loading/user — reading currentBoard as a ref
  // to avoid re-firing the effect every time currentBoard is set here.
  const currentBoardRef = useRef(currentBoard);
  useEffect(() => { currentBoardRef.current = currentBoard; }, [currentBoard]);

  useEffect(() => {
    if (loading) return;

    const cb = currentBoardRef.current;

    // IMPORTANT: If the current board belongs to another user (shared board),
    // don't override it — useTasks handles fetching from the owner's collection.
    if (cb?.ownerId && cb.ownerId !== user?.uid) return;

    if (boards.length > 0) {
      // If no board selected, or selected own board no longer exists
      if (!cb || !boards.find(b => b.id === cb.id)) {
        setCurrentBoard(boards[0]);
      }
    } else {
      setCurrentBoard(null);
    }
  }, [boards, loading, user?.uid]);

  const createBoard = async (boardData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'boards'), {
        ...boardData,
        createdAt: serverTimestamp(),
      });
      console.info('createBoard: board created for user', user.uid);
    } catch (err) {
      console.error('Error creating board:', err);
      throw err;
    }
  };

  const updateBoard = async (boardId, boardData) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'boards', boardId), boardData);
      console.info('updateBoard: updated board', boardId, 'for user', user.uid);
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
        console.error('Failed to query tasks for cascading board delete:', err);
        throw err;
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
        console.error('Failed to query comments for cascading board delete:', err);
        throw err;
      }

      // 4. Query and delete all members in boards/{boardId}/members
      try {
        const membersQuery = collection(db, 'boards', boardId, 'members');
        const membersSnap = await getDocs(membersQuery);
        membersSnap.forEach((memberDoc) => {
          const memberUid = memberDoc.id;
          refsToDelete.push(doc(db, 'users', memberUid, 'sharedBoards', boardId));
          refsToDelete.push(memberDoc.ref);
        });
      } catch (err) {
        console.error('Failed to query members for cascading board delete:', err);
        throw err;
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

      console.info(`Cascading delete successful for board: ${boardId}`);
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
    deleteBoard,
    loading // [fix] expose loading so callers can show skeleton state
  };
};
