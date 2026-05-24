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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useComments = (user, boardId, taskId, taskTitle, notifyMention, showToast) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch comments for a specific task
  useEffect(() => {
    if (!boardId || !taskId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'comments'),
      where('boardId', '==', boardId),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`[useComments] fetched ${snapshot.docs.length} comments for taskId:`, taskId);
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setComments(items);
      setLoading(false);
    }, (error) => {
      console.error("[useComments] Firestore onSnapshot Error:", error);
      showToast?.("Comments Error: " + error.message, 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [boardId, taskId]);

  // Add a new comment
  const addComment = async (text, mentions = []) => {
    console.log("[useComments] attempting to add comment:", { boardId, taskId, text, userUid: user?.uid });
    
    if (!user || !boardId || !taskId || !text.trim()) {
      console.error("[useComments] EARLY RETURN - MISSING DATA:", { user: !!user, boardId, taskId, text });
      return;
    }

    try {
      console.log("[useComments] Sending addDoc request out to Firestore...");
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
      
      console.log("[useComments] Successfully added document with ID:", docRef.id);
      
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
      console.error('[useComments] Error adding comment:', error);
      showToast?.('Failed to add comment: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  };

  // Update a comment
  const updateComment = async (commentId, text, mentions = []) => {
    if (!user || !boardId || !commentId || !text.trim()) {
      return { success: false, error: 'Missing required data' };
    }

    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        content: text.trim(),
        mentions,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating comment:', error);
      showToast?.('Failed to update comment: ' + error.message, 'error');
      throw error;
    }
  };

  // Delete a comment
  const deleteComment = async (commentId) => {
    if (!user || !boardId || !commentId) {
      return { success: false, error: 'Missing required data' };
    }

    try {
      const commentRef = doc(db, 'comments', commentId);
      await deleteDoc(commentRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      showToast?.('Failed to delete comment: ' + error.message, 'error');
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
