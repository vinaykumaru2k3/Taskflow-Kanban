import { renderHook, act } from '@testing-library/react';
import { useTasks } from '../../hooks/useTasks';
import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

// Mock firebase modules
vi.mock('firebase/firestore');
vi.mock('../../lib/firebase', () => ({
  db: {},
}));

describe('useTasks Hook', () => {
  const mockUser = { uid: '123' };
  const mockBoard = { id: 'board1', name: 'Board 1' };
  const mockTasks = [
    { id: '1', title: 'Task 1', boardId: 'board1' },
    { id: '2', title: 'Task 2', boardId: 'board1' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    serverTimestamp.mockReturnValue('timestamp');
    onSnapshot.mockReturnValue(vi.fn()); // cleanup function
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useTasks(mockUser, mockBoard));
    expect(result.current.tasks).toEqual([]);
  });

  it('should create tasks query for current board', () => {
    onSnapshot.mockReturnValue(vi.fn());
    query.mockReturnValue('mockQuery');
    
    renderHook(() => useTasks(mockUser, mockBoard));

    expect(collection).toHaveBeenCalledWith(db, 'users', mockUser.uid, 'tasks');
    expect(where).toHaveBeenCalledWith('boardId', '==', mockBoard.id);
    expect(query).toHaveBeenCalled();
    expect(onSnapshot).toHaveBeenCalled();
  });

  it('should handle updates (onSnapshot)', () => {
    onSnapshot.mockImplementation((q, callback) => {
        callback({
          forEach: (fn) => mockTasks.forEach(t => fn({ id: t.id, data: () => t })),
        });
        return vi.fn(); // unsubscribe mock
    });

    const { result } = renderHook(() => useTasks(mockUser, mockBoard));
    
    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks[0].id).toBe('1');
  });

  it('should call addDoc when creating a task', async () => {
    addDoc.mockResolvedValue();
    const { result } = renderHook(() => useTasks(mockUser, mockBoard));
    
    await act(async () => {
      await result.current.createTask({ title: 'New Task' });
    });
    
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ 
        title: 'New Task',
        boardId: mockBoard.id,
        createdAt: expect.anything()
      })
    );
  });

  it('should call updateDoc when updating a task', async () => {
    updateDoc.mockResolvedValue();
    const { result } = renderHook(() => useTasks(mockUser, mockBoard));
    
    await act(async () => {
      await result.current.updateTask('1', { title: 'Updated Task' });
    });
    
    expect(updateDoc).toHaveBeenCalled();
  });

  it('should call deleteDoc when deleting a task', async () => {
    deleteDoc.mockResolvedValue();
    const { result } = renderHook(() => useTasks(mockUser, mockBoard));
    
    await act(async () => {
      await result.current.deleteTask('1');
    });
    
    expect(deleteDoc).toHaveBeenCalled();
  });

  it('should return empty tasks if board or user is missing', () => {
    const { result } = renderHook(() => useTasks(null, null));
    expect(result.current.tasks).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
