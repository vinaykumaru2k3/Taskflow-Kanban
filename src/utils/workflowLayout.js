/**
 * workflowLayout.js — Pure graph utility functions for the Workflow tab.
 * No side-effects, no React imports. Safe to unit-test in isolation.
 */

// ── buildDepthMap ──────────────────────────────────────────────────────────────────
/**
 * Iterative longest-path depth map using Kahn's BFS topological sort.
 * Replaces the previous recursive DFS that cloned a visited Set per parent,
 * giving O(V²) memory in diamond-dependency graphs.
 *
 * Complexity: O(V + E) time, O(V + E) space. No recursion.
 * Cycles: nodes in a cycle never reach in-degree 0 and are assigned depth 0.
 *
 * Depth 0 = root (no blockers present in the task list).
 *
 * @param {Array<{id:string, blockedBy?:string[], blocks?:string[]}>} tasks
 * @returns {Map<string, number>}
 */
export function buildDepthMap(tasks) {
  const taskIds         = new Set(tasks.map(t => t.id));
  const depthMap        = new Map();
  const childToParents  = new Map(); // id → Set<parentId>
  const parentToChildren = new Map(); // id → parentId[]

  tasks.forEach(t => {
    if (!childToParents.has(t.id))    childToParents.set(t.id, new Set());
    if (!parentToChildren.has(t.id)) parentToChildren.set(t.id, []);

    // blockedBy: t depends on bid → bid is a parent of t
    (t.blockedBy || []).forEach(bid => {
      if (!taskIds.has(bid)) return;
      childToParents.get(t.id).add(bid);
      if (!parentToChildren.has(bid)) parentToChildren.set(bid, []);
      parentToChildren.get(bid).push(t.id);
    });

    // blocks: t blocks bid → t is a parent of bid
    (t.blocks || []).forEach(bid => {
      if (!taskIds.has(bid)) return;
      if (!childToParents.has(bid))    childToParents.set(bid, new Set());
      if (!parentToChildren.has(t.id)) parentToChildren.set(t.id, []);
      childToParents.get(bid).add(t.id);
      parentToChildren.get(t.id).push(bid);
    });
  });

  // Seed queue with roots (in-degree 0)
  const inDegree = new Map();
  tasks.forEach(t => inDegree.set(t.id, childToParents.get(t.id)?.size ?? 0));

  const queue = [];
  tasks.forEach(t => {
    if (inDegree.get(t.id) === 0) { depthMap.set(t.id, 0); queue.push(t.id); }
  });

  // BFS in topological order; propagate longest-path depth
  let head = 0;
  while (head < queue.length) {
    const nodeId    = queue[head++];
    const nodeDepth = depthMap.get(nodeId) ?? 0;

    (parentToChildren.get(nodeId) || []).forEach(childId => {
      // Keep the maximum depth seen so far (longest path)
      const candidate = nodeDepth + 1;
      if (!depthMap.has(childId) || depthMap.get(childId) < candidate) {
        depthMap.set(childId, candidate);
      }
      const remaining = (inDegree.get(childId) ?? 1) - 1;
      inDegree.set(childId, remaining);
      if (remaining === 0) queue.push(childId);
    });
  }

  // Nodes never dequeued are in cycles — assign depth 0 safely
  tasks.forEach(t => { if (!depthMap.has(t.id)) depthMap.set(t.id, 0); });

  return depthMap;
}

// ── computeCriticalPath ──────────────────────────────────────────────────────────
/**
 * Finds the single longest dependency chain (critical path).
 *
 * The previous implementation walked back from ALL deepest-level tasks and
 * marked every reachable node as critical, which included multiple parallel
 * paths and made the definition ambiguous.
 *
 * New algorithm: greedy single-path trace.
 *   1. Find the one task with the greatest depth (first by iteration order).
 *   2. Walk backward, always choosing the parent with the HIGHEST depth.
 *   3. Stop when we reach a root (depth 0, no parents).
 *
 * This guarantees exactly one highlighted chain — the longest one.
 * If multiple chains share the same maximum length, the first found is used.
 *
 * @param {Array} tasks
 * @param {Map<string, number>} depthMap - from buildDepthMap()
 * @returns {Set<string>} task IDs on the single critical path
 */
export function computeCriticalPath(tasks, depthMap) {
  if (!depthMap || depthMap.size === 0) return new Set();

  const maxDepth = Math.max(0, ...[...depthMap.values()]);
  if (maxDepth === 0) return new Set();

  const taskById    = new Map(tasks.map(t => [t.id, t]));
  const criticalSet = new Set();

  // 1. Seed: find the single deepest node
  let currentId = null;
  for (const [id, d] of depthMap) {
    if (d === maxDepth) { currentId = id; break; }
  }

  // 2. Greedy walk-back: always take the highest-depth parent
  while (currentId !== null) {
    criticalSet.add(currentId);
    const task = taskById.get(currentId);
    if (!task) break;

    const parents = (task.blockedBy || []).filter(bid => taskById.has(bid));
    if (parents.length === 0) break;

    // Pick parent with greatest depth (on the critical path)
    let bestParent = null;
    let bestDepth  = -1;
    parents.forEach(pid => {
      const pd = depthMap.get(pid) ?? -1;
      if (pd > bestDepth) { bestDepth = pd; bestParent = pid; }
    });

    currentId = bestParent;
  }

  return criticalSet;
}

// ── detectBottlenecks ─────────────────────────────────────────────────────────
/**
 * Identifies tasks that are bottlenecks — blocking ≥ `threshold` downstream tasks.
 *
 * @param {Array} tasks
 * @param {number} [threshold=3]
 * @returns {Map<string, number>} taskId → number of tasks it blocks
 */
export function detectBottlenecks(tasks, threshold = 3) {
  const taskIds = new Set(tasks.map(t => t.id));
  const counts = new Map();

  tasks.forEach(t => {
    // Only count blocks relationships where the target task actually exists
    const validBlocks = (t.blocks || []).filter(bid => taskIds.has(bid)).length;
    if (validBlocks >= threshold) {
      counts.set(t.id, validBlocks);
    }
  });

  return counts;
}

// ── buildDependencyPairs ──────────────────────────────────────────────────────
/**
 * Extracts a deduplicated list of directed dependency edges (blocker → blocked).
 *
 * @param {Array} tasks
 * @returns {Array<{blocker: object, blocked: object}>}
 */
export function buildDependencyPairs(tasks) {
  const taskById = new Map(tasks.map(t => [t.id, t]));
  const pairs = [];
  const seen = new Set();

  tasks.forEach(task => {
    // From blockedBy: task is blocked by bid → edge: bid → task
    (task.blockedBy || []).forEach(bid => {
      const key = `${bid}\u2192${task.id}`;
      const blocker = taskById.get(bid);
      if (blocker && !seen.has(key)) {
        seen.add(key);
        pairs.push({ blocker, blocked: task });
      }
    });

    // From blocks: task blocks bid → edge: task → bid
    (task.blocks || []).forEach(bid => {
      const key = `${task.id}\u2192${bid}`;
      const blocked = taskById.get(bid);
      if (blocked && !seen.has(key)) {
        seen.add(key);
        pairs.push({ blocker: task, blocked });
      }
    });
  });

  return pairs;
}
