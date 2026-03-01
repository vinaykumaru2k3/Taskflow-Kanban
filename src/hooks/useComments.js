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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useComments = (user, boardId, taskId, taskTitle, notifyMention) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch comments for a specific task
  useEffect(() => {
    if (!boardId || !taskId) {
      setComments([]);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'comments'),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setComments(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [boardId, taskId]);

  // Add a new comment
  const addComment = async (text, mentions = []) => {
    if (!user || !boardId || !taskId || !text.trim()) return;

    try {
      const docRef = await addDoc(collection(db, 'comments'), {
        taskId,
        boardId,
        authorId: user.uid,
        authorName: user.displayName || 'Unknown',
        authorAvatar: user.photoURL || null,
        content: text.trim(),
        mentions: mentions, // Array of mentioned user IDs
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Notify mentioned users (skip self)
      if (notifyMention && mentions.length > 0) {
        const mentionerName = user.displayName || user.email || 'Unknown';
        mentions.forEach(mentionedUserId => {
          if (mentionedUserId !== user.uid) {
            notifyMention(mentionedUserId, mentionerName, taskTitle || 'Task', boardId, taskId, docRef.id);
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  // Update a comment
  const updateComment = async (commentId, text, mentions = []) => {
    if (!user || !boardId || !commentId || !text.trim()) return;

    try {
      await updateDoc(doc(db, 'comments', commentId), {
        content: text.trim(),
        mentions,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  };

  // Delete a comment
  const deleteComment = async (commentId) => {
    if (!user || !boardId || !commentId) return;

    try {
      await deleteDoc(doc(db, 'comments', commentId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  return {
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment
  };
};
