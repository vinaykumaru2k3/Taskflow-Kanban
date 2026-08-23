import { useState, useEffect, useRef } from 'react';
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

  // [fix] Stable refs so onSnapshot error handler always calls the latest
  // showToast without needing to re-subscribe the listener.
  const showToastRef = useRef(showToast);
  const notifyMentionRef = useRef(notifyMention);
  const taskTitleRef = useRef(taskTitle);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);
  useEffect(() => { notifyMentionRef.current = notifyMention; }, [notifyMention]);
  useEffect(() => { taskTitleRef.current = taskTitle; }, [taskTitle]);

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
      // [fix] Use ref so the latest showToast is always called, not stale closure
      showToastRef.current?.("Comments Error: " + error.message, 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [boardId, taskId]); // [fix] showToast/notifyMention accessed via stable refs

  // Add a new comment
  const addComment = async (text, mentions = []) => {
    console.log("[useComments] attempting to add comment:", { boardId, taskId, text, userUid: user?.uid });
    
    if (!user || !boardId || !taskId || !text.trim()) {
      console.error("[useComments] EARLY RETURN - MISSING DATA:", { user: !!user, boardId, taskId, text });
      return;
    }

    // [fix] Input validation before writing to Firestore
    const MAX_COMMENT_LENGTH = 10000;
    if (text.trim().length > MAX_COMMENT_LENGTH) {
      showToastRef.current?.(`Comment too long (max ${MAX_COMMENT_LENGTH} characters)`, 'error');
      return { success: false, error: 'Comment too long' };
    }
    // Validate and sanitize mentions array: must be non-empty strings, cap at 50
    const safeMentions = Array.isArray(mentions)
      ? mentions.filter(id => typeof id === 'string' && id.length > 0 && id.length <= 128).slice(0, 50)
      : [];

    try {
      console.log("[useComments] Sending addDoc request out to Firestore...");
      const docRef = await addDoc(collection(db, 'comments'), {
        taskId,
        boardId,
        authorId: user.uid,
        authorName: user.displayName || 'Unknown',
        authorAvatar: user.photoURL || null,
        content: text.trim(),
        mentions: safeMentions,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log("[useComments] Successfully added document with ID:", docRef.id);
      
      // Notify mentioned users (skip self) — use ref for latest notifyMention
      if (notifyMentionRef.current && safeMentions.length > 0) {
        const mentionerName = user.displayName || user.email || 'Unknown';
        safeMentions.forEach(mentionedUserId => {
          if (mentionedUserId !== user.uid) {
            notifyMentionRef.current(mentionedUserId, mentionerName, taskTitleRef.current || 'Task', boardId, taskId, docRef.id);
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('[useComments] Error adding comment:', error);
      showToastRef.current?.('Failed to add comment: ' + error.message, 'error');
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
      const commentSnap = await getDoc(commentRef);

      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      if (commentSnap.data().authorId !== user.uid) {
        throw new Error('Unauthorized to update this comment');
      }

      await updateDoc(commentRef, {
        content: text.trim(),
        mentions,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating comment:', error);
      showToast?.('Failed to update comment: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  };

  // Delete a comment
  const deleteComment = async (commentId) => {
    if (!user || !boardId || !commentId) {
      return { success: false, error: 'Missing required data' };
    }

    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);

      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }

      if (commentSnap.data().authorId !== user.uid) {
        throw new Error('Unauthorized to delete this comment');
      }

      await deleteDoc(commentRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      showToast?.('Failed to delete comment: ' + error.message, 'error');
      return { success: false, error: error.message };
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
