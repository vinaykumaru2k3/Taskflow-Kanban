import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Trash2, AlertCircle, CheckSquare, Calendar, Archive, Eye, MessageSquare, Link2 } from 'lucide-react';
import { PRIORITIES, TAG_COLORS } from '../utils/constants';

// ─── Drag-image helper (module-level, created once) ──────────────────────────
function buildDragGhost(sourceEl, clientX, clientY) {
  const rect = sourceEl.getBoundingClientRect();
  const isDark = document.documentElement.classList.contains('dark');

  const ghost = document.createElement('div');
  ghost.style.cssText = [
    `width:${rect.width}px`,
    `height:40px`,
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
    'padding:0 16px',
  ].join(';');

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

  return { ghost, offsetX: clientX - rect.left, offsetY: clientY - rect.top };
}

// ─── Assignee avatar sub-component ────────────────────────────────────────────
const AssigneeAvatar = ({ task }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="ring-2 ring-slate-100 dark:ring-slate-800 rounded-full flex-shrink-0 bg-slate-200 dark:bg-slate-700 w-5 h-5 flex items-center justify-center text-[9px] font-bold text-slate-500 overflow-hidden"
      title={task.assigneeName ? `Assigned to ${task.assigneeName}` : 'Assigned (member removed)'}
    >
      {task.assigneeAvatar && !imgError ? (
        <img
          src={task.assigneeAvatar}
          alt={task.assigneeName || 'Former member'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        (task.assigneeName?.[0] || '?').toUpperCase()
      )}
    </div>
  );
};

// ─── Tag color helper ──────────────────────────────────────────────────────────
const getTagColor = (colorId) => TAG_COLORS.find(c => c.id === colorId) || TAG_COLORS[0];

// ─── Main Component ────────────────────────────────────────────────────────────
const TaskCard = ({ task, onDelete, onEdit, onDragStart, onArchive, readOnly = false, touchHandlers = {} }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const priority = PRIORITIES[task.priority] || PRIORITIES.low;
  const subtasksCount   = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const progress = subtasksCount > 0 ? (completedSubtasks / subtasksCount) * 100 : 0;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  // Has any expandable content beyond the title?
  const hasExpandableContent =
    task.description ||
    (task.tags && task.tags.length > 0) ||
    subtasksCount > 0 ||
    task.dueDate ||
    task.commentCount > 0 ||
    task.blockedBy?.length > 0 ||
    task.blocks?.length > 0;

  const priorityBorder =
    priority.label === 'Urgent' ? 'border-rose-500/50 dark:border-rose-500/40 shadow-sm shadow-rose-500/10 dark:shadow-rose-500/5' :
    priority.label === 'High'   ? 'border-orange-500/50 dark:border-orange-500/40 shadow-sm shadow-orange-500/10 dark:shadow-orange-500/5' :
    priority.label === 'Medium' ? 'border-blue-500/50 dark:border-blue-500/40 shadow-sm shadow-blue-500/10 dark:shadow-blue-500/5' :
                                  'border-slate-200/60 dark:border-slate-700/50 shadow-sm';

  // Thin left accent colour for priority at-a-glance in collapsed state
  const accentBar =
    priority.label === 'Urgent' ? 'bg-rose-500' :
    priority.label === 'High'   ? 'bg-orange-500' :
    priority.label === 'Medium' ? 'bg-blue-500' :
                                  'bg-slate-300 dark:bg-slate-600';

  const showExpanded = isHovered && !isDragging && hasExpandableContent;

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
            const result = buildDragGhost(e.currentTarget, e.clientX, e.clientY);
            ghost = result.ghost;
            e.dataTransfer.setDragImage(ghost, result.offsetX, result.offsetY);
          } catch (err) {
            console.error('Failed to set drag image:', err);
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
      className={`group relative backdrop-blur-lg border-2 rounded-xl transition-colors duration-200 overflow-hidden ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${
        isDragging
          ? 'bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-600 opacity-40 shadow-none'
          : `bg-white/95 dark:bg-white/[0.04] hover:shadow-lg ${priorityBorder}`
      }`}
      {...touchHandlers}
      style={{ willChange: 'transform', ...(touchHandlers.style || {}) }}
      whileHover={isDragging ? {} : {
        scale: 1.015,
        y: -2,
        transition: { type: 'spring', stiffness: 350, damping: 22 }
      }}
      whileTap={isDragging ? {} : {
        scale: 0.988,
        transition: { type: 'spring', stiffness: 450, damping: 15 }
      }}
    >
      {/* Priority accent bar on the left */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${accentBar}`} />

      {/* ── Collapsed header — always visible ─────────────────────────────── */}
      <div className="flex items-center gap-2 pl-3 pr-3 py-2.5">
        {/* Pulsing dot for urgent/high */}
        {(priority.label === 'Urgent' || priority.label === 'High') && (
          <div className="relative flex h-2 w-2 flex-shrink-0" title={`Priority: ${priority.label}`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${priority.label === 'Urgent' ? 'bg-rose-400' : 'bg-orange-400'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${priority.label === 'Urgent' ? 'bg-rose-500' : 'bg-orange-500'}`} />
          </div>
        )}

        {/* Title — occupies all remaining space */}
        <h4 className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-1 min-w-0">
          {task.title}
        </h4>

        {/* Right cluster: overdue badge, assignee, actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isOverdue && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <AlertCircle size={9} /> Late
            </span>
          )}
          {task.assigneeId && <AssigneeAvatar task={task} />}

          {/* Action buttons — always reserve space so card width is stable */}
          <div className={`flex items-center gap-0.5 transition-opacity duration-150 ${isHovered && !isDragging ? 'opacity-100' : 'opacity-0'}`}>
            {readOnly ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-slate-300 px-1.5 py-1">
                <Eye size={9} /> View
              </span>
            ) : (
              <>
                {task.status === 'done' && onArchive && (
                  <button
                    id={`btn-archive-task-${task.id}`}
                    onClick={(e) => { e.stopPropagation(); onArchive(task.id); }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                    title="Archive task"
                    aria-label="Archive task"
                  >
                    <Archive size={13} />
                  </button>
                )}
                {onDelete && (
                  <button
                    id={`btn-delete-task-${task.id}`}
                    onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    title="Delete task"
                    aria-label="Delete task"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Expanded panel — slides in on hover ───────────────────────────── */}
      <AnimatePresence initial={false}>
        {showExpanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 space-y-2 border-t border-slate-100 dark:border-slate-700/50 mt-0">

              {/* Description */}
              {task.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal line-clamp-3 pt-2">
                  {task.description}
                </p>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
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

              {/* Subtask progress */}
              {subtasksCount > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <CheckSquare size={10} /> {completedSubtasks}/{subtasksCount} Tasks
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Footer: date + comment/dep counts */}
              <div className="flex items-center justify-between pt-1">
                <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                  <Calendar size={10} />
                  <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(task.blockedBy?.length > 0 || task.blocks?.length > 0) && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500" title={`${task.blockedBy?.length || 0} blocking, ${task.blocks?.length || 0} blocked`}>
                      <Link2 size={10} />
                      <span>{(task.blockedBy?.length || 0) + (task.blocks?.length || 0)}</span>
                    </div>
                  )}
                  {task.commentCount > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <MessageSquare size={10} />
                      <span>{task.commentCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskCard;
