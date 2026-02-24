import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
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
      await deleteDoc(doc(db, 'users', user.uid, 'boards', boardId));
    } catch (err) {
      console.error('Error deleting board:', err);
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
