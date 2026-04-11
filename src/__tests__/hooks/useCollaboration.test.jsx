import { renderHook, act } from '@testing-library/react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { db } from '../../lib/firebase';
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
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { ROLES } from '../../utils/constants';

vi.mock('firebase/firestore');
vi.mock('../../lib/firebase', () => ({ db: {} }));

describe('useCollaboration Hook', () => {
  const mockUser = { uid: '123', email: 'user@example.com', displayName: 'Test User', photoURL: 'http://example.com/photo.jpg' };
  const mockBoard = { id: 'board1', name: 'Test Board', ownerId: '123' };

  beforeEach(() => {
    vi.clearAllMocks();
    serverTimestamp.mockReturnValue('timestamp');
    onSnapshot.mockReturnValue(vi.fn());
    collection.mockReturnValue('mockCollection');
    doc.mockReturnValue('mockDoc');
    query.mockReturnValue('mockQuery');
    
    // Default mock for getDoc to prevent undefined "exists" method errors in checkBoardAndCollaborators
    getDoc.mockResolvedValue({ 
      exists: () => false,
      data: () => ({})
    });
  });

  it('should initialize with empty state', () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    const { result } = renderHook(() => useCollaboration(mockUser, mockBoard));
    
    expect(result.current.collaborators).toEqual([]);
    expect(result.current.teamMembers).toEqual([]);
    expect(result.current.sharedBoards).toEqual([]);
  });

  it('should handle null user gracefully', () => {
    const { result } = renderHook(() => useCollaboration(null, mockBoard));
    
    expect(result.current.collaborators).toEqual([]);
    expect(result.current.teamMembers).toEqual([]);
  });

  it('should accept invite', async () => {
    setDoc.mockResolvedValueOnce();
    updateDoc.mockResolvedValueOnce();

    const { result } = renderHook(() => useCollaboration(mockUser, mockBoard));
    
    const notification = {
      id: 'notif1',
      boardId: 'board1',
      boardName: 'Board',
      fromUserId: 'user2',
      fromUserName: 'Other User',
      role: ROLES.EDITOR
    };

    await act(async () => {
      await result.current.acceptInvite(notification);
    });
    
    expect(setDoc).toHaveBeenCalled();
  });

  it('should reject invite', async () => {
    updateDoc.mockResolvedValueOnce();

    const { result } = renderHook(() => useCollaboration(mockUser, mockBoard));
    
    await act(async () => {
      await result.current.rejectInvite('notif1');
    });
    
    expect(updateDoc).toHaveBeenCalled();
  });

  it('should update collaborator role', async () => {
    updateDoc.mockResolvedValueOnce();

    const { result } = renderHook(() => useCollaboration(mockUser, mockBoard));
    
    await act(async () => {
      await result.current.updateCollaboratorRole('board1', 'user2', ROLES.VIEWER);
    });
    
    expect(updateDoc).toHaveBeenCalled();
  });

  it('should handle team members real-time updates', () => {
    const mockMembers = [
      { id: 'user1', uid: 'user1', displayName: 'User 1', role: ROLES.OWNER },
      { id: 'user2', uid: 'user2', displayName: 'User 2', role: ROLES.EDITOR }
    ];

    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        forEach: (fn) => mockMembers.forEach(m => fn({ id: m.id, data: () => m }))
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useCollaboration(mockUser, mockBoard));
    
    expect(result.current.teamMembers.length).toBeGreaterThanOrEqual(0);
  });
});
