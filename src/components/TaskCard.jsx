import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Trash2, AlertCircle, CheckSquare, Calendar, Archive, Eye, MessageSquare, Link2 } from 'lucide-react';
import { PRIORITIES, TAG_COLORS } from '../utils/constants';

// ─── Drag-image helper ────────────────────────────────────────────────────────
function buildDragGhost(sourceEl, clientX, clientY) {
  const rect = sourceEl.getBoundingClientRect();
  const isDark = document.documentElement.classList.contains('dark');
  const ghost = document.createElement('div');
  ghost.style.cssText = [
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    'position:fixed', 'top:-9999px', 'left:-9999px',
    `background:${isDark ? '#1e293b' : '#ffffff'}`,
    'border-radius:12px', 'border:2px solid rgba(100,116,139,0.3)',
    'box-shadow:0 20px 40px rgba(0,0,0,0.25)', 'opacity:0.95',
    'pointer-events:none', 'overflow:hidden',
    'display:flex', 'align-items:center', 'padding:0 14px',
  ].join(';');
  const label = document.createElement('span');
  const titleEl = sourceEl.querySelector('h4');
  label.textContent = titleEl ? titleEl.textContent : '';
  label.style.cssText = [
    'font-size:13px', 'font-weight:700',
    `color:${isDark ? '#e2e8f0' : '#1e293b'}`,
    'white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis', 'max-width:100%',
  ].join(';');
  ghost.appendChild(label);
  document.body.appendChild(ghost);
  return { ghost, offsetX: clientX - rect.left, offsetY: clientY - rect.top };
}

// ─── Assignee avatar ──────────────────────────────────────────────────────────
const AssigneeAvatar = ({ task }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="ring-2 ring-white dark:ring-slate-800 rounded-full flex-shrink-0 bg-slate-200 dark:bg-slate-700 w-6 h-6 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-300 overflow-hidden shadow-sm"
      title={task.assigneeName ? `Assigned to ${task.assigneeName}` : 'Assigned (member removed)'}
    >
      {task.assigneeAvatar && !imgError ? (
        <img src={task.assigneeAvatar} alt={task.assigneeName || 'Assignee'} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      ) : (
        (task.assigneeName?.[0] || '?').toUpperCase()
      )}
    </div>
  );
};

// ─── Tag color lookup ─────────────────────────────────────────────────────────
const getTagColor = (colorId) => TAG_COLORS.find(c => c.id === colorId) || TAG_COLORS[0];

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_ACCENT = {
  Urgent: 'bg-rose-500',
  High:   'bg-orange-400',
  Medium: 'bg-blue-500',
  Low:    'bg-slate-300 dark:bg-slate-600',
};

const PRIORITY_BORDER = {
  Urgent: 'border-rose-400/40 dark:border-rose-500/30',
  High:   'border-orange-400/40 dark:border-orange-500/30',
  Medium: 'border-blue-400/40 dark:border-blue-500/30',
  Low:    'border-slate-200/70 dark:border-slate-700/60',
};

// ─── TaskCard ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onDelete, onEdit, onDragStart, onArchive, readOnly = false, touchHandlers = {} }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const priority        = PRIORITIES[task.priority] || PRIORITIES.low;
  const priorityLabel   = priority.label;
  const subtasksCount   = task.subtasks?.length || 0;
  const completedSubs   = task.subtasks?.filter(s => s.completed).length || 0;
  const progress        = subtasksCount > 0 ? (completedSubs / subtasksCount) * 100 : 0;
  const isOverdue       = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isUrgentOrHigh  = priorityLabel === 'Urgent' || priorityLabel === 'High';

  const hasDescription  = !!task.description;
  const hasTags         = task.tags && task.tags.length > 0;
  const showExpanded    = isHovered && !isDragging && hasDescription;

  const accentBar   = PRIORITY_ACCENT[priorityLabel] || PRIORITY_ACCENT.Low;
  const borderClass = PRIORITY_BORDER[priorityLabel] || PRIORITY_BORDER.Low;

  return (
    <motion.div
      id={`task-card-${task.id}`}
      draggable={!readOnly}
      onDragStart={readOnly ? undefined : (e) => {
        setIsDragging(true);
        onDragStart(e, task.id);
        if (e.dataTransfer?.setDragImage) {
          let ghost;
          try {
            const r = buildDragGhost(e.currentTarget, e.clientX, e.clientY);
            ghost = r.ghost;
            e.dataTransfer.setDragImage(ghost, r.offsetX, r.offsetY);
          } catch (err) {
            console.error('drag image error:', err);
          } finally {
            if (ghost) requestAnimationFrame(() => ghost.remove());
          }
        }
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={() => onEdit(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={`group relative rounded-xl border-2 transition-all duration-200 overflow-hidden select-none
        ${readOnly ? 'cursor-default' : 'cursor-pointer'}
        ${isDragging
          ? 'bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-600 opacity-40 shadow-none'
          : `bg-white dark:bg-slate-900/80 hover:shadow-md hover:-translate-y-px ${borderClass}`
        }`}
      {...touchHandlers}
      style={{ willChange: 'transform', ...(touchHandlers.style || {}) }}
      whileTap={isDragging ? {} : { scale: 0.985, transition: { type: 'spring', stiffness: 450, damping: 18 } }}
    >
      {/* Left priority accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentBar}`} />

      {/* ── Main card body ───────────────────────────────────────────────── */}
      <div className="pl-4 pr-3 pt-3 pb-3 flex flex-col gap-2">

        {/* Row 1: urgency dot + title + action buttons */}
        <div className="flex items-start gap-2">
          {/* Urgent/High pulsing dot */}
          {isUrgentOrHigh && (
            <div className="relative flex h-2 w-2 flex-shrink-0 mt-[5px]" title={`Priority: ${priorityLabel}`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${priorityLabel === 'Urgent' ? 'bg-rose-400' : 'bg-orange-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${priorityLabel === 'Urgent' ? 'bg-rose-500' : 'bg-orange-400'}`} />
            </div>
          )}

          {/* Full title — no line-clamp */}
          <h4 className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
            {task.title}
          </h4>

          {/* Action buttons — fade in on hover */}
          <div className={`flex items-center gap-0.5 flex-shrink-0 transition-opacity duration-150 ${isHovered && !isDragging ? 'opacity-100' : 'opacity-0'}`}>
            {readOnly ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-slate-300 px-1 py-0.5">
                <Eye size={9} /> View
              </span>
            ) : (
              <>
                {task.status === 'done' && onArchive && (
                  <button
                    id={`btn-archive-task-${task.id}`}
                    onClick={(e) => { e.stopPropagation(); onArchive(task.id); }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                    title="Archive task" aria-label="Archive task"
                  >
                    <Archive size={13} />
                  </button>
                )}
                {onDelete && (
                  <button
                    id={`btn-delete-task-${task.id}`}
                    onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    title="Delete task" aria-label="Delete task"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Description — slides in on hover ─────────────────────────── */}
        <AnimatePresence initial={false}>
          {showExpanded && (
            <motion.div
              key="desc"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-4 -mt-1">
                {task.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Row 2: Tags */}
        {hasTags && (
          <div className="flex flex-wrap gap-1">
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

        {/* Row 3: subtask progress (only when present) */}
        {subtasksCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 tabular-nums flex items-center gap-1 flex-shrink-0">
              <CheckSquare size={10} />
              {completedSubs}/{subtasksCount}
            </span>
          </div>
        )}

        {/* Row 4: date / meta / assignee — always visible */}
        <div className="flex items-center gap-2">
          {/* Due date */}
          <div className={`flex items-center gap-1 text-[10px] font-semibold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
            <Calendar size={10} />
            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}</span>
            {isOverdue && <AlertCircle size={9} className="ml-0.5" />}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Dependency count */}
          {(task.blockedBy?.length > 0 || task.blocks?.length > 0) && (
            <div
              className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500"
              title={`${task.blockedBy?.length || 0} blocking, ${task.blocks?.length || 0} blocked`}
            >
              <Link2 size={10} />
              <span>{(task.blockedBy?.length || 0) + (task.blocks?.length || 0)}</span>
            </div>
          )}

          {/* Comment count */}
          {task.commentCount > 0 && (
            <div className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400">
              <MessageSquare size={10} />
              <span>{task.commentCount}</span>
            </div>
          )}

          {/* Assignee avatar — right end */}
          {task.assigneeId && <AssigneeAvatar task={task} />}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
