import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useTasks = (user, currentBoard) => {
  const [tasks, setTasks] = useState([]);

  // Determine whose task collection to read from.
  // For shared boards, tasks live under the OWNER's uid, not the current user's.
  const taskOwnerId = useMemo(() => {
    if (!user) return null;
    // A shared board entry has an `ownerId` field set by useCollaboration.shareBoard
    if (currentBoard?.ownerId && currentBoard.ownerId !== user.uid) {
      return currentBoard.ownerId;
    }
    return user.uid;
  }, [user, currentBoard]);

  useEffect(() => {
    if (!user || !currentBoard || !taskOwnerId) {
      setTasks([]);
      return;
    }
    const q = query(
      collection(db, 'users', taskOwnerId, 'tasks'), 
      where('boardId', '==', currentBoard.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setTasks(items);
    }, (err) => {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    });
    return () => unsubscribe();
  }, [user, currentBoard, taskOwnerId]);

  const createTask = async (taskData) => {
    if (!user || !currentBoard) return;
    try {
      // Always create tasks in the current user's own collection
      // (shared-board viewers/editors create tasks in the owner's board, 
      //  but for now we create in user's own namespace for simplicity and security)
      await addDoc(collection(db, 'users', user.uid, 'tasks'), { 
        ...taskData, 
        boardId: currentBoard.id,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || 'Unknown',
        archived: false,
        createdAt: serverTimestamp() 
      });
    } catch (err) { 
        console.error("Error creating task:", err); 
        throw err;
    }
  };

  const updateTask = async (taskId, taskData) => {
    if (!user) return;
    try {
        await updateDoc(doc(db, 'users', taskOwnerId, 'tasks', taskId), {
            ...taskData,
            updatedAt: serverTimestamp()
        });
    } catch (err) {
        console.error("Error updating task:", err);
        throw err;
    }
  };

  const deleteTask = async (taskId) => {
    if (!user) return;
    try { 
        await deleteDoc(doc(db, 'users', taskOwnerId, 'tasks', taskId)); 
    } catch (err) { 
        console.error("Error deleting task:", err); 
        throw err;
    }
  };

  const archiveTask = async (taskId) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', taskOwnerId, 'tasks', taskId), {
        archived: true,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error archiving task:", err);
      throw err;
    }
  };

  const restoreTask = async (taskId) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', taskOwnerId, 'tasks', taskId), {
        archived: false,
        archivedAt: null,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error restoring task:", err);
      throw err;
    }
  };

  return { tasks, createTask, updateTask, deleteTask, archiveTask, restoreTask };
};
