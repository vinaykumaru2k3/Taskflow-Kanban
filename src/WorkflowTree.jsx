import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDot, PlayCircle, Eye, CheckCircle2, Zap, MessageSquare, Users, CheckSquare, AlignLeft } from 'lucide-react';
import { COLUMNS, PRIORITIES } from './utils/constants';

const ICONS = {
  'todo': CircleDot,
  'in-progress': PlayCircle,
  'review': Eye,
  'done': CheckCircle2
};

const COLORS = {
  'todo': { bg: 'bg-slate-500', bgSoft: 'bg-slate-500/10', glow: 'shadow-slate-500/40', border: 'border-slate-500/30', text: 'text-slate-500' },
  'in-progress': { bg: 'bg-blue-500', bgSoft: 'bg-blue-500/10', glow: 'shadow-blue-500/40', border: 'border-blue-500/30', text: 'text-blue-500' },
  'review': { bg: 'bg-amber-500', bgSoft: 'bg-amber-500/10', glow: 'shadow-amber-500/40', border: 'border-amber-500/30', text: 'text-amber-500' },
  'done': { bg: 'bg-emerald-500', bgSoft: 'bg-emerald-500/10', glow: 'shadow-emerald-500/30', border: 'border-emerald-500/30', text: 'text-emerald-500' }
};

export default function WorkflowTree({ tasks }) {
  // Select first column's ID by default
  const [activeId, setActiveId] = useState(COLUMNS[0].id);

  // Compute metrics per column
  const metrics = COLUMNS.map(col => {
    const colTasks = tasks.filter(t => t.status === col.id);
    const urgent = colTasks.filter(t => PRIORITIES[t.priority]?.label === 'Urgent').length;
    const high = colTasks.filter(t => PRIORITIES[t.priority]?.label === 'High').length;
    
    return {
      ...col,
      total: colTasks.length,
      tasks: colTasks,
      urgent,
      high,
      icon: ICONS[col.id] || CircleDot,
      theme: COLORS[col.id] || COLORS.todo
    };
  });

  const totalTasks = tasks.length || 1; // avoid div by zero

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/50 dark:bg-transparent relative overflow-hidden animate-in fade-in duration-500">
      
      {/* Ambient background rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
         <div className="absolute top-0 right-[20%] w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full" />
         <div className="absolute bottom-0 left-[20%] w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full" />
      </div>

      {/* Pipeline HUD Track */}
      <div className="w-full bg-white/40 dark:bg-[#0f172a]/40 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-4 md:px-8 py-6 md:py-8 shrink-0 relative z-20 shadow-sm">
         <div className="relative w-full max-w-5xl mx-auto flex items-center justify-between">
            {/* Connecting line */}
            <div className="absolute top-6 md:top-8 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 rounded-full z-0 overflow-hidden">
               <motion.div 
                 className="h-full bg-blue-500/40" 
                 initial={{ width: '0%' }}
                 animate={{ width: '100%' }}
                 transition={{ duration: 1.5, ease: "easeInOut" }}
               />
               <div className="absolute top-0 left-0 h-full bg-blue-400 w-16 animate-[slide-right_3s_linear_infinite] blur-sm opacity-50" />
            </div>

            {/* Nodes */}
            {metrics.map((col, idx) => {
               const isActive = activeId === col.id;
               const Icon = col.icon;
               
               return (
                  <button 
                    key={col.id}
                    onClick={() => setActiveId(col.id)}
                    className="relative z-10 group flex flex-col items-center gap-3 md:gap-4 transition-all"
                  >
                     <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all duration-300 ${
                        isActive 
                          ? `${col.theme.bg} text-white scale-110 md:scale-125 ${col.theme.glow} shadow-lg ring-4 ring-white dark:ring-[#0f172a]` 
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:scale-110 shadow-sm'
                     }`}>
                        <Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 3 : 2} className={!isActive ? 'md:w-6 md:h-6' : 'md:w-8 md:h-8'} />
                     </div>
                     <div className={`text-center transition-all px-2 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70 group-hover:opacity-100 group-hover:translate-y-1'}`}>
                        <h3 className={`text-[10px] md:text-sm font-black tracking-tight uppercase ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{col.title}</h3>
                        <div className="hidden md:flex items-center justify-center gap-1 mt-1">
                           <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? col.theme.text : 'text-slate-400'}`}>{col.total} Items</span>
                        </div>
                     </div>
                     
                     {/* Active Indicator Arrow */}
                     {isActive && (
                       <motion.div 
                         layoutId="active-arrow"
                         className="absolute -bottom-8 md:-bottom-10 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-t border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0f172a] shadow-[-2px_-2px_4px_rgba(0,0,0,0.02)]" 
                       />
                     )}
                  </button>
               );
            })}
         </div>
      </div>

      {/* Expanded Details Pane */}
      <div className="flex-1 w-full bg-slate-50/50 dark:bg-transparent overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
         <AnimatePresence mode="wait">
           {metrics.map(col => {
             if (col.id !== activeId) return null;
             const percentage = Math.round((col.total / totalTasks) * 100);

             return (
               <motion.div 
                 key={col.id}
                 initial={{ opacity: 0, y: 15 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -15, transition: { duration: 0.15 } }}
                 transition={{ duration: 0.3 }}
                 className="w-full h-full flex flex-col p-4 md:p-8"
               >
                 {/* Top metrics grid */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 flex-shrink-0">
                    <div className="bg-white/80 dark:bg-[#151f32]/80 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Stage Volume</p>
                         <p className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{col.total}</p>
                       </div>
                       <div className={`w-14 h-14 rounded-2xl ${col.theme.bgSoft} flex items-center justify-center ${col.theme.text}`}>
                          <p className="text-sm font-black">{percentage}%</p>
                       </div>
                    </div>
                    
                    <div className="bg-white/80 dark:bg-[#151f32]/80 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-2">Urgent Tasks</p>
                         <p className="text-4xl font-black text-rose-600 dark:text-rose-400 leading-none tracking-tighter">{col.urgent}</p>
                       </div>
                       <div className={`w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500`}>
                          <Zap size={24} className={col.urgent > 0 ? 'animate-pulse' : ''} />
                       </div>
                    </div>

                    <div className="bg-white/80 dark:bg-[#151f32]/80 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-2">High Priority</p>
                         <p className="text-4xl font-black text-orange-600 dark:text-orange-400 leading-none tracking-tighter">{col.high}</p>
                       </div>
                       <div className={`w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500`}>
                          <Zap size={24} />
                       </div>
                    </div>

                    <div className="bg-white/80 dark:bg-[#151f32]/80 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Normal/Low</p>
                         <p className="text-4xl font-black text-blue-600 dark:text-blue-400 leading-none tracking-tighter">{col.total - (col.urgent + col.high)}</p>
                       </div>
                       <div className={`w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500`}>
                          <AlignLeft size={24} />
                       </div>
                    </div>
                 </div>

                 {/* Granular Task Grid */}
                 <div className="flex-1 w-full pb-8">
                    {col.tasks.length === 0 ? (
                       <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-[3rem] bg-white/30 dark:bg-slate-900/10">
                          <Icon size={48} className="text-slate-300 dark:text-slate-700 mb-4" strokeWidth={1} />
                          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-sm">No Active Tasks in this Stage</p>
                       </div>
                    ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
                          {col.tasks.map((task, tidx) => {
                             const priority = PRIORITIES[task.priority] || PRIORITIES.low;
                             const isCritical = priority.label === 'Urgent' || priority.label === 'High';
                             return (
                               <motion.div 
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 transition={{ delay: tidx * 0.05 }}
                                 key={task.id} 
                                 className={`group/task flex flex-col gap-3 p-5 rounded-3xl bg-white dark:bg-[#111928] border-2 ${isCritical ? 'border-rose-200 dark:border-rose-500/30 shadow-[0_4px_20px_rgba(244,63,94,0.05)]' : 'border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-md'} hover:border-slate-300 dark:hover:border-slate-500 transition-all`}
                               >
                                 <div className="flex items-start justify-between gap-3">
                                   <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">{task.title}</h4>
                                   <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${priority.dot} ${isCritical ? 'animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]' : ''}`} title={priority.label} />
                                 </div>
                                 
                                 <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-slate-800/60">
                                   <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400">
                                     <span className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                                       TSK-{task.id.slice(0, 4).toUpperCase()}
                                     </span>
                                     {task.commentCount > 0 && (
                                       <span className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                         <MessageSquare size={14} /> {task.commentCount}
                                       </span>
                                     )}
                                     {task.subtasks?.length > 0 && (
                                       <span className="flex items-center gap-1">
                                         <CheckSquare size={14} /> {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                       </span>
                                     )}
                                   </div>
                                   
                                   {task.assigneeId ? (
                                     <div className="flex items-center gap-2" title={task.assigneeName}>
                                       {task.assigneeAvatar ? (
                                         <img src={task.assigneeAvatar} alt="" className="w-7 h-7 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                                       ) : (
                                         <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-500">
                                           {task.assigneeName?.[0]?.toUpperCase()}
                                         </div>
                                       )}
                                       <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden lg:block truncate max-w-[80px]">
                                         {task.assigneeName?.split(' ')[0]}
                                       </span>
                                     </div>
                                   ) : (
                                     <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500" title="Unassigned">
                                       <Users size={14} />
                                     </div>
                                   )}
                                 </div>
                               </motion.div>
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
  );
}
