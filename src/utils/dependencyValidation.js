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

  // [fix] For new tasks proposedTaskId is null. Use a sentinel so their
  // proposed edges are still added to the graph and the cycle check works.
  const effectiveId = proposedTaskId ?? '__new__';

  const allTaskIds = new Set(tasks.map(t => t.id));
  allTaskIds.add(effectiveId);

  // Helper to add a directed edge u -> v (u blocks v)
  // Ensure that both u and v exist as valid task nodes in the graph
  const addEdge = (u, v) => {
    if (!allTaskIds.has(u) || !allTaskIds.has(v)) return;
    if (!adj.has(u)) adj.set(u, new Set());
    adj.get(u).add(v);
  };

  // Populate graph edges for existing tasks, ignoring the proposed task's old state
  tasks.forEach(task => {
    if (task.id === effectiveId) return;

    (task.blockedBy || []).forEach(blockerId => {
      addEdge(blockerId, task.id);
    });

    (task.blocks || []).forEach(blockedId => {
      addEdge(task.id, blockedId);
    });
  });

  // Add edges for the proposed task (works for both new and existing tasks)
  proposedBlockedBy.forEach(blockerId => { addEdge(blockerId, effectiveId); });
  proposedBlocks.forEach(blockedId => { addEdge(effectiveId, blockedId); });

  // 2. Iterative DFS cycle detection (Kahn-style coloring with explicit stack).
  // [fix] Replaces recursive DFS to prevent call stack overflow on deep graphs
  // (10,000+ tasks in a single chain).
  // Colors: 0 = unvisited, 1 = in current DFS stack, 2 = fully visited
  const color = new Map();

  for (const startId of allTaskIds) {
    if ((color.get(startId) ?? 0) === 2) continue;

    // Each stack frame: [nodeId, iteratorIndex] so we can resume iteration
    const stack = [];
    const stackSet = new Set(); // nodes currently in DFS stack

    stack.push({ id: startId, neighbors: [...(adj.get(startId) || [])], idx: 0 });
    stackSet.add(startId);
    color.set(startId, 1);

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];

      if (frame.idx < frame.neighbors.length) {
        const neighbor = frame.neighbors[frame.idx++];
        const neighborColor = color.get(neighbor) ?? 0;

        if (neighborColor === 1 || stackSet.has(neighbor)) {
          return true; // Back-edge → cycle
        }
        if (neighborColor === 0) {
          color.set(neighbor, 1);
          stackSet.add(neighbor);
          stack.push({ id: neighbor, neighbors: [...(adj.get(neighbor) || [])], idx: 0 });
        }
      } else {
        // All neighbors processed — mark fully visited
        color.set(frame.id, 2);
        stackSet.delete(frame.id);
        stack.pop();
      }
    }
  }

  return false;
}
