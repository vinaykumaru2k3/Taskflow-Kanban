/**
 * Detects if a cyclic dependency exists in the task graph.
 * A directed edge u -> v represents "u blocks v" (or "v depends on u").
 * 
 * @param {Array} tasks - All tasks currently on the board.
 * @param {string|null} proposedTaskId - The ID of the task being saved (null if new).
 * @param {Array} proposedBlockedBy - The proposed blockedBy list for the task.
 * @param {Array} proposedBlocks - The proposed blocks list for the task.
 * @returns {boolean} True if a cycle is detected, false otherwise.
 */
export function hasDependencyCycle(tasks, proposedTaskId, proposedBlockedBy = [], proposedBlocks = []) {
  // 1. Build adjacency list of task dependencies.
  const adj = new Map();
  const allTaskIds = new Set(tasks.map(t => t.id));
  
  if (proposedTaskId) {
    allTaskIds.add(proposedTaskId);
  }

  // Helper to add a directed edge u -> v (u blocks v)
  // Ensure that both u and v exist as valid task nodes in the graph
  const addEdge = (u, v) => {
    if (!allTaskIds.has(u) || !allTaskIds.has(v)) return;
    if (!adj.has(u)) adj.set(u, new Set());
    adj.get(u).add(v);
  };

  // Populate graph edges for existing tasks, ignoring the proposed task's old state
  tasks.forEach(task => {
    if (task.id === proposedTaskId) return;

    (task.blockedBy || []).forEach(blockerId => {
      addEdge(blockerId, task.id);
    });

    (task.blocks || []).forEach(blockedId => {
      addEdge(task.id, blockedId);
    });
  });

  // Add edges for the proposed task version (works uniformly for new or existing tasks)
  if (proposedTaskId) {
    proposedBlockedBy.forEach(blockerId => {
      addEdge(blockerId, proposedTaskId);
    });
    proposedBlocks.forEach(blockedId => {
      addEdge(proposedTaskId, blockedId);
    });
  }

  // 2. DFS cycle detection
  // Visited states: 0 = unvisited, 1 = visiting (in recursion stack), 2 = fully visited
  const visited = new Map();
  
  function dfs(u) {
    visited.set(u, 1); // visiting
    
    const neighbors = adj.get(u);
    if (neighbors) {
      for (const v of neighbors) {
        const state = visited.get(v) || 0;
        if (state === 1) {
          return true; // Cycle found (back-edge)
        }
        if (state === 0) {
          if (dfs(v)) return true;
        }
      }
    }
    
    visited.set(u, 2); // fully visited
    return false;
  }

  // Check all nodes (graph can have multiple disconnected components)
  for (const taskId of allTaskIds) {
    if ((visited.get(taskId) || 0) === 0) {
      if (dfs(taskId)) return true;
    }
  }

  return false;
}
