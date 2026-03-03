import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../../hooks/useNotifications';
import { db } from '../../lib/firebase';
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
  getDocs,
  writeBatch,
  serverTimestamp,
  limit
} from 'firebase/firestore';

vi.mock('firebase/firestore');
vi.mock('../../lib/firebase', () => ({ db: {} }));

describe('useNotifications Hook', () => {
  const mockUser = { uid: '123', email: 'user@example.com', displayName: 'Test User' };

  beforeEach(() => {
    vi.clearAllMocks();
    serverTimestamp.mockReturnValue('timestamp');
    onSnapshot.mockReturnValue(vi.fn());
    collection.mockReturnValue('mockCollection');
    doc.mockReturnValue('mockDoc');
    query.mockReturnValue('mockQuery');
  });

  it('should initialize with empty notifications', () => {
    onSnapshot.mockImplementation((ref, callback) => {
      callback({ forEach: vi.fn() });
      return vi.fn();
    });

    const { result } = renderHook(() => useNotifications(mockUser));
    
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should handle null user', () => {
    const { result } = renderHook(() => useNotifications(null));
    
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should count unread notifications', () => {
    const mockNotifications = [
      { id: 'notif1', read: false },
      { id: 'notif2', read: false },
      { id: 'notif3', read: true }
    ];

    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        forEach: (fn) => mockNotifications.forEach(n => fn({ id: n.id, data: () => n }))
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useNotifications(mockUser));
    
    expect(result.current.unreadCount).toBe(2);
  });

  it('should mark notification as read', async () => {
    updateDoc.mockResolvedValueOnce();

    const { result } = renderHook(() => useNotifications(mockUser));
    
    await act(async () => {
      await result.current.markAsRead('notif1');
    });
    
    expect(updateDoc).toHaveBeenCalledWith(
      'mockDoc',
      expect.objectContaining({ read: true })
    );
  });

  it('should mark all notifications as read', async () => {
    getDocs.mockResolvedValueOnce({
      forEach: vi.fn(),
      docs: [
        { ref: 'ref1', data: () => ({ read: false }) },
        { ref: 'ref2', data: () => ({ read: false }) }
      ]
    });

    writeBatch.mockReturnValue({
      update: vi.fn(),
      commit: vi.fn().mockResolvedValueOnce()
    });

    const { result } = renderHook(() => useNotifications(mockUser));
    
    await act(async () => {
      await result.current.markAllAsRead();
    });
    
    expect(writeBatch).toHaveBeenCalled();
  });

  it('should delete notification', async () => {
    deleteDoc.mockResolvedValueOnce();

    const { result } = renderHook(() => useNotifications(mockUser));
    
    await act(async () => {
      await result.current.deleteNotification('notif1');
    });
    
    expect(deleteDoc).toHaveBeenCalled();
  });

  it('should notify assignment', async () => {
    addDoc.mockResolvedValueOnce({ id: 'notif1' });

    const { result } = renderHook(() => useNotifications(mockUser));
    
    await act(async () => {
      await result.current.notifyAssignment('user2', 'John Doe', 'Fix bug', 'board1', 'task1');
    });
    
    expect(addDoc).toHaveBeenCalledWith(
      'mockCollection',
      expect.objectContaining({
        type: 'assignment',
        title: 'Task Assigned',
        taskId: 'task1',
        boardId: 'board1'
      })
    );
  });

  it('should notify mention', async () => {
    addDoc.mockResolvedValueOnce({ id: 'notif1' });

    const { result } = renderHook(() => useNotifications(mockUser));
    
    await act(async () => {
      await result.current.notifyMention('user2', 'Jane Doe', 'Review PR', 'board1', 'task1', 'comment1');
    });
    
    expect(addDoc).toHaveBeenCalledWith(
      'mockCollection',
      expect.objectContaining({
        type: 'mention',
        title: 'You were mentioned',
        taskId: 'task1',
        commentId: 'comment1'
      })
    );
  });

  it('should notify board invite', async () => {
    addDoc.mockResolvedValueOnce({ id: 'notif1' });

    const { result } = renderHook(() => useNotifications(mockUser));
    
    await act(async () => {
      await result.current.notifyBoardInvite('user2', 'Admin', 'Project Board', 'board1', 'editor');
    });
    
    expect(addDoc).toHaveBeenCalledWith(
      'mockCollection',
      expect.objectContaining({
        type: 'invite',
        title: 'Board Invitation',
        boardId: 'board1'
      })
    );
  });

  it('should sanitize notification content', async () => {
    addDoc.mockResolvedValueOnce({ id: 'notif1' });

    const { result } = renderHook(() => useNotifications(mockUser));
    
    await act(async () => {
      await result.current.notifyAssignment('user2', '<script>alert("xss")</script>', 'Task', 'board1', 'task1');
    });
    
    expect(addDoc).toHaveBeenCalled();
    const callArgs = addDoc.mock.calls[0][1];
    expect(callArgs.message).not.toContain('<script>');
  });
});
