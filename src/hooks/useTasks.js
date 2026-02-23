import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!user || !currentBoard) {
      setTasks([]);
      return;
    }
    const q = query(
      collection(db, 'users', user.uid, 'tasks'), 
      where('boardId', '==', currentBoard.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setTasks(items);
    });
    return () => unsubscribe();
  }, [user, currentBoard]);

  const createTask = async (taskData) => {
    if (!user || !currentBoard) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'tasks'), { 
        ...taskData, 
        boardId: currentBoard.id,
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
        await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), {
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
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId)); 
    } catch (err) { 
        console.error("Error deleting task:", err); 
        throw err;
    }
  };

  const archiveTask = async (taskId) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), {
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
      await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), {
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
