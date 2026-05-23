import { describe, it, expect } from 'vitest';
import { hasDependencyCycle } from '../utils/dependencyValidation';

describe('Dependency Cycle Detection', () => {
  it('should return false for an empty task list', () => {
    const result = hasDependencyCycle([], null, [], []);
    expect(result).toBe(false);
  });

  it('should return false when there are no dependencies', () => {
    const tasks = [
      { id: '1', title: 'Task 1', blockedBy: [], blocks: [] },
      { id: '2', title: 'Task 2', blockedBy: [], blocks: [] },
    ];
    const result = hasDependencyCycle(tasks, null, [], []);
    expect(result).toBe(false);
  });

  it('should return false for acyclic dependencies', () => {
    const tasks = [
      { id: '1', title: 'Task 1', blockedBy: [], blocks: ['2'] },
      { id: '2', title: 'Task 2', blockedBy: ['1'], blocks: ['3'] },
      { id: '3', title: 'Task 3', blockedBy: ['2'], blocks: [] },
    ];
    // Graph: 1 -> 2 -> 3. No cycle.
    const result = hasDependencyCycle(tasks, null, [], []);
    expect(result).toBe(false);
  });

  it('should return true for a direct cycle (A blocks B and B blocks A)', () => {
    const tasks = [
      { id: '1', title: 'Task 1', blockedBy: ['2'], blocks: ['2'] },
      { id: '2', title: 'Task 2', blockedBy: ['1'], blocks: ['1'] },
    ];
    const result = hasDependencyCycle(tasks, null, [], []);
    expect(result).toBe(true);
  });

  it('should return true for a multi-step cycle (A -> B -> C -> A)', () => {
    const tasks = [
      { id: '1', title: 'Task 1', blockedBy: ['3'], blocks: ['2'] },
      { id: '2', title: 'Task 2', blockedBy: ['1'], blocks: ['3'] },
      { id: '3', title: 'Task 3', blockedBy: ['2'], blocks: ['1'] },
    ];
    const result = hasDependencyCycle(tasks, null, [], []);
    expect(result).toBe(true);
  });

  it('should return true if proposed changes introduce a cycle', () => {
    const tasks = [
      { id: '1', title: 'Task 1', blockedBy: [], blocks: ['2'] },
      { id: '2', title: 'Task 2', blockedBy: ['1'], blocks: [] },
    ];
    // Currently: 1 -> 2. No cycle.
    // Proposing to edit Task 1 to be blocked by Task 2 (creating 2 -> 1).
    const result = hasDependencyCycle(tasks, '1', ['2'], ['2']);
    expect(result).toBe(true);
  });

  it('should return true if a new task proposed changes introduce a cycle', () => {
    const tasks = [
      { id: '1', title: 'Task 1', blockedBy: [], blocks: [] },
      { id: '2', title: 'Task 2', blockedBy: [], blocks: [] },
    ];
    // Proposed: new task 3 blocked by 2 and blocks 2 (immediate cycle)
    const result = hasDependencyCycle(tasks, '3', ['2'], ['2']);
    expect(result).toBe(true);
  });

  it('should handle self-loops (Task blocks itself)', () => {
    const tasks = [
      { id: '1', title: 'Task 1', blockedBy: [], blocks: [] },
    ];
    const result = hasDependencyCycle(tasks, '1', ['1'], ['1']);
    expect(result).toBe(true);
  });
});
