import { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CircleDot, PlayCircle, Eye, CheckCircle2, Zap, 
  Users, AlignLeft, GitBranch, ZapOff, Link, X, Layers
} from 'lucide-react';
import { COLUMNS, PRIORITIES } from './utils/constants';

/* ─────────────────────────────────────────────────────────────────────────────
   Shared Layout & Definitions
───────────────────────────────────────────────────────────────────────────── */

const ICONS = {
  'todo': CircleDot,
  'in-progress': PlayCircle,
  'review': Eye,
  'done': CheckCircle2
};

const COLORS = {
  'todo':        { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400' },
  'in-progress': { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/30', text: 'text-blue-600 dark:text-blue-400' },
  'review':      { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
  'done':        { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' }
};

const EDGE_COLOR = '#94a3b8'; // Unified minimalist gray for relationships

const STATUS_LABEL = {
  'todo': 'To‑Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done'
};

/* ─────────────────────────────────────────────────────────────────────────────
   Tree Computation Logic
───────────────────────────────────────────────────────────────────────────── */
function buildDepthMap(tasks) {
  const depthMap = new Map();
  const parentIds = new Map(); 

  tasks.forEach(t => {
    if (!parentIds.has(t.id)) parentIds.set(t.id, new Set());
    (t.blockedBy || []).forEach(bid => parentIds.get(t.id).add(bid));
    (t.blocks || []).forEach(bid => {
      if (!parentIds.has(bid)) parentIds.set(bid, new Set());
      parentIds.get(bid).add(t.id);
    });
  });

  function depth(id, visited = new Set()) {
    if (depthMap.has(id)) return depthMap.get(id);
    if (visited.has(id)) return 0;
    visited.add(id);
    const parents = parentIds.get(id) || new Set();
    if (parents.size === 0) { depthMap.set(id, 0); return 0; }
    const max = Math.max(...[...parents].map(pid => depth(pid, new Set(visited))));
    const d = max + 1;
    depthMap.set(id, d);
    return d;
  }

  tasks.forEach(t => depth(t.id));
  return depthMap;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Connector SVG Layer (Snake Routing)
───────────────────────────────────────────────────────────────────────────── */
function ConnectorLayer({ tasks, containerRef }) {
  const [paths, setPaths] = useState([]);
  const rafRef = useRef(null);

  const depPairs = useMemo(() => {
    const pairs = [];
    const seen = new Set();
    tasks.forEach(task => {
      (task.blockedBy || []).forEach(bid => {
        const key = `${bid}→${task.id}`;
        const blocker = tasks.find(t => t.id === bid);
        if (blocker && !seen.has(key)) { seen.add(key); pairs.push({ blocker, blocked: task }); }
      });
      (task.blocks || []).forEach(bid => {
        const key = `${task.id}→${bid}`;
        const blocked = tasks.find(t => t.id === bid);
        if (blocked && !seen.has(key)) { seen.add(key); pairs.push({ blocker: task, blocked }); }
      });
    });
    return pairs;
  }, [tasks]);

  const recalc = useCallback(() => {
    const ct = containerRef.current;
    if (!ct || depPairs.length === 0) { setPaths([]); return; }

    const ctRect = ct.getBoundingClientRect();
    const ox = ct.scrollLeft - ctRect.left; 
    const oy = ct.scrollTop - ctRect.top; 

    const next = [];
    depPairs.forEach(({ blocker, blocked }, index) => {
      const srcEl = ct.querySelector(`[data-task-id="${blocker.id}"]`);
      const tgtEl = ct.querySelector(`[data-task-id="${blocked.id}"]`);
      if (!srcEl || !tgtEl) return;

      const sr = srcEl.getBoundingClientRect();
      const tr = tgtEl.getBoundingClientRect();

      const sx = sr.right + ox;
      const sy = sr.top + sr.height / 2 + oy;
      const tx = tr.left + ox;
      const ty = tr.top + tr.height / 2 + oy;

      if (Math.hypot(tx - sx, ty - sy) < 10) return;

      const ex = tx - 10; 
      const radius = 12;
      const jitter = (index % 5) * 6 - 12; 
      const midX = (sx + ex) / 2 + jitter;
      const dirY = ty > sy ? 1 : -1;
      const dirX1 = midX > sx ? 1 : -1;
      const dirX2 = ex > midX ? 1 : -1;
      
      const rX = Math.min(radius, Math.abs(midX - sx) / 2, Math.abs(ex - midX) / 2);
      const rY = Math.min(radius, Math.abs(ty - sy) / 2);
      const r = Math.min(rX, rY);

      let d;
      if (r <= 0 || Math.abs(ty - sy) < 2) {
        d = `M ${sx},${sy} L ${ex},${ty}`;
      } else {
        const p1_x = midX - r * dirX1;
        const p1_y = sy;
        const c1_x = midX;
        const c1_y = sy + r * dirY;
        
        const p2_x = midX;
        const p2_y = ty - r * dirY;
        const c2_x = midX + r * dirX2;
        const c2_y = ty;
        
        d = `M ${sx},${sy}
             L ${p1_x},${p1_y}
             Q ${midX},${sy} ${c1_x},${c1_y}
             L ${p2_x},${p2_y}
             Q ${midX},${ty} ${c2_x},${c2_y}
             L ${ex},${ty}`;
      }

      next.push({ id: `${blocker.id}→${blocked.id}`, d });
    });

    setPaths(next);
  }, [depPairs, containerRef]);

  const schedule = useCallback(() => {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(recalc);
  }, [recalc]);

  useLayoutEffect(() => {
    schedule();
    const t1 = setTimeout(schedule, 100);
    const t2 = setTimeout(schedule, 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [schedule]);

  useEffect(() => {
    const ct = containerRef.current;
    if (!ct) return;

    const ro = new window.ResizeObserver(schedule);
    ro.observe(ct);

    const mo = new window.MutationObserver(schedule);
    mo.observe(ct, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'data-task-id'] });

    ct.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      ro.disconnect(); mo.disconnect();
      ct.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, schedule]);

  if (paths.length === 0) return null;

  return (
    <svg aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 0 }}>
      <defs>
        <marker id="wt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,1 L0,5 L5,3 z" fill={EDGE_COLOR} />
        </marker>
      </defs>
      {paths.map(({ id, d }) => (
        <g key={id}>
          <path d={d} fill="none" stroke={EDGE_COLOR} strokeWidth="2" strokeOpacity="0.6" strokeDasharray="4 4" strokeLinecap="square" markerEnd={`url(#wt-arrow)`} />
        </g>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Export: Workflow Tree
───────────────────────────────────────────────────────────────────────────── */
export default function WorkflowTree({ tasks }) {
  const [viewMode, setViewMode] = useState('stages'); // 'stages' | 'dependency'
  const [activeId, setActiveId] = useState(COLUMNS[0].id);

  const [selectedTask, setSelectedTask] = useState(null);
  const scrollRef = useRef(null);

  // Metrics for stages tab
  const metrics = useMemo(() => COLUMNS.map(col => {
    const colTasks = tasks.filter(t => t.status === col.id);
    const urgent = colTasks.filter(t => PRIORITIES[t.priority]?.label === 'Urgent').length;
    const high = colTasks.filter(t => PRIORITIES[t.priority]?.label === 'High').length;
    return { ...col, total: colTasks.length, tasks: colTasks, urgent, high, icon: ICONS[col.id] || CircleDot, theme: COLORS[col.id] || COLORS.todo };
  }), [tasks]);

  const totalTasks = tasks.length || 1; 

  // Dependencies for tree tab
  const { columns, hasDependencies } = useMemo(() => {
    const depthMap = buildDepthMap(tasks);
    const maxD = depthMap.size ? Math.max(0, ...depthMap.values()) : 0;
    const cols = Array.from({ length: maxD + 1 }, () => []);
    tasks.forEach(t => {
      const d = depthMap.get(t.id) ?? 0;
      if (cols[d]) cols[d].push(t);
    });
    
    cols.forEach(col => col.sort((a, b) => a.priority.localeCompare(b.priority)));
    
    return { columns: cols, hasDependencies: maxD > 0 };
  }, [tasks]);

  // Compute Team Metrics
  const teamMetrics = useMemo(() => {
    const usersMap = new Map();
    tasks.forEach(t => {
      const uid = t.assigneeId || 'unassigned';
      if (!usersMap.has(uid)) {
        usersMap.set(uid, {
          id: uid,
          name: t.assigneeName || (t.assigneeId ? 'Unknown User' : 'Unassigned'),
          avatar: t.assigneeAvatar,
          tasks: { 'todo': 0, 'in-progress': 0, 'review': 0, 'done': 0 },
          total: 0
        });
      }
      const user = usersMap.get(uid);
      if (user.tasks[t.status] !== undefined) {
        user.tasks[t.status]++;
        user.total++;
      }
    });
    return Array.from(usersMap.values()).sort((a, b) => b.total - a.total);
  }, [tasks]);



  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#0f1115] relative overflow-hidden animate-in fade-in duration-300">
      
      {/* ── Top View Toggle ── */}
      <div className="w-full pt-8 pb-6 shrink-0 z-20 flex justify-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111928]">
        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setViewMode('stages')}
            className={`flex items-center justify-center gap-2 w-36 md:w-40 py-2 rounded-md text-xs font-bold transition-all duration-200 flex-shrink-0 ${
              viewMode === 'stages' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <Layers size={14} /> Stage Overview
          </button>
          <button
            onClick={() => setViewMode('dependency')}
            className={`flex items-center justify-center gap-2 w-36 md:w-40 py-2 rounded-md text-xs font-bold transition-all duration-200 flex-shrink-0 ${
              viewMode === 'dependency' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <GitBranch size={14} /> Dependency Tree
          </button>
          <button
            onClick={() => setViewMode('team')}
            className={`flex items-center justify-center gap-2 w-36 md:w-40 py-2 rounded-md text-xs font-bold transition-all duration-200 flex-shrink-0 ${
              viewMode === 'team' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <Users size={14} /> Team Progress
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Stage Overview View
      ────────────────────────────────────────────────────────────────*/}
      {viewMode === 'stages' && (
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10 flex flex-col px-4 md:px-8 pb-8">
           
           {/* Minimalist Pipeline Track */}
           <div className="w-full max-w-5xl mx-auto py-12 relative flex-shrink-0">
             <div className="absolute top-[68px] left-12 md:left-24 right-12 md:right-24 h-px bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
             
             <div className="flex items-start justify-between relative z-10">
               {metrics.map((col) => {
                  const isActive = activeId === col.id;
                  const Icon = col.icon;
                  
                  return (
                     <button 
                       key={col.id}
                       onClick={() => setActiveId(col.id)}
                       className={`group flex flex-col items-center gap-4 transition-all w-24 md:w-32 ${!isActive ? 'opacity-50 hover:opacity-100' : 'opacity-100'}`}
                     >
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-transform duration-200 border-2 ${
                           isActive 
                             ? `${col.theme.bg} ${col.theme.border} ${col.theme.text} scale-110 shadow-sm` 
                             : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 group-hover:border-slate-300 dark:group-hover:border-slate-700`
                        }`}>
                           <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        
                        <div className="text-center">
                           <h3 className={`text-xs md:text-sm font-bold tracking-tight ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{col.title}</h3>
                           <div className="mt-1">
                              <span className="text-[10px] font-semibold text-slate-400">{col.total} Tasks</span>
                           </div>
                        </div>
                     </button>
                  );
               })}
             </div>
           </div>

           {/* Metrics & Tasks Container */}
           <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col pt-4">
             <AnimatePresence mode="wait">
               {metrics.map(col => {
                 if (col.id !== activeId) return null;
                 const percentage = Math.round((col.total / totalTasks) * 100);

                 return (
                   <motion.div 
                     key={col.id}
                     initial={{ opacity: 0, y: 10 }} 
                     animate={{ opacity: 1, y: 0 }} 
                     exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                     transition={{ duration: 0.3 }}
                     className="w-full flex flex-col gap-6"
                   >
                     {/* Monochromatic Metric Cards */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                           <div>
                             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Stage Volume</p>
                             <p className="text-3xl font-black text-slate-900 dark:text-white">{col.total}</p>
                           </div>
                           <div className="text-sm font-bold text-slate-500">{percentage}%</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                           <div>
                             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Urgent</p>
                             <p className="text-3xl font-black text-slate-900 dark:text-white">{col.urgent}</p>
                           </div>
                           <Zap size={20} className="text-slate-400" />
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                           <div>
                             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">High</p>
                             <p className="text-3xl font-black text-slate-900 dark:text-white">{col.high}</p>
                           </div>
                           <Zap size={20} className="text-slate-400" />
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                           <div>
                             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Normal/Low</p>
                             <p className="text-3xl font-black text-slate-900 dark:text-white">{col.total - (col.urgent + col.high)}</p>
                           </div>
                           <AlignLeft size={20} className="text-slate-400" />
                        </div>
                     </div>

                     {/* Cards Grid */}
                     <div className="flex-1 w-full pb-12">
                        {col.tasks.length === 0 ? (
                           <div className="w-full min-h-[250px] flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                             <col.icon size={32} className="text-slate-300 dark:text-slate-600 mb-4" />
                             <p className="text-slate-500 font-semibold text-sm">No Active Tasks in this Stage</p>
                           </div>
                        ) : (
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                              {col.tasks.map((task) => {
                                 const priority = PRIORITIES[task.priority] || PRIORITIES.low;
                                 return (
                                   <div 
                                     key={task.id} 
                                     className="flex flex-col gap-3 p-5 rounded-xl bg-white dark:bg-[#111928] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm"
                                   >
                                     <div className="flex items-start justify-between gap-3">
                                       <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">{task.title}</h4>
                                     </div>
                                     <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                       <div className="flex items-center gap-2">
                                         <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded">TSK-{task.id.slice(0, 4).toUpperCase()}</span>
                                         <span className={`text-[10px] font-bold uppercase px-2 py-1.5 rounded ${task.priority === 'urgent' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : task.priority === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{priority.label}</span>
                                       </div>
                                       
                                       <div className="flex items-center">
                                          {task.assigneeId ? (
                                             task.assigneeAvatar ? <img src={task.assigneeAvatar} className="w-6 h-6 rounded-full border border-white dark:border-slate-800 shadow-sm" alt=""/> : 
                                             <div className="w-6 h-6 rounded-full border border-white dark:border-slate-800 bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[9px] text-indigo-700 dark:text-indigo-300 font-bold shadow-sm">{task.assigneeName?.[0]?.toUpperCase()}</div>
                                          ) : (
                                             <div className="w-6 h-6 rounded-full border border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Users size={10}/></div>
                                          )}
                                       </div>
                                     </div>
                                   </div>
                                 );
                              })}
                           </div>
                        )}
                     </div>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
           </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Dependency Tree View
      ────────────────────────────────────────────────────────────────*/}
      {viewMode === 'dependency' && (
        <div className="flex-1 flex overflow-hidden min-h-0 relative z-10 bg-slate-50/50 dark:bg-[#0f1115]">
          {tasks.length === 0 ? (
            <div className="w-full flex items-center justify-center flex-col gap-3 opacity-60">
              <GitBranch size={32} className="text-slate-400" />
              <p className="text-xs font-bold text-slate-500 uppercase">Logic Map Empty</p>
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 relative overflow-auto custom-scrollbar p-8 md:p-12">
              
              {hasDependencies && <ConnectorLayer tasks={tasks} containerRef={scrollRef} />}

              {!hasDependencies && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm pointer-events-auto">
                    <ZapOff size={24} className="text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No Dependencies Found</p>
                    <p className="text-xs text-slate-500">Tasks and blocking relationships<br/>will appear as a logic tree.</p>
                  </div>
                </div>
              )}

              {/* Node Columns */}
              <div className="relative z-[1] flex gap-20 lg:gap-28 min-w-max items-start">
                {columns.map((colTasks, d) => (
                  <div key={d} className="flex flex-col gap-6 relative" style={{ minWidth: 260 }}>
                    <div className="absolute -top-8 left-0 flex items-center gap-2 px-1 text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{d === 0 ? 'Root Logic' : `Level ${d}`}</span>
                    </div>
                    {colTasks.map((task) => {
                      const sc = COLORS[task.status] || COLORS.todo;
                      const hasDeps = task.blockedBy?.length > 0 || task.blocks?.length > 0;
                      const isSelected = selectedTask?.id === task.id;
                      const priority = PRIORITIES[task.priority] || PRIORITIES.low;
                      
                      return (
                        <div
                          key={task.id}
                          data-task-id={task.id}
                          onClick={() => setSelectedTask(isSelected ? null : task)}
                          className={`relative w-full rounded-xl border ${isSelected ? 'border-slate-800 dark:border-slate-300 ring-1 ring-slate-800 dark:ring-slate-300 shadow-md' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'} bg-white dark:bg-[#111928] p-4 cursor-pointer transition-all flex-shrink-0`}
                        >
                          <div className="flex justify-between items-center mb-2">
                             <span className={`text-[10px] font-bold uppercase tracking-wide ${sc.text}`}>{STATUS_LABEL[task.status]}</span>
                             {hasDeps && <Link size={12} className="text-slate-300" />}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-3">{task.title}</h4>
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                             <div className="flex items-center gap-2">
                                <span className={`uppercase px-2 py-1 rounded ${task.priority === 'urgent' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : task.priority === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{priority.label}</span>
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">TSK-{task.id.slice(0, 4).toUpperCase()}</span>
                             </div>
                             
                             <div className="flex items-center">
                                {task.assigneeId ? (
                                   task.assigneeAvatar ? <img src={task.assigneeAvatar} className="w-6 h-6 rounded-full border border-white dark:border-slate-800 shadow-sm" alt=""/> : 
                                   <div className="w-6 h-6 rounded-full border border-white dark:border-slate-800 bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[9px] text-indigo-700 dark:text-indigo-300 font-bold shadow-sm">{task.assigneeName?.[0]?.toUpperCase()}</div>
                                ) : (
                                   <div className="w-6 h-6 rounded-full border border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Users size={10}/></div>
                                )}
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details Panel Slide-In */}
          <AnimatePresence>
            {selectedTask && (
              <motion.div
                initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xl z-20"
              >
                <div className="w-[300px] p-6 h-full relative overflow-y-auto">
                  <button onClick={() => setSelectedTask(null)} className="absolute top-6 right-6 p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"><X size={14} /></button>
                  
                  <div className="mb-6 pr-8">
                     <span className={`inline-block text-[10px] font-bold uppercase tracking-wide mb-2 ${(COLORS[selectedTask.status] || COLORS.todo).text}`}>{STATUS_LABEL[selectedTask.status]}</span>
                     <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{selectedTask.title}</h3>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Description</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedTask.description || 'No description provided.'}</p>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Team Progress View
      ────────────────────────────────────────────────────────────────*/}
      {viewMode === 'team' && (
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col px-4 md:px-8 pb-8 pt-8">
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
            {teamMetrics.map((user) => {
              const donePct = user.total > 0 ? Math.round((user.tasks['done'] / user.total) * 100) : 0;
              const inProgPct = user.total > 0 ? Math.round((user.tasks['in-progress'] / user.total) * 100) : 0;
              const reviewPct = user.total > 0 ? Math.round((user.tasks['review'] / user.total) * 100) : 0;
              const todoPct = user.total > 0 ? Math.round((user.tasks['todo'] / user.total) * 100) : 0;
              
              return (
                <div key={user.id} className="bg-white dark:bg-[#111928] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      {user.avatar ? (
                        <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-slate-100 dark:border-slate-800 shadow-sm" alt=""/>
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-slate-100 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-lg text-indigo-600 dark:text-indigo-400 font-bold shadow-sm">
                          {user.id === 'unassigned' ? <Users size={20} className="text-indigo-500 dark:text-indigo-400" /> : user.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-1">{user.name}</h3>
                        <p className="text-xs font-semibold text-slate-500">{user.total} Assigned Task{user.total !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{donePct}%</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Completed</p>
                    </div>
                  </div>

                  {/* Segmented Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden mb-4 border border-slate-200 dark:border-slate-700/50">
                    <div style={{width: `${donePct}%`}} className="h-full bg-emerald-500 border-r border-emerald-600/20" title={`Done: ${user.tasks['done']}`} />
                    <div style={{width: `${reviewPct}%`}} className="h-full bg-amber-400 border-r border-amber-500/20" title={`Review: ${user.tasks['review']}`} />
                    <div style={{width: `${inProgPct}%`}} className="h-full bg-blue-500 border-r border-blue-600/20" title={`In Progress: ${user.tasks['in-progress']}`} />
                    <div style={{width: `${todoPct}%`}} className="h-full bg-slate-300 dark:bg-slate-600" title={`To Do: ${user.tasks['todo']}`} />
                  </div>
                  
                  {/* Detailed Metric Pills */}
                  <div className="flex gap-2 items-center flex-wrap pt-1">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      To Do: {user.tasks['todo']}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      In Progress: {user.tasks['in-progress']}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Review: {user.tasks['review']}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Done: {user.tasks['done']}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
