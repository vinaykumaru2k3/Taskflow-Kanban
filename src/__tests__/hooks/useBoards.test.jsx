import { renderHook, act } from '@testing-library/react';
import { useBoards } from '../../hooks/useBoards';
import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
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

describe('useBoards Hook', () => {
  const mockUser = { uid: '123' };
  const mockBoards = [
    { id: 'board1', name: 'Board 1', color: '#ff0000' },
    { id: 'board2', name: 'Board 2', color: '#00ff00' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    serverTimestamp.mockReturnValue('timestamp');
    onSnapshot.mockReturnValue(vi.fn()); // cleanup function
  });

  it('should initialize with empty state and loading true', () => {
    const { result } = renderHook(() => useBoards(mockUser));
    
    expect(result.current.boards).toEqual([]);
    expect(result.current.currentBoard).toBeNull();
  });

  it('should create boards collection query on init', () => {
    renderHook(() => useBoards(mockUser));
    
    expect(collection).toHaveBeenCalledWith(db, 'users', mockUser.uid, 'boards');
    expect(query).toHaveBeenCalled();
    expect(onSnapshot).toHaveBeenCalled();
  });

  it('should handle board updates (loading)', () => {
    // Simulate snapshot callback
    onSnapshot.mockImplementation((q, callback) => {
        callback({
          forEach: (fn) => mockBoards.forEach(b => fn({ id: b.id, data: () => b })),
        });
        return vi.fn(); // unsubscribe mock
    });

    const { result } = renderHook(() => useBoards(mockUser));
    
    expect(result.current.boards).toHaveLength(2);
    expect(result.current.boards[0].id).toBe('board1');
    expect(result.current.currentBoard.id).toBe('board1'); // Should default to first board
  });

  it('should call addDoc when creating a board', async () => {
    addDoc.mockResolvedValue({ id: 'newBoard' });
    const { result } = renderHook(() => useBoards(mockUser));
    
    await act(async () => {
      await result.current.createBoard({ name: 'New Board', color: '#000' });
    });
    
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(), // Query/Collection ref
      expect.objectContaining({ 
        name: 'New Board', 
        color: '#000',
        createdAt: expect.anything()
      })
    );
  });

  it('should call updateDoc when updating a board', async () => {
    updateDoc.mockResolvedValue();
    const { result } = renderHook(() => useBoards(mockUser));
    
    await act(async () => {
      await result.current.updateBoard('board1', { name: 'Updated Board' });
    });
    
    expect(updateDoc).toHaveBeenCalled();
  });

  it('should call deleteDoc when deleting a board', async () => {
    deleteDoc.mockResolvedValue();
    const { result } = renderHook(() => useBoards(mockUser));
    
    await act(async () => {
      await result.current.deleteBoard('board1');
    });
    
    expect(deleteDoc).toHaveBeenCalled();
  });

  it('should handle null user gracefully', () => {
    const { result } = renderHook(() => useBoards(null));
    
    expect(result.current.boards).toEqual([]);
    expect(result.current.currentBoard).toBeNull();
    // Verify no firebase calls happened
    expect(collection).not.toHaveBeenCalled();
  });
});
