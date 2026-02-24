import { useState, useEffect, useCallback } from 'react';
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
  serverTimestamp,
  limit,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications for current user
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listen to user's notifications collection
    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      let unread = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({ id: doc.id, ...data });
        if (!data.read) unread++;
      });
      setNotifications(items);
      setUnreadCount(unread);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching notifications:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!user || !notificationId) return;

    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'users', user.uid, 'notifications'),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.forEach((d) => {
        batch.update(d.ref, { read: true, readAt: serverTimestamp() });
      });
      
      await batch.commit();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user || !notificationId) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [user]);

  // Notify user when they are assigned to a task
  // This would typically be called from the task assignment logic
  const notifyAssignment = useCallback(async (assigneeEmail, assignerName, taskTitle, boardId, taskId) => {
    // Note: This requires a users collection with email indexes to find the user
    // For now, this is a placeholder - in production you'd:
    // 1. Look up user by email from a users collection
    // 2. Create notification in their notifications subcollection
    console.log('Assignment notification:', { assigneeEmail, assignerName, taskTitle, boardId, taskId });
  }, []);

  // Notify user when they are mentioned in a comment
  const notifyMention = useCallback(async (mentionedUserId, mentionerName, taskTitle, boardId, taskId) => {
    if (!mentionedUserId) return;

    try {
      await addDoc(collection(db, 'users', mentionedUserId, 'notifications'), {
        type: 'mention',
        title: 'You were mentioned',
        message: `${mentionerName} mentioned you in "${taskTitle}"`,
        taskId,
        boardId,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error creating mention notification:', err);
    }
  }, []);

  // Notify user when they are invited to a board
  const notifyBoardInvite = useCallback(async (invitedUserId, inviterName, boardName, boardId, role = 'editor') => {
    if (!invitedUserId) return;

    try {
      await addDoc(collection(db, 'users', invitedUserId, 'notifications'), {
        type: 'invite',
        title: 'Board Invitation',
        message: `${inviterName} invited you to "${boardName}"`,
        boardId,
        role,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error creating invite notification:', err);
    }
  }, []);

  // Helper to send notification by email (requires user lookup)
  // In production, you'd have a users collection to look up by email
  const sendNotificationByEmail = useCallback(async (email, type, data) => {
    // Placeholder - would need to look up user by email
    console.log('Sending notification by email:', { email, type, data });
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    notifyAssignment,
    notifyMention,
    notifyBoardInvite,
    sendNotificationByEmail
  };
};
