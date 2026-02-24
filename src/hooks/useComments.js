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

export const useComments = (user, boardId, taskId) => {
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
      collection(db, 'boards', boardId, 'comments'),
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
      await addDoc(collection(db, 'boards', boardId, 'comments'), {
        taskId,
        userId: user.uid,
        userName: user.displayName || 'Unknown',
        userPhotoURL: user.photoURL || null,
        text: text.trim(),
        mentions: mentions, // Array of mentioned user IDs
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
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
      await updateDoc(doc(db, 'boards', boardId, 'comments', commentId), {
        text: text.trim(),
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
      await deleteDoc(doc(db, 'boards', boardId, 'comments', commentId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  // Parse mentions from text (@username format)
  const parseMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  };

  return {
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
    parseMentions
  };
};
