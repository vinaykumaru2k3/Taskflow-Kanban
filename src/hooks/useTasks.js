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
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useTasks = (user, currentBoard, notifyAssignment) => {
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
      if (taskOwnerId !== user.uid && (!currentBoard.role || currentBoard.role === 'viewer')) {
        throw new Error('Unauthorized task creation');
      }

      // Validate assignee is a team member (bypass check if assignee is the board owner)
      if (taskData.assigneeId && taskData.assigneeId !== taskOwnerId) {
        const memberRef = doc(db, 'boards', currentBoard.id, 'members', taskData.assigneeId);
        const memberSnap = await getDoc(memberRef);
        if (!memberSnap.exists()) {
          throw new Error('Cannot assign task to user who is not a team member');
        }
      }

      // Create tasks in the owner's collection properly handling shared boards
      const docRef = await addDoc(collection(db, 'users', taskOwnerId, 'tasks'), { 
        ...taskData, 
        boardId: currentBoard.id,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || 'Unknown',
        archived: false,
        createdAt: serverTimestamp() 
      });

      if (taskData.assigneeId && notifyAssignment && taskData.assigneeId !== user.uid) {
        // [fix] await with .catch so rejection is surfaced, not silently swallowed
        await notifyAssignment(
          taskData.assigneeId,
          user.displayName || user.email || 'Unknown',
          taskData.title,
          currentBoard.id,
          docRef.id
        ).catch(err => console.warn('Assignment notification failed:', err));
      }
    } catch (err) { 
        console.error("Error creating task:", err); 
        throw err;
    }
  };

  const updateTask = async (taskId, taskData, oldTaskData) => {
    if (!user || !currentBoard) return; // [fix] null guard added for currentBoard
    try {
        // Authorization check: only owner or editor can update
        if (taskOwnerId !== user.uid && (!currentBoard.role || currentBoard.role === 'viewer')) {
          throw new Error('Unauthorized task update');
        }

        // Validate assignee is a team member if being assigned (bypass check if assignee is the board owner)
        if (taskData.assigneeId && currentBoard && taskData.assigneeId !== taskOwnerId) {
          const memberRef = doc(db, 'boards', currentBoard.id, 'members', taskData.assigneeId);
          const memberSnap = await getDoc(memberRef);
          if (!memberSnap.exists()) {
            throw new Error('Cannot assign task to user who is not a team member');
          }
        }

        await updateDoc(doc(db, 'users', taskOwnerId, 'tasks', taskId), {
            ...taskData,
            updatedAt: serverTimestamp()
        });

        // if an assignment changed, notify new assignee (fire-and-forget with logged error)
        if (
          taskData.assigneeId &&
          taskData.assigneeId !== oldTaskData?.assigneeId &&
          taskData.assigneeId !== user.uid &&
          notifyAssignment
        ) {
          // [fix] await with .catch so rejection is surfaced, not silently swallowed
          await notifyAssignment(
            taskData.assigneeId,
            user.displayName || user.email || 'Unknown',
            taskData.title || oldTaskData?.title || 'a task',
            currentBoard.id,
            taskId
          ).catch(err => console.warn('Assignment notification failed:', err));
        }
    } catch (err) {
        console.error("Error updating task:", err);
        throw err;
    }
  };

  const deleteTask = async (taskId) => {
    if (!user || !currentBoard) return;
    // [fix] Authorization check missing from original code
    if (taskOwnerId !== user.uid && (!currentBoard.role || currentBoard.role === 'viewer')) {
      throw new Error('Unauthorized task deletion');
    }
    try { 
        await deleteDoc(doc(db, 'users', taskOwnerId, 'tasks', taskId)); 
    } catch (err) { 
        console.error("Error deleting task:", err); 
        throw err;
    }
  };

  const archiveTask = async (taskId) => {
    if (!user || !currentBoard) return;
    // [fix] Authorization check missing from original code
    if (taskOwnerId !== user.uid && (!currentBoard.role || currentBoard.role === 'viewer')) {
      throw new Error('Unauthorized task archive');
    }
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
    if (!user || !currentBoard) return;
    // [fix] Authorization check missing from original code
    if (taskOwnerId !== user.uid && (!currentBoard.role || currentBoard.role === 'viewer')) {
      throw new Error('Unauthorized task restore');
    }
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
