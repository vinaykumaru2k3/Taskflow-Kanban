import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTasks } from '../../hooks/useTasks';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    callback({ forEach: vi.fn() });
    return vi.fn();
  }),
  addDoc: vi.fn(() => Promise.resolve({ id: 'task-123' })),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn((ref) => {
    // Mock member validation - return exists: false for non-members
    if (ref.toString().includes('non-member')) {
      return Promise.resolve({ exists: () => false });
    }
    return Promise.resolve({ exists: () => true });
  }),
  serverTimestamp: vi.fn(),
}));

describe('useTasks - Assignment Validation', () => {
  const mockUser = { uid: 'user-123', email: 'user@test.com', displayName: 'User' };
  const mockBoard = { id: 'board-123', name: 'Test Board' };
  const mockNotifyAssignment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('createTask prevents assigning to non-team member', async () => {
    const { result } = renderHook(() => useTasks(mockUser, mockBoard, mockNotifyAssignment));

    const taskData = {
      title: 'Test Task',
      assigneeId: 'non-member-456',
      status: 'todo',
    };

    await expect(async () => {
      await result.current.createTask(taskData);
    }).rejects.toThrow('Cannot assign task to user who is not a team member');
  });

  test('createTask allows assigning to valid team member', async () => {
    const { result } = renderHook(() => useTasks(mockUser, mockBoard, mockNotifyAssignment));

    const taskData = {
      title: 'Test Task',
      assigneeId: 'valid-member-789',
      status: 'todo',
    };

    await waitFor(async () => {
      await result.current.createTask(taskData);
      expect(mockNotifyAssignment).toHaveBeenCalled();
    });
  });

  test('updateTask prevents assigning to non-team member', async () => {
    const { result } = renderHook(() => useTasks(mockUser, mockBoard, mockNotifyAssignment));

    const taskData = {
      title: 'Updated Task',
      assigneeId: 'non-member-456',
    };

    await expect(async () => {
      await result.current.updateTask('task-123', taskData, {});
    }).rejects.toThrow('Cannot assign task to user who is not a team member');
  });

  test('updateTask allows unassigning tasks', async () => {
    const { result } = renderHook(() => useTasks(mockUser, mockBoard, mockNotifyAssignment));

    const taskData = {
      title: 'Updated Task',
      assigneeId: null,
    };

    await waitFor(async () => {
      await result.current.updateTask('task-123', taskData, { assigneeId: 'old-user' });
      // Should not throw
    });
  });
});
