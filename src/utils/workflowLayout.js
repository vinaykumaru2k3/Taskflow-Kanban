/**
 * workflowLayout.js — Pure graph utility functions for the Workflow tab.
 * No side-effects, no React imports. Safe to unit-test in isolation.
 */

// ── buildDepthMap ─────────────────────────────────────────────────────────────
/**
 * DFS depth-map for dependency tree layout.
 * Depth 0 = root (no blockers). Handles circular references safely.
 *
 * @param {Array<{id:string, blockedBy?:string[], blocks?:string[]}>} tasks
 * @returns {Map<string, number>}
 */
export function buildDepthMap(tasks) {
  const depthMap = new Map();
  // Build parent→children adjacency (who blocks whom)
  const parentIds = new Map();

  tasks.forEach(t => {
    if (!parentIds.has(t.id)) parentIds.set(t.id, new Set());
    (t.blockedBy || []).forEach(bid => parentIds.get(t.id).add(bid));
    (t.blocks || []).forEach(bid => {
      if (!parentIds.has(bid)) parentIds.set(bid, new Set());
      parentIds.get(bid).add(t.id);
    });
  });

  function depth(id, visited) {
    if (depthMap.has(id)) return depthMap.get(id);
    // Cycle guard: if we've visited this node in the current DFS path, return 0
    if (visited.has(id)) return 0;
    visited.add(id);
    const parents = parentIds.get(id) || new Set();
    if (parents.size === 0) {
      depthMap.set(id, 0);
      return 0;
    }
    // Recurse with a NEW visited set for each parent to allow diamond dependencies
    const max = Math.max(...[...parents].map(pid => depth(pid, new Set(visited))));
    const d = max + 1;
    depthMap.set(id, d);
    return d;
  }

  tasks.forEach(t => depth(t.id, new Set()));
  return depthMap;
}

// ── computeCriticalPath ───────────────────────────────────────────────────────
/**
 * Finds the critical path — the longest chain of task dependencies.
 * Uses a walk-back from the deepest nodes to root.
 *
 * @param {Array} tasks
 * @param {Map<string, number>} depthMap - from buildDepthMap()
 * @returns {Set<string>} task IDs on the critical path
 */
export function computeCriticalPath(tasks, depthMap) {
  if (!depthMap || depthMap.size === 0) return new Set();

  const maxDepth = Math.max(0, ...[...depthMap.values()]);
  if (maxDepth === 0) return new Set();

  const taskById = new Map(tasks.map(t => [t.id, t]));
  const criticalSet = new Set();

  // Walk back from each deepest-level task through its blocker chain
  function walkBack(taskId, visited) {
    if (visited.has(taskId)) return;
    visited.add(taskId);
    criticalSet.add(taskId);
    const task = taskById.get(taskId);
    if (!task) return;
    (task.blockedBy || []).forEach(bid => {
      if (taskById.has(bid)) walkBack(bid, visited);
    });
  }

  tasks
    .filter(t => depthMap.get(t.id) === maxDepth)
    .forEach(t => walkBack(t.id, new Set()));

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
