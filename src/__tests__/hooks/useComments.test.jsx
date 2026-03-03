import { renderHook, act } from '@testing-library/react';
import { useComments } from '../../hooks/useComments';
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
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

vi.mock('firebase/firestore');
vi.mock('../../lib/firebase', () => ({ db: {} }));

describe('useComments Hook', () => {
  const mockUser = { uid: '123', email: 'user@example.com', displayName: 'Test User', photoURL: 'http://example.com/photo.jpg' };
  const mockNotifyMention = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    serverTimestamp.mockReturnValue('timestamp');
    onSnapshot.mockReturnValue(vi.fn());
    collection.mockReturnValue('mockCollection');
    doc.mockReturnValue('mockDoc');
    query.mockReturnValue('mockQuery');
  });

  it('should initialize with empty comments', () => {
    onSnapshot.mockImplementation((ref, callback) => {
      callback({ 
        docs: [],
        forEach: (fn) => [] 
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useComments(mockUser, 'board1', 'task1', 'Task Title', mockNotifyMention));
    
    expect(result.current.comments).toEqual([]);
  });

  it('should handle missing boardId or taskId', () => {
    const { result } = renderHook(() => useComments(mockUser, null, null, 'Task Title', mockNotifyMention));
    
    expect(result.current.comments).toEqual([]);
  });

  it('should add comment', async () => {
    addDoc.mockResolvedValueOnce({ id: 'comment1' });

    const { result } = renderHook(() => useComments(mockUser, 'board1', 'task1', 'Task Title', mockNotifyMention));
    
    await act(async () => {
      await result.current.addComment('This is a comment', []);
    });
    
    expect(addDoc).toHaveBeenCalledWith(
      'mockCollection',
      expect.objectContaining({
        taskId: 'task1',
        boardId: 'board1',
        authorId: mockUser.uid,
        content: 'This is a comment'
      })
    );
  });

  it('should notify mentioned users when adding comment', async () => {
    addDoc.mockResolvedValueOnce({ id: 'comment1' });

    const { result } = renderHook(() => useComments(mockUser, 'board1', 'task1', 'Task Title', mockNotifyMention));
    
    await act(async () => {
      await result.current.addComment('Hey @user2', ['user2']);
    });
    
    expect(mockNotifyMention).toHaveBeenCalledWith(
      'user2',
      expect.any(String),
      'Task Title',
      'board1',
      'task1',
      'comment1'
    );
  });

  it('should not notify self when mentioned', async () => {
    addDoc.mockResolvedValueOnce({ id: 'comment1' });

    const { result } = renderHook(() => useComments(mockUser, 'board1', 'task1', 'Task Title', mockNotifyMention));
    
    await act(async () => {
      await result.current.addComment('Hey @me', [mockUser.uid]);
    });
    
    expect(mockNotifyMention).not.toHaveBeenCalled();
  });

  it('should update comment', async () => {
    getDoc.mockResolvedValueOnce({ 
      exists: () => true, 
      data: () => ({ authorId: mockUser.uid, content: 'Old content' }) 
    });
    updateDoc.mockResolvedValueOnce();

    const { result } = renderHook(() => useComments(mockUser, 'board1', 'task1', 'Task Title', mockNotifyMention));
    
    await act(async () => {
      await result.current.updateComment('comment1', 'Updated content', []);
    });
    
    expect(updateDoc).toHaveBeenCalled();
  });

  it('should delete comment', async () => {
    getDoc.mockResolvedValueOnce({ 
      exists: () => true, 
      data: () => ({ authorId: mockUser.uid }) 
    });
    deleteDoc.mockResolvedValueOnce();

    const { result } = renderHook(() => useComments(mockUser, 'board1', 'task1', 'Task Title', mockNotifyMention));
    
    await act(async () => {
      await result.current.deleteComment('comment1');
    });
    
    expect(deleteDoc).toHaveBeenCalled();
  });
});
