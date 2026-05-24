import { motion } from 'framer-motion';
import { useState } from 'react';
import { Trash2, AlertCircle, CheckSquare, Calendar, Archive, Eye, MessageSquare, Link2 } from 'lucide-react';
import { PRIORITIES, TAG_COLORS } from '../utils/constants';

// ─── Drag-image helper (module-level, created once) ──────────────────────────
//
// The browser's HTML5 DnD snapshot engine cannot composite backdrop-blur,
// so cards with backdrop-blur-lg render as partially-transparent/invisible
// ghosts. Instead we inject a cheap flat rectangle that matches the card's
// look without any filter effects. Creating a lightweight div is orders of
// magnitude faster than cloneNode(true) on a complex React subtree.
//
function buildDragGhost(sourceEl, clientX, clientY) {
  const rect = sourceEl.getBoundingClientRect();

  // Detect dark mode from the document root class
  const isDark = document.documentElement.classList.contains('dark');

  const ghost = document.createElement('div');
  ghost.style.cssText = [
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    'position:fixed',
    'top:-9999px',
    'left:-9999px',
    `background:${isDark ? '#1e293b' : '#ffffff'}`,
    'border-radius:12px',
    'border:2px solid rgba(100,116,139,0.3)',
    'box-shadow:0 20px 40px rgba(0,0,0,0.25)',
    'opacity:0.95',
    'pointer-events:none',
    'overflow:hidden',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:16px',
  ].join(';');

  // Inner label — quick visual cue without a full DOM clone
  const label = document.createElement('span');
  const titleEl = sourceEl.querySelector('h4');
  label.textContent = titleEl ? titleEl.textContent : '';
  label.style.cssText = [
    'font-size:13px',
    'font-weight:700',
    `color:${isDark ? '#e2e8f0' : '#1e293b'}`,
    'white-space:nowrap',
    'overflow:hidden',
    'text-overflow:ellipsis',
    'max-width:100%',
  ].join(';');
  ghost.appendChild(label);

  document.body.appendChild(ghost);

  return {
    ghost,
    offsetX: clientX - rect.left,
    offsetY: clientY - rect.top,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const TaskCard = ({ task, onDelete, onEdit, onDragStart, onArchive, readOnly = false, touchHandlers = {} }) => {
  const [isDragging, setIsDragging] = useState(false);
  const priority = PRIORITIES[task.priority] || PRIORITIES.low;
  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const progress = subtasksCount > 0 ? (completedSubtasks / subtasksCount) * 100 : 0;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  // Get tag color styling
  const getTagColor = (colorId) => {
    const color = TAG_COLORS.find(c => c.id === colorId) || TAG_COLORS[0];
    return color;
  };

  // Priority-based border class (computed once, used in two branches)
  const priorityBorder =
    priority.label === 'Urgent' ? 'border-rose-500/50 dark:border-rose-500/40 shadow-sm shadow-rose-500/10 dark:shadow-rose-500/5' :
    priority.label === 'High'   ? 'border-orange-500/50 dark:border-orange-500/40 shadow-sm shadow-orange-500/10 dark:shadow-orange-500/5' :
    priority.label === 'Medium' ? 'border-blue-500/50 dark:border-blue-500/40 shadow-sm shadow-blue-500/10 dark:shadow-blue-500/5' :
                                  'border-slate-200/60 dark:border-slate-700/50 shadow-sm';

  return (
    <motion.div
      id={`task-card-${task.id}`}
      draggable={!readOnly}
      onDragStart={readOnly ? undefined : (e) => {
        setIsDragging(true);
        onDragStart(e, task.id);

        // Guard: jsdom (test env) does not implement dataTransfer.setDragImage
        if (e.dataTransfer?.setDragImage) {
          let ghost;
          try {
            const result = buildDragGhost(e.currentTarget, e.clientX, e.clientY);
            ghost = result.ghost;
            e.dataTransfer.setDragImage(ghost, result.offsetX, result.offsetY);
          } catch (err) {
            console.error('Failed to set drag image:', err);
          } finally {
            if (ghost) {
              requestAnimationFrame(() => ghost.remove());
            }
          }
        }
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={() => onEdit(task)}
      // Use transition-colors (not transition-all) to avoid the browser
      // watching every CSS property for changes during drag.
      className={`group backdrop-blur-lg border-2 rounded-xl p-4 transition-colors duration-200 overflow-hidden flex flex-col ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${
        isDragging
          // Intentional placeholder: dashed outline at reduced opacity so
          // the user can see exactly which slot the card is coming from.
          ? 'bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-600 opacity-40 shadow-none'
          : `bg-white/95 dark:bg-white/[0.04] hover:shadow-md ${priorityBorder}`
      }`}
      // [touch] Merge touch DnD handlers from useTouchDnd (pointer events + touch-action)
      {...touchHandlers}
      style={{ willChange: 'transform', ...(touchHandlers.style || {}) }}
      // Disable spring animations entirely while dragging — Framer Motion's
      // pointer-event tracking competes with the native DnD system.
      whileHover={isDragging ? {} : {
        scale: 1.015,
        y: -3,
        rotate: 0.5,
        transition: { type: 'spring', stiffness: 350, damping: 20 }
      }}
      whileTap={isDragging ? {} : {
        scale: 0.985,
        rotate: -1,
        transition: { type: 'spring', stiffness: 450, damping: 15 }
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(priority.label === 'Urgent' || priority.label === 'High') && (
            <div className="relative flex h-2 w-2" title={`Priority: ${priority.label}`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${priority.label === 'Urgent' ? 'bg-rose-400' : 'bg-orange-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${priority.label === 'Urgent' ? 'bg-rose-500' : 'bg-orange-500'}`}></span>
            </div>
          )}
          
          <span 
            className={`text-[10px] font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r ${
              priority.label === 'Urgent' ? 'from-rose-500 to-rose-600 dark:from-rose-400 dark:to-rose-500' :
              priority.label === 'High' ? 'from-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-500' :
              priority.label === 'Medium' ? 'from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500' :
              'from-slate-400 to-slate-500 dark:from-slate-400 dark:to-slate-500'
            }`}
            title={`Priority: ${priority.label}`}
          >
            TSK-{task.id?.slice(0, 4).toUpperCase() || ''}
          </span>

          {isOverdue && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 bg-rose-500/10 text-rose-500 dark:text-rose-400 ml-1">
              <AlertCircle size={10} /> Overdue
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {task.assigneeId && (
            <div 
              className="mr-1 ring-2 ring-slate-100 dark:ring-slate-800 rounded-full flex-shrink-0 bg-slate-200 dark:bg-slate-700 w-5 h-5 flex items-center justify-center text-[9px] font-bold text-slate-500 overflow-hidden" 
              title={task.assigneeName ? `Assigned to ${task.assigneeName}` : 'Assigned (member removed)'}
            >
              {task.assigneeAvatar ? (
                <img 
                  src={task.assigneeAvatar} 
                  alt={task.assigneeName || 'Former member'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.textContent = '?';
                  }}
                />
              ) : (
                (task.assigneeName?.[0] || '?').toUpperCase()
              )}
            </div>
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {readOnly ? (
            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-300 px-2 py-1">
              <Eye size={10} /> View Only
            </span>
          ) : (
            <>
              {task.status === 'done' && onArchive && (
                <button
                  id={`btn-archive-task-${task.id}`}
                  onClick={(e) => { e.stopPropagation(); onArchive(task.id); }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                  title="Archive task"
                  aria-label="Archive task"
                >
                  <Archive size={14} />
                </button>
              )}
              {onDelete && (
                <button 
                  id={`btn-delete-task-${task.id}`} 
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                  title="Delete task"
                  aria-label="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
          </div>
        </div>
      </div>
      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5 line-clamp-2 leading-snug">{task.title}</h4>
      {task.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed font-normal">{task.description}</p>}
      
      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.map((tag) => {
            const color = getTagColor(tag.colorId);
            return (
              <span 
                key={tag.id || tag.label} 
                className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${color.bg} ${color.text} ${color.border}`}
              >
                {tag.label}
              </span>
            );
          })}
        </div>
      )}
      
      {subtasksCount > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <CheckSquare size={10} /> {completedSubtasks}/{subtasksCount} Tasks
            </span>
            <span className="text-[10px] font-bold text-slate-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700/50 mt-auto">
        <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
          <Calendar size={11} />
          <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
        </div>
        <div className="flex items-center gap-2">
          {(task.blockedBy?.length > 0 || task.blocks?.length > 0) && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500" title={`${task.blockedBy?.length || 0} blocking, ${task.blocks?.length || 0} blocked`}>
              <Link2 size={11} />
              <span>{(task.blockedBy?.length || 0) + (task.blocks?.length || 0)}</span>
            </div>
          )}
          {task.commentCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <MessageSquare size={11} />
              <span>{task.commentCount}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
