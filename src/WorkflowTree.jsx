import { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircleDot, PlayCircle, Eye, CheckCircle2, Zap,
  Users, GitBranch, ZapOff, X, Layers, Search,
  AlertCircle, Crown, Clock, ChevronRight,
  Plus, Minus, Maximize2, Filter,
} from 'lucide-react';
import { COLUMNS } from './utils/constants';
import {
  buildDepthMap,
  computeCriticalPath,
  detectBottlenecks,
  buildDependencyPairs,
} from './utils/workflowLayout';

/* ─────────────────────────────────────────────────────────────────────────────
   Static config maps — Tailwind class strings kept static so PurgeCSS retains them.
   ───────────────────────────────────────────────────────────────────────────── */

const STATUS_CFG = {
  'todo': {
    label: 'To‑Do', Icon: CircleDot,
    text: 'text-slate-600 dark:text-slate-400',
    dot: '#94a3b8', glow: 'rgba(148,163,184,0.4)',
    cardBg: 'bg-slate-50 dark:bg-slate-800/20',
    border: 'border-slate-200 dark:border-slate-700',
  },
  'in-progress': {
    label: 'In Progress', Icon: PlayCircle,
    text: 'text-blue-600 dark:text-blue-400',
    dot: '#3b82f6', glow: 'rgba(59,130,246,0.4)',
    cardBg: 'bg-blue-50/40 dark:bg-blue-500/5',
    border: 'border-blue-200 dark:border-blue-500/30',
  },
  'review': {
    label: 'Review', Icon: Eye,
    text: 'text-amber-600 dark:text-amber-400',
    dot: '#f59e0b', glow: 'rgba(245,158,11,0.4)',
    cardBg: 'bg-amber-50/40 dark:bg-amber-500/5',
    border: 'border-amber-200 dark:border-amber-500/30',
  },
  'done': {
    label: 'Done', Icon: CheckCircle2,
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: '#10b981', glow: 'rgba(16,185,129,0.4)',
    cardBg: 'bg-emerald-50/40 dark:bg-emerald-500/5',
    border: 'border-emerald-200 dark:border-emerald-500/30',
  },
};

// Static priority classes to ensure Tailwind doesn't tree-shake them
const PRI_CFG = {
  urgent: {
    label: 'Urgent',
    leftBorder: 'border-l-rose-500',
    badge: 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    dot: 'bg-rose-500',
    sort: 0,
  },
  high: {
    label: 'High',
    leftBorder: 'border-l-orange-500',
    badge: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
    dot: 'bg-orange-500',
    sort: 1,
  },
  medium: {
    label: 'Medium',
    leftBorder: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    dot: 'bg-blue-500',
    sort: 2,
  },
  low: {
    label: 'Low',
    leftBorder: 'border-l-slate-300 dark:border-l-slate-600',
    badge: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    dot: 'bg-slate-400',
    sort: 3,
  },
};

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.1;

/* ─────────────────────────────────────────────────────────────────────────────
   Pure helper functions — no hooks, safe to call anywhere
   ───────────────────────────────────────────────────────────────────────────── */

function isOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  try {
    const d = new Date(dueDateStr);
    return !isNaN(d.getTime()) && d < new Date();
  } catch {
    return false;
  }
}

function formatDueDate(dueDateStr) {
  if (!dueDateStr) return null;
  try {
    const d = new Date(dueDateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/* ─────────────────────────────────────────────────────────────────────────────
   AvatarFallback — secure avatar render with onError guard (no XSS risk)
   ───────────────────────────────────────────────────────────────────────────── */
const AvatarFallback = memo(function AvatarFallback({ src, name, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-9 h-9 text-sm';
  const initial = typeof name === 'string' && name.length > 0 ? name[0].toUpperCase() : '?';

  if (src) {
    return (
      <img
        src={src}
        className={`${dim} rounded-full border border-white dark:border-slate-800 shadow-sm flex-shrink-0 object-cover`}
        alt=""
        loading="lazy"
        /* onError: hide broken image — no JS injection risk (event target is the img element) */
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  if (name && name !== 'unassigned') {
    return (
      <div className={`${dim} rounded-full border border-white dark:border-slate-800 bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 flex-shrink-0`}>
        {initial}
      </div>
    );
  }
  return (
    <div className={`${dim} rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0`}>
      <Users size={size === 'sm' ? 10 : 14} className="text-slate-400" />
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   TaskNode — Rich memoized card for the dependency canvas
   ───────────────────────────────────────────────────────────────────────────── */
const TaskNode = memo(function TaskNode({
  task, isSelected, isCritical, isBottleneck, dimmed, onSelect,
}) {
  const sCfg = STATUS_CFG[task.status] || STATUS_CFG['todo'];
  const pCfg = PRI_CFG[task.priority] || PRI_CFG['low'];
  const overdue = isOverdue(task.dueDate);
  const dueLabel = formatDueDate(task.dueDate);

  const subtasks = task.subtasks || [];
  const completedSubs = subtasks.filter(s => s.completed).length;
  const subPct = subtasks.length > 0 ? (completedSubs / subtasks.length) * 100 : -1;

  const blockerCnt = (task.blockedBy || []).length;
  const blocksCnt = (task.blocks || []).length;

  return (
    <div
      data-task-id={task.id}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(task)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect(task)}
      aria-pressed={isSelected}
      aria-label={`Task: ${task.title || 'Untitled'}`}
      style={{
        opacity: dimmed ? 0.18 : 1,
        transition: 'opacity 0.2s ease, transform 0.15s ease, box-shadow 0.15s ease',
      }}
      className={[
        'relative w-[264px] rounded-xl border border-l-4 p-4 cursor-pointer flex-shrink-0',
        'bg-white dark:bg-[#18181b] select-none focus:outline-none',
        pCfg.leftBorder,
        isSelected
          ? 'border-violet-400 dark:border-violet-500 ring-2 ring-violet-400/25 shadow-lg shadow-violet-500/10'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-px',
        isCritical && !isSelected ? 'workflow-critical-node' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Critical path crown badge */}
      {isCritical && (
        <div
          className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-md z-10"
          aria-label="On critical path"
          title="On critical path"
        >
          <Crown size={9} className="text-white" />
        </div>
      )}

      {/* Bottleneck badge */}
      {isBottleneck && (
        <div className="absolute -top-2.5 left-3 flex items-center gap-0.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow z-10">
          <AlertCircle size={8} />
          BLOCKER
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${sCfg.text}`}>
          {sCfg.label}
        </span>
        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
          TSK-{String(task.id || '').slice(0, 5).toUpperCase()}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-3">
        {task.title || 'Untitled Task'}
      </h4>

      {/* Subtask progress bar */}
      {subPct >= 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Subtasks</span>
            <span className="text-[9px] font-bold text-slate-500 tabular-nums">{completedSubs}/{subtasks.length}</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${subPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-1 pt-2.5 border-t border-slate-100 dark:border-slate-800/70">
        <div className="flex items-center gap-1 flex-wrap min-w-0">
          {/* Priority */}
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${pCfg.badge}`}>
            {pCfg.label}
          </span>

          {/* Due date */}
          {dueLabel && (
            <span className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
              overdue
                ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              <Clock size={8} aria-hidden="true" />
              {dueLabel}
            </span>
          )}

          {/* Dependency count badges */}
          {blockerCnt > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 flex-shrink-0"
              title={`Blocked by ${blockerCnt} task${blockerCnt !== 1 ? 's' : ''}`}>
              ⬆{blockerCnt}
            </span>
          )}
          {blocksCnt > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 flex-shrink-0"
              title={`Blocks ${blocksCnt} task${blocksCnt !== 1 ? 's' : ''}`}>
              ⬇{blocksCnt}
            </span>
          )}
        </div>

        {/* Avatar */}
        <AvatarFallback src={task.assigneeAvatar || null} name={task.assigneeName || (task.assigneeId ? 'U' : null)} size="sm" />
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   ConnectorLayer — zoom-aware animated SVG edges
   ───────────────────────────────────────────────────────────────────────────── */
function ConnectorLayer({ tasks, innerRef, zoom, selectedTaskId, criticalPathIds }) {
  const [paths, setPaths] = useState([]);
  const rafRef = useRef(null);

  const depPairs = useMemo(() => buildDependencyPairs(tasks), [tasks]);

  const recalc = useCallback(() => {
    const ct = innerRef.current;
    if (!ct || depPairs.length === 0) { setPaths([]); return; }

    const ctRect = ct.getBoundingClientRect();
    // All coords must be in the container's LOCAL coordinate space.
    // getBoundingClientRect returns VIEWPORT coords; divide by zoom to convert.
    const invZoom = zoom > 0 ? 1 / zoom : 1;

    const next = [];

    depPairs.forEach(({ blocker, blocked }) => {
      const srcEl = ct.querySelector(`[data-task-id="${blocker.id}"]`);
      const tgtEl = ct.querySelector(`[data-task-id="${blocked.id}"]`);
      if (!srcEl || !tgtEl) return;

      const sr = srcEl.getBoundingClientRect();
      const tr = tgtEl.getBoundingClientRect();

      // Convert viewport → local (unzoomed) container coords
      const sx = (sr.right  - ctRect.left) * invZoom;
      const sy = (sr.top + sr.height / 2 - ctRect.top) * invZoom;
      const tx = (tr.left   - ctRect.left) * invZoom - 8; // small gap before arrowhead
      const ty = (tr.top + tr.height / 2 - ctRect.top) * invZoom;

      if (Math.hypot(tx - sx, ty - sy) < 8) return;

      // Cubic bezier: horizontal control handles for smooth S-curves
      const cx = (sx + tx) / 2;
      const d = `M ${sx},${sy} C ${cx},${sy} ${cx},${ty} ${tx},${ty}`;

      const isCritical  = criticalPathIds.has(blocker.id) && criticalPathIds.has(blocked.id);
      const isUpstream  = selectedTaskId != null && blocked.id === selectedTaskId;
      const isDownstream= selectedTaskId != null && blocker.id === selectedTaskId;
      const isRelated   = isUpstream || isDownstream;

      next.push({ id: `${blocker.id}\u2192${blocked.id}`, d, isCritical, isRelated, isUpstream });
    });

    setPaths(next);
  }, [depPairs, innerRef, zoom, selectedTaskId, criticalPathIds]);

  const scheduleRecalc = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(recalc);
  }, [recalc]);

  // Recalculate on mount and whenever deps change.
  // zoom is included explicitly: when zoom changes the DOM transform updates
  // synchronously via applyCanvasTransform, but we still need a new rAF pass
  // to recompute getBoundingClientRect in the new coordinate space.
  useLayoutEffect(() => {
    scheduleRecalc();
    // Staggered retries for async DOM paint
    const t1 = setTimeout(scheduleRecalc, 80);
    const t2 = setTimeout(scheduleRecalc, 350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
   
  }, [scheduleRecalc, zoom]);

  // Observe DOM mutations (task node additions/removals) and resize
  useEffect(() => {
    const ct = innerRef.current;
    if (!ct) return;

    const ro = new window.ResizeObserver(scheduleRecalc);
    ro.observe(ct);

    const mo = new window.MutationObserver(scheduleRecalc);
    mo.observe(ct, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['style', 'class'],
    });

    window.addEventListener('resize', scheduleRecalc, { passive: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', scheduleRecalc);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [innerRef, scheduleRecalc]);

  if (paths.length === 0) return null;

  const hasSelection = selectedTaskId != null;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        overflow: 'visible', pointerEvents: 'none', zIndex: 0,
      }}
    >
      <defs>
        <marker id="wf-arr-default" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,1 L0,5 L5,3 z" fill="#94a3b8" />
        </marker>
        <marker id="wf-arr-critical" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,1 L0,5 L5,3 z" fill="#fb923c" />
        </marker>
        <marker id="wf-arr-up" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,1 L0,5 L5,3 z" fill="#3b82f6" />
        </marker>
        <marker id="wf-arr-down" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,1 L0,5 L5,3 z" fill="#f43f5e" />
        </marker>
        <filter id="wf-critical-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {paths.map(({ id, d, isCritical, isRelated, isUpstream }) => {
        const dimmed = hasSelection && !isRelated && !isCritical;

        if (isCritical) {
          return (
            <g key={id}>
              {/* Glow halo */}
              <path d={d} fill="none" stroke="#fb923c" strokeWidth="5"
                strokeOpacity={dimmed ? 0.05 : 0.12} filter="url(#wf-critical-glow)" />
              {/* Main stroke */}
              <path d={d} fill="none" stroke="#fb923c" strokeWidth="2.5"
                strokeOpacity={dimmed ? 0.08 : 1} strokeLinecap="round"
                markerEnd="url(#wf-arr-critical)" className="workflow-critical-edge" />
            </g>
          );
        }

        if (isRelated) {
          const color  = isUpstream ? '#3b82f6' : '#f43f5e';
          const marker = isUpstream ? 'wf-arr-up' : 'wf-arr-down';
          return (
            <path key={id} d={d} fill="none" stroke={color} strokeWidth="2.5"
              strokeOpacity="1" strokeLinecap="round" markerEnd={`url(#${marker})`} />
          );
        }

        return (
          <path key={id} d={d} fill="none" stroke="#94a3b8" strokeWidth="1.5"
            strokeDasharray="5 4" strokeLinecap="round"
            strokeOpacity={dimmed ? 0.06 : 0.45}
            markerEnd="url(#wf-arr-default)" className="workflow-edge-flow" />
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MiniMap — lightweight thumbnail of the canvas
   ───────────────────────────────────────────────────────────────────────────── */
const MiniMap = memo(function MiniMap({ columns, pan, zoom, vpW, vpH }) {
  const W = 156;
  const H = 96;
  const PAD = 10;
  const NODE_W = 264;
  const NODE_H = 140; // approximate rendered height
  const COL_GAP = 96;
  const ROW_GAP = 20;

  const { dots, vRect } = useMemo(() => {
    if (columns.length === 0 || columns.every(c => c.length === 0)) {
      return { dots: [], vRect: null };
    }

    const totalCols = columns.length;
    const maxRows   = Math.max(...columns.map(c => c.length));
    const totalW = totalCols * (NODE_W + COL_GAP) - COL_GAP;
    const totalH = maxRows  * (NODE_H + ROW_GAP) - ROW_GAP;

    const scaleX = (W - PAD * 2) / (totalW || 1);
    const scaleY = (H - PAD * 2) / (totalH || 1);
    const scale  = Math.min(scaleX, scaleY);

    const dots = [];
    columns.forEach((colTasks, ci) => {
      colTasks.forEach((task, ri) => {
        const x = PAD + ci * (NODE_W + COL_GAP) * scale + NODE_W * scale / 2;
        const y = PAD + ri * (NODE_H + ROW_GAP) * scale + NODE_H * scale / 2;
        const cfg = STATUS_CFG[task.status] || STATUS_CFG['todo'];
        dots.push({ id: task.id, x, y, color: cfg.dot });
      });
    });

    // Viewport rectangle in minimap coords
    const vx = PAD + (-pan.x / zoom) * scale;
    const vy = PAD + (-pan.y / zoom) * scale;
    const vw = (vpW / zoom) * scale;
    const vh = (vpH / zoom) * scale;

    return { dots, vRect: { x: vx, y: vy, w: vw, h: vh } };
  }, [columns, pan, zoom, vpW, vpH]);

  if (dots.length === 0) return null;

  return (
    <div
      className="absolute bottom-4 right-4 z-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg overflow-hidden"
      style={{ width: W, height: H }}
      aria-hidden="true"
    >
      <svg width={W} height={H}>
        {dots.map(dot => (
          <circle key={dot.id} cx={dot.x} cy={dot.y} r="3.5" fill={dot.color} opacity="0.75" />
        ))}
        {vRect && (
          <rect
            x={Math.max(0, vRect.x)} y={Math.max(0, vRect.y)}
            width={clamp(vRect.w, 0, W)} height={clamp(vRect.h, 0, H)}
            fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.5)"
            strokeWidth="1" rx="2"
          />
        )}
      </svg>
      <p className="absolute bottom-0.5 left-1 text-[7px] font-bold text-slate-400 uppercase tracking-widest">
        minimap
      </p>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   DonutChart — pure SVG radial task breakdown
   ───────────────────────────────────────────────────────────────────────────── */
const DonutChart = memo(function DonutChart({ done, review, inProgress, todo, total }) {
  const SIZE   = 64;
  const STROKE = 8;
  const R      = (SIZE - STROKE) / 2;
  const C      = 2 * Math.PI * R;
  const cx     = SIZE / 2;
  const cy     = SIZE / 2;

  const segments = useMemo(() => {
    if (total === 0) return [];
    const segs = [
      { count: done,       color: '#10b981' },
      { count: review,     color: '#f59e0b' },
      { count: inProgress, color: '#3b82f6' },
      { count: todo,       color: '#94a3b8' },
    ];
    let offsetCount = 0;
    return segs
      .filter(s => s.count > 0)
      .map(s => {
        const dash = (s.count / total) * C;
        const gap  = C - dash;
        const rot  = (offsetCount / total) * 360 - 90;
        offsetCount += s.count;
        return { ...s, dash, gap, rot };
      });
  }, [done, review, inProgress, todo, total, C]);

  const donePct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-label={`${donePct}% done`} role="img">
      {/* Track */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e2e8f0" strokeWidth={STROKE} className="dark:stroke-slate-800" />
      {/* Segments */}
      {segments.map((s) => (
        <circle
          key={s.color} cx={cx} cy={cy} r={R} fill="none"
          stroke={s.color} strokeWidth={STROKE}
          strokeDasharray={`${s.dash} ${s.gap}`}
          transform={`rotate(${s.rot} ${cx} ${cy})`}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dasharray 0.7s ease' }}
        />
      ))}
      {/* Centre text */}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="13" fontWeight="800" fill="currentColor" className="text-slate-900 dark:text-white">
        {donePct}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="700" letterSpacing="0.5">
        %done
      </text>
    </svg>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   HealthBanner — board health at a glance
   ───────────────────────────────────────────────────────────────────────────── */
function HealthBanner({ tasks }) {
  // tasks is already pre-filtered (activeTasks) — no need to re-filter archived
  const stats = useMemo(() => {
    const done  = tasks.filter(t => t.status === 'done').length;
    const total = tasks.length;
    const now   = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const overdue = tasks.filter(t => t.status !== 'done' && isOverdue(t.dueDate)).length;
    const dueWeek = tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      try {
        const d = new Date(t.dueDate);
        return !isNaN(d.getTime()) && d >= now && d <= weekEnd;
      } catch { return false; }
    }).length;

    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, overdue, dueWeek, pct };
  }, [tasks]);

  // Static class sets to preserve Tailwind purge
  const themeClasses = stats.pct >= 75
    ? { wrap: 'bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20', icon: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' }
    : stats.pct >= 40
    ? { wrap: 'bg-amber-50/60 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20', icon: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' }
    : { wrap: 'bg-rose-50/60 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20', icon: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' };

  return (
    <div className={`w-full rounded-xl border p-4 mb-6 flex-shrink-0 ${themeClasses.wrap}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${themeClasses.icon}`}>
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Board Health</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {stats.pct}<span className="text-sm font-semibold text-slate-400">%</span>
              <span className="text-sm font-semibold text-slate-400 ml-1">complete</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <div className="text-center">
            <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
              {stats.done}<span className="text-sm text-slate-400">/{stats.total}</span>
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Done</p>
          </div>
          <div className="text-center">
            <p className={`text-xl font-black tabular-nums ${stats.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
              {stats.overdue}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Overdue</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{stats.dueWeek}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Due This Week</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${themeClasses.bar}`}
          style={{ width: `${stats.pct}%` }}
          role="progressbar"
          aria-valuenow={stats.pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ArcPipeline — SVG-connected stage selector
   ───────────────────────────────────────────────────────────────────────────── */
function ArcPipeline({ metrics, activeId, onSelect, totalTasks }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 flex-shrink-0">
      {metrics.map(col => {
        const cfg    = STATUS_CFG[col.id] || STATUS_CFG['todo'];
        const Icon   = cfg.Icon;
        const isActive = col.id === activeId;
        const pct    = totalTasks > 0 ? Math.round((col.total / totalTasks) * 100) : 0;

        return (
          <motion.button
            key={col.id}
            id={`btn-stage-${col.id}`}
            onClick={() => onSelect(col.id)}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.97 }}
            aria-pressed={isActive}
            className={[
              'relative flex flex-col gap-3 p-4 rounded-2xl border-2 text-left overflow-hidden transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
              isActive
                ? 'shadow-lg'
                : 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md',
            ].join(' ')}
            style={isActive ? {
              borderColor: cfg.dot,
              background: `linear-gradient(135deg, ${cfg.dot}12 0%, ${cfg.dot}06 100%)`,
            } : {}}
          >
            {/* Animated top accent bar */}
            {isActive && (
              <motion.div
                layoutId="stage-accent-bar"
                className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, ${cfg.dot}, ${cfg.dot}88)` }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}

            {/* Icon bubble + task count */}
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200"
                style={{
                  backgroundColor: isActive ? `${cfg.dot}25` : `${cfg.dot}15`,
                  boxShadow: isActive ? `0 0 0 1px ${cfg.dot}30` : 'none',
                }}
              >
                <Icon
                  size={19}
                  style={{ color: cfg.dot }}
                  aria-hidden="true"
                />
              </div>

              <span
                className="text-3xl font-black tabular-nums leading-none"
                style={{ color: isActive ? cfg.dot : undefined }}
              >
                {col.total}
              </span>
            </div>

            {/* Stage label + board share */}
            <div className="min-w-0">
              <p
                className="text-sm font-bold leading-tight truncate"
                style={{ color: isActive ? cfg.dot : undefined }}
              >
                {isActive ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cfg.dot }}
                      aria-hidden="true"
                    />
                    {col.title}
                  </span>
                ) : (
                  <span className="text-slate-600 dark:text-slate-400">{col.title}</span>
                )}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 tabular-nums">
                {pct}% of board
              </p>
            </div>

            {/* Mini progress bar */}
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cfg.dot }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.05 }}
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────────
   Main: WorkflowTree
   ───────────────────────────────────────────────────────────────────────────── */
export default function WorkflowTree({ tasks }) {
  /* ── View state ── */
  const [viewMode,       setViewMode]       = useState('stages');
  const [activeStageId,  setActiveStageId]  = useState(COLUMNS[0]?.id || 'todo');
  // selectedTaskId only — we re-derive the full object from filteredTasks each render
  // so the panel never shows stale data when a task is edited/deleted upstream.
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  /* ── Search & filter ── */
  const [searchQuery,    setSearchQuery]    = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  /* ── Canvas pan/zoom ── */
  const [zoom, setZoom] = useState(1);
  const [pan,  setPan]  = useState({ x: 0, y: 0 });

  /* ── Refs ── */
  const backdropRef  = useRef(null); // outer pan/zoom container (for wheel listener)
  const canvasRef    = useRef(null); // inner transformed div
  const innerRef     = useRef(null); // connector layer target (wraps nodes + SVG)
  const dragStart    = useRef(null); // { x, y } pointer offset at drag start
  const panRef       = useRef({ x: 0, y: 0 }); // live pan during drag (avoids re-render)
  const animFrame    = useRef(null);
  const isDragging   = useRef(false);

  // Cache viewport size for minimap (updated lazily, no RAF needed)
  const vpSize = useRef({ w: 800, h: 600 });

  /* ── Computed graph data ── */
  const activeTasks = useMemo(() => tasks.filter(t => !t.archived), [tasks]);

  const filteredTasks = useMemo(() => {
    let result = activeTasks;
    const q = searchQuery.trim().toLowerCase();
    if (q) result = result.filter(t => (t.title || '').toLowerCase().includes(q));
    if (priorityFilter !== 'all') result = result.filter(t => t.priority === priorityFilter);
    return result;
  }, [activeTasks, searchQuery, priorityFilter]);

  const depthMap       = useMemo(() => buildDepthMap(filteredTasks), [filteredTasks]);
  const criticalPathIds = useMemo(() => computeCriticalPath(filteredTasks, depthMap), [filteredTasks, depthMap]);
  const bottlenecks    = useMemo(() => detectBottlenecks(filteredTasks), [filteredTasks]);

  const { columns, maxDepth } = useMemo(() => {
    const maxD = depthMap.size ? Math.max(0, ...[...depthMap.values()]) : 0;
    const cols = Array.from({ length: maxD + 1 }, () => []);
    filteredTasks.forEach(t => {
      const d = depthMap.get(t.id) ?? 0;
      if (cols[d]) cols[d].push(t);
    });
    // Sort each column by priority urgency → stable visual order
    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
    cols.forEach(col => col.sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2)));
    return { columns: cols, maxDepth: maxD };
  }, [filteredTasks, depthMap]);

  const stageMetrics = useMemo(() => COLUMNS.map(col => {
    const colTasks = activeTasks.filter(t => t.status === col.id);
    const cfg = STATUS_CFG[col.id] || STATUS_CFG['todo'];
    return {
      ...col,
      total: colTasks.length,
      tasks: colTasks,
      urgent: colTasks.filter(t => t.priority === 'urgent').length,
      high:   colTasks.filter(t => t.priority === 'high').length,
      // icon is NOT on COLUMNS — pull it from STATUS_CFG so empty-state renders correctly
      icon: cfg.Icon,
    };
  }), [activeTasks]);

  const teamMetrics = useMemo(() => {
    const map = new Map();
    activeTasks.forEach(t => {
      const uid = t.assigneeId || 'unassigned';
      if (!map.has(uid)) {
        map.set(uid, {
          id: uid,
          name:   t.assigneeName   || (t.assigneeId ? 'Unknown' : 'Unassigned'),
          avatar: t.assigneeAvatar || null,
          tasks:  { todo: 0, 'in-progress': 0, review: 0, done: 0 },
          total:  0,
        });
      }
      const u = map.get(uid);
      if (u.tasks[t.status] !== undefined) { u.tasks[t.status]++; u.total++; }
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [activeTasks]);

  // Derive the live task object from filteredTasks on every render.
  // This prevents stale data in the detail panel when tasks are edited externally.
  const selectedTask = useMemo(
    () => (selectedTaskId ? filteredTasks.find(t => t.id === selectedTaskId) ?? null : null),
    [selectedTaskId, filteredTasks],
  );

  const totalActiveTasks = activeTasks.length || 1;

  /* ── Selected task path tracing ── */
  const highlightedIds = useMemo(() => {
    if (!selectedTask) return null;
    const s = new Set([selectedTask.id]);
    (selectedTask.blockedBy || []).forEach(id => s.add(id));
    (selectedTask.blocks    || []).forEach(id => s.add(id));
    return s;
  }, [selectedTask]);

  /* ── Canvas transform helpers ── */
  const applyCanvasTransform = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const { x, y } = panRef.current;
    el.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
  }, [zoom]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setZoom(z => parseFloat(clamp(z + delta, ZOOM_MIN, ZOOM_MAX).toFixed(2)));
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target.closest('[data-task-id]')) return; // let node clicks through
    e.preventDefault();
    isDragging.current = true;
    dragStart.current  = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    // Update cursor reactively via DOM attribute — avoids re-render on every pointermove
    if (backdropRef.current) backdropRef.current.style.cursor = 'grabbing';
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current || !dragStart.current) return;
    panRef.current = {
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    };
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(applyCanvasTransform);
  }, [applyCanvasTransform]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    dragStart.current  = null;
    if (backdropRef.current) backdropRef.current.style.cursor = 'grab';
    // Sync React state so minimap re-renders with correct viewport rect
    setPan({ ...panRef.current });
  }, []);

  const handleZoomIn    = useCallback(() => setZoom(z => parseFloat(clamp(z + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX).toFixed(2))), []);
  const handleZoomOut   = useCallback(() => setZoom(z => parseFloat(clamp(z - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX).toFixed(2))), []);
  const handleZoomReset = useCallback(() => {
    panRef.current = { x: 0, y: 0 };
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleNodeSelect = useCallback((task) => {
    setSelectedTaskId(prev => prev === task.id ? null : task.id);
  }, []);

  // Sync canvas transform when zoom changes (e.g., via buttons)
  useEffect(() => { applyCanvasTransform(); }, [applyCanvasTransform]);

  // Attach non-passive wheel listener for zoom (must preventDefault)
  useEffect(() => {
    const el = backdropRef.current;
    if (!el || viewMode !== 'dependency') return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel, viewMode]);

  // Track viewport size for minimap
  useEffect(() => {
    const el = backdropRef.current;
    if (!el) return;
    const ro = new window.ResizeObserver(entries => {
      const e = entries[0];
      if (e) vpSize.current = { w: e.contentRect.width, h: e.contentRect.height };
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Cleanup rAF on unmount
  useEffect(() => () => { if (animFrame.current) cancelAnimationFrame(animFrame.current); }, []);

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#09090b] relative overflow-hidden">

      {/* ── Header: Tab Control + Search + Filter + Zoom ── */}
      <div className="shrink-0 z-20 bg-white dark:bg-[#18181b] border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-4 md:px-6 py-3 flex-wrap gap-y-2">

          {/* Pill segment control */}
          <div className="relative inline-flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 flex-shrink-0">
            {[
              { id: 'stages',     label: 'Stages', Icon: Layers    },
              { id: 'dependency', label: 'Canvas', Icon: GitBranch },
              { id: 'team',       label: 'Team',   Icon: Users     },
            ].map(tab => (
              <button
                key={tab.id}
                id={`btn-workflow-${tab.id}`}
                onClick={() => setViewMode(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold z-10 transition-colors duration-150 ${
                  viewMode === tab.id
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
                aria-pressed={viewMode === tab.id}
              >
                {viewMode === tab.id && (
                  <motion.div
                    layoutId="wf-tab-indicator"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <tab.Icon size={13} className="relative z-10" aria-hidden="true" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-0 max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              id="input-workflow-search"
              type="search"
              placeholder="Search tasks…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
              aria-label="Search tasks"
            />
          </div>

          {/* Priority filter */}
          <div className="relative flex-shrink-0">
            <Filter size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
            <select
              id="select-workflow-priority"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="text-xs pl-6 pr-2 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 cursor-pointer"
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Zoom controls — canvas only */}
          <AnimatePresence>
            {viewMode === 'dependency' && (
              <motion.div
                key="zoom-controls"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-1 flex-shrink-0"
              >
                <button id="btn-zoom-out" onClick={handleZoomOut} aria-label="Zoom out"
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Minus size={12} />
                </button>
                <button id="btn-zoom-reset" onClick={handleZoomReset} aria-label="Reset zoom"
                  className="px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </button>
                <button id="btn-zoom-in" onClick={handleZoomIn} aria-label="Zoom in"
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Plus size={12} />
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" aria-hidden="true" />
                <button id="btn-zoom-fit" onClick={handleZoomReset} aria-label="Fit to view"
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Maximize2 size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Views ── */}
      <AnimatePresence mode="wait">

        {/* ══════════════════════════════ STAGES VIEW ══════════════════════════ */}
        {viewMode === 'stages' && (
          <motion.div
            key="stages"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex-1 w-full overflow-y-auto custom-scrollbar relative z-10 px-4 md:px-8 pb-10 pt-6"
          >
            <div className="w-full max-w-5xl mx-auto flex flex-col">
              <HealthBanner tasks={activeTasks} />

              <ArcPipeline
                metrics={stageMetrics}
                activeId={activeStageId}
                onSelect={setActiveStageId}
                totalTasks={totalActiveTasks}
              />

              {/* AnimatePresence requires real children (not null) to track exit animations.
                  Filter to the single active col before mapping so exit fires correctly. */}
              <AnimatePresence mode="wait">
                {stageMetrics.filter(col => col.id === activeStageId).map(col => {
                  const pct = Math.round((col.total / totalActiveTasks) * 100);

                  return (
                    <motion.div
                      key={col.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-5"
                    >
                      {/* Metric strip */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Stage Volume', value: col.total,                       sub: `${pct}% of board`, accentCls: 'text-violet-500 dark:text-violet-400', Icon: Layers       },
                          { label: 'Urgent',        value: col.urgent,                      sub: null,               accentCls: 'text-rose-500 dark:text-rose-400',   Icon: Zap           },
                          { label: 'High Priority', value: col.high,                        sub: null,               accentCls: 'text-orange-500 dark:text-orange-400', Icon: Zap          },
                          { label: 'Normal / Low',  value: col.total - col.urgent - col.high, sub: null,             accentCls: 'text-slate-400',                     Icon: Filter        },
                        ].map(card => (
                          <div key={card.label} className="bg-white dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-start justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                            <div>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${card.accentCls}`}>{card.label}</p>
                              <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{card.value}</p>
                              {card.sub && <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>}
                            </div>
                            <card.Icon size={15} className={`${card.accentCls} mt-1 group-hover:scale-110 transition-transform`} aria-hidden="true" />
                          </div>
                        ))}
                      </div>

                      {/* Task grid */}
                      {col.tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <col.icon size={28} className="text-slate-300 dark:text-slate-700 mb-3" aria-hidden="true" />
                          <p className="text-sm font-semibold text-slate-400">No tasks in this stage</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-6">
                          {col.tasks.map(task => {
                            const pCfg  = PRI_CFG[task.priority] || PRI_CFG['low'];
                            const over  = isOverdue(task.dueDate);
                            const dLbl  = formatDueDate(task.dueDate);
                            return (
                              <div
                                key={task.id}
                                className={`group flex flex-col gap-2.5 p-4 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 border-l-4 ${pCfg.leftBorder} hover:shadow-md hover:-translate-y-px transition-all duration-150`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                    {task.title || 'Untitled'}
                                  </h4>
                                  {over && (
                                    <span className="flex-shrink-0 text-[9px] font-black text-rose-600 bg-rose-100 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">
                                      OVERDUE
                                    </span>
                                  )}
                                </div>

                                {dLbl && (
                                  <div className={`flex items-center gap-1 text-[10px] font-bold ${over ? 'text-rose-500' : 'text-slate-400'}`}>
                                    <Clock size={9} aria-hidden="true" />{dLbl}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded tabular-nums">
                                      TSK-{String(task.id || '').slice(0, 5).toUpperCase()}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${pCfg.badge}`}>
                                      {pCfg.label}
                                    </span>
                                  </div>
                                  <AvatarFallback src={task.assigneeAvatar || null} name={task.assigneeName || (task.assigneeId ? 'U' : null)} size="sm" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════ DEPENDENCY CANVAS ═════════════════════════ */}
        {viewMode === 'dependency' && (
          <motion.div
            key="dependency"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex min-h-0 overflow-hidden relative z-10"
          >
            {filteredTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                <GitBranch size={36} aria-hidden="true" />
                <p className="text-sm font-bold">No tasks match your filters</p>
                <p className="text-xs">Clear the search or priority filter to see all tasks</p>
              </div>
            ) : (
              <>
                {/* Infinite pan-zoom backdrop */}
                <div
                  ref={backdropRef}
                  className="flex-1 relative overflow-hidden workflow-canvas-backdrop"
                  // cursor is driven by a data attribute toggled via DOM so we avoid
                  // forcing a React re-render on every pointermove during drag.
                  style={{ cursor: 'grab', userSelect: 'none' }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  role="region"
                  aria-label="Dependency canvas — drag to pan, scroll to zoom"
                >
                  {/* Transformed canvas root */}
                  <div
                    ref={canvasRef}
                    style={{
                      position: 'absolute',
                      top: 56, left: 56,
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: '0 0',
                      willChange: 'transform',
                    }}
                  >
                    {/* Inner div wraps both SVG and nodes so connector coords are in the same space */}
                    <div ref={innerRef} style={{ position: 'relative' }}>
                      <ConnectorLayer
                        tasks={filteredTasks}
                        innerRef={innerRef}
                        zoom={zoom}
                        selectedTaskId={selectedTask?.id ?? null}
                        criticalPathIds={criticalPathIds}
                      />

                      {/* Node columns — z-index above SVG */}
                      <div className="relative z-[1] flex gap-24 items-start">
                        {columns.map((colTasks, depth) => (
                          <div key={depth} className="flex flex-col gap-5 relative flex-shrink-0" style={{ minWidth: 264 }}>
                            {/* Depth label */}
                            <div className="absolute -top-8 left-0 flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                {depth === 0 ? 'Root' : `Level ${depth}`}
                              </span>
                              {depth === 0 && criticalPathIds.size > 0 && (
                                <span className="text-[9px] font-bold text-amber-500">↓ critical path</span>
                              )}
                            </div>

                            {colTasks.map(task => (
                              <TaskNode
                                key={task.id}
                                task={task}
                                isSelected={selectedTask?.id === task.id}
                                isCritical={criticalPathIds.has(task.id)}
                                isBottleneck={bottlenecks.has(task.id)}
                                dimmed={highlightedIds !== null && !highlightedIds.has(task.id)}
                                onSelect={handleNodeSelect}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* No-dependency notice */}
                  {maxDepth === 0 && filteredTasks.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center shadow-lg pointer-events-auto max-w-xs">
                        <ZapOff size={24} className="text-slate-400 mx-auto mb-3" aria-hidden="true" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No Dependencies</p>
                        <p className="text-xs text-slate-500">Add blocking relationships in the Task Modal to visualise the dependency graph here.</p>
                      </div>
                    </div>
                  )}

                  {/* MiniMap */}
                  <MiniMap
                    columns={columns}
                    pan={pan}
                    zoom={zoom}
                    vpW={vpSize.current.w}
                    vpH={vpSize.current.h}
                  />

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 shadow-sm" aria-hidden="true">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Legend</p>
                    <div className="flex items-center gap-1.5">
                      <svg width="20" height="2" aria-hidden="true"><line x1="0" y1="1" x2="20" y2="1" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
                      <span className="text-[9px] text-slate-500">Dependency</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="20" height="2" aria-hidden="true"><line x1="0" y1="1" x2="20" y2="1" stroke="#fb923c" strokeWidth="2" /></svg>
                      <span className="text-[9px] text-slate-500">Critical Path</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="20" height="2" aria-hidden="true"><line x1="0" y1="1" x2="20" y2="1" stroke="#3b82f6" strokeWidth="2" /></svg>
                      <span className="text-[9px] text-slate-500">Upstream blocker</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="20" height="2" aria-hidden="true"><line x1="0" y1="1" x2="20" y2="1" stroke="#f43f5e" strokeWidth="2" /></svg>
                      <span className="text-[9px] text-slate-500">Downstream blocked</span>
                    </div>
                  </div>
                </div>

                {/* ── Task Details Side Panel ── */}
                <AnimatePresence>
                  {selectedTask && selectedTaskId && (
                    <motion.aside
                      key="details-panel"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 300, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                      className="flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18181b] overflow-hidden z-20 shadow-2xl"
                      aria-label="Task details"
                    >
                      <div className="w-[300px] h-full flex flex-col overflow-y-auto custom-scrollbar">
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${(STATUS_CFG[selectedTask.status] || STATUS_CFG['todo']).text}`}>
                            {(STATUS_CFG[selectedTask.status] || STATUS_CFG['todo']).label}
                          </span>
                          <button
                            id="btn-close-task-details"
                            onClick={() => setSelectedTaskId(null)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            aria-label="Close details panel"
                          >
                            <X size={13} />
                          </button>
                        </div>

                        <div className="flex-1 p-5 space-y-5">
                          {/* Badges row */}
                          <div className="flex flex-wrap gap-1.5">
                            {criticalPathIds.has(selectedTask.id) && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded-full">
                                <Crown size={9} aria-hidden="true" /> Critical Path
                              </span>
                            )}
                            {bottlenecks.has(selectedTask.id) && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 px-2 py-0.5 rounded-full">
                                <AlertCircle size={9} aria-hidden="true" /> Bottleneck ×{bottlenecks.get(selectedTask.id)}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                              {selectedTask.title || 'Untitled'}
                            </h3>
                            <p className="text-[10px] font-mono text-slate-400 mt-1 tabular-nums">
                              TSK-{String(selectedTask.id || '').slice(0, 5).toUpperCase()}
                            </p>
                          </div>

                          {/* Description */}
                          {selectedTask.description && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {selectedTask.description}
                              </p>
                            </div>
                          )}

                          {/* Metadata grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Priority</p>
                              <p className={`text-xs font-bold ${(PRI_CFG[selectedTask.priority] || PRI_CFG['low']).badge.split(' ')[1]}`}>
                                {(PRI_CFG[selectedTask.priority] || PRI_CFG['low']).label}
                              </p>
                            </div>
                            {selectedTask.dueDate && (
                              <div className={`rounded-lg p-3 ${isOverdue(selectedTask.dueDate) ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Due Date</p>
                                <p className={`text-xs font-bold ${isOverdue(selectedTask.dueDate) ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {formatDueDate(selectedTask.dueDate)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Subtasks */}
                          {(selectedTask.subtasks || []).length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Subtasks ({(selectedTask.subtasks || []).filter(s => s.completed).length}/{(selectedTask.subtasks || []).length})
                              </p>
                              <ul className="space-y-1.5" role="list">
                                {(selectedTask.subtasks || []).map((s, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <div className={`w-3.5 h-3.5 rounded flex-shrink-0 mt-px flex items-center justify-center ${s.completed ? 'bg-emerald-500' : 'border border-slate-300 dark:border-slate-600'}`}>
                                      {s.completed && <span className="text-white text-[8px] leading-none">✓</span>}
                                    </div>
                                    <span className={`text-xs leading-tight ${s.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                      {s.text}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Dependencies */}
                          {((selectedTask.blockedBy || []).length > 0 || (selectedTask.blocks || []).length > 0) && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dependencies</p>

                              {(selectedTask.blockedBy || []).length > 0 && (
                                <div className="mb-3">
                                  <p className="text-[9px] font-bold text-amber-500 mb-1">⬆ Blocked by ({(selectedTask.blockedBy || []).length})</p>
                                  {(selectedTask.blockedBy || []).map(bid => {
                                    const bt = filteredTasks.find(t => t.id === bid);
                                    return bt ? (
                                      <button
                                        key={bid}
                                        onClick={() => handleNodeSelect(bt)}
                                        className="w-full text-left text-xs text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 py-0.5 flex items-center gap-1 transition-colors"
                                      >
                                        <ChevronRight size={10} aria-hidden="true" />
                                        {bt.title}
                                      </button>
                                    ) : null;
                                  })}
                                </div>
                              )}

                              {(selectedTask.blocks || []).length > 0 && (
                                <div>
                                  <p className="text-[9px] font-bold text-blue-500 mb-1">⬇ Blocks ({(selectedTask.blocks || []).length})</p>
                                  {(selectedTask.blocks || []).map(bid => {
                                    const bt = filteredTasks.find(t => t.id === bid);
                                    return bt ? (
                                      <button
                                        key={bid}
                                        onClick={() => handleNodeSelect(bt)}
                                        className="w-full text-left text-xs text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 py-0.5 flex items-center gap-1 transition-colors"
                                      >
                                        <ChevronRight size={10} aria-hidden="true" />
                                        {bt.title}
                                      </button>
                                    ) : null;
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.aside>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════ TEAM VIEW ════════════════════════════ */}
        {viewMode === 'team' && (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex-1 w-full overflow-y-auto custom-scrollbar relative z-10 px-4 md:px-8 pb-10 pt-6"
          >
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">

              {/* Needs Attention banner */}
              {teamMetrics.some(u => u.tasks['review'] > 0) && (
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex-shrink-0">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                    ⚠ Needs Attention
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...teamMetrics]
                      .sort((a, b) => b.tasks['review'] - a.tasks['review'])
                      .slice(0, 3)
                      .filter(u => u.tasks['review'] > 0)
                      .map(u => (
                        <div key={u.id} className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/20">
                          <AvatarFallback src={u.avatar} name={u.id === 'unassigned' ? null : u.name} size="sm" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{u.name}</span>
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold tabular-nums">{u.tasks['review']} in review</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* User cards */}
              {teamMetrics.map(user => {
                const t = user.tasks;
                const donePct = user.total > 0 ? Math.round((t.done / user.total) * 100) : 0;
                return (
                  <div key={user.id} className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Donut */}
                      <div className="flex-shrink-0">
                        <DonutChart
                          done={t.done} review={t.review}
                          inProgress={t['in-progress']} todo={t.todo}
                          total={user.total}
                        />
                      </div>

                      {/* Info block */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <AvatarFallback src={user.avatar} name={user.id === 'unassigned' ? null : user.name} size="lg" />
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</h3>
                            <p className="text-xs text-slate-400 tabular-nums">{user.total} task{user.total !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="ml-auto text-right flex-shrink-0">
                            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none">{donePct}%</p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase">done</p>
                          </div>
                        </div>

                        {/* Segmented bar */}
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex mb-3">
                          {user.total > 0 && (
                            <>
                              <div style={{ width: `${(t.done / user.total) * 100}%` }}         className="h-full bg-emerald-500 transition-all duration-700" />
                              <div style={{ width: `${(t.review / user.total) * 100}%` }}       className="h-full bg-amber-400 transition-all duration-700" />
                              <div style={{ width: `${(t['in-progress'] / user.total) * 100}%` }} className="h-full bg-blue-500 transition-all duration-700" />
                              <div style={{ width: `${(t.todo / user.total) * 100}%` }}         className="h-full bg-slate-300 dark:bg-slate-600 transition-all duration-700" />
                            </>
                          )}
                        </div>

                        {/* Stat pills */}
                        <div className="flex gap-1.5 flex-wrap">
                          {[
                            { key: 'todo',        label: 'To Do',       count: t.todo,           pillCls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',                             dotCls: 'bg-slate-400'  },
                            { key: 'in-progress', label: 'In Progress', count: t['in-progress'], pillCls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20',                            dotCls: 'bg-blue-500'   },
                            { key: 'review',      label: 'Review',      count: t.review,         pillCls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20',                       dotCls: 'bg-amber-500'  },
                            { key: 'done',        label: 'Done',        count: t.done,           pillCls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20',            dotCls: 'bg-emerald-500' },
                          ].filter(s => s.count > 0).map(s => (
                            <span key={s.key} className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[9px] font-bold ${s.pillCls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dotCls}`} aria-hidden="true" />
                              {s.label}: <span className="tabular-nums">{s.count}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {teamMetrics.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Users size={32} className="mb-3" aria-hidden="true" />
                  <p className="text-sm font-semibold">No team data yet</p>
                  <p className="text-xs">Assign tasks to team members to see progress here</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
