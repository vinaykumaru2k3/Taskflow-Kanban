import React from 'react';
import { Trash2, AlertCircle, CheckSquare, Calendar, Archive, Tag, Eye, MessageSquare } from 'lucide-react';
import { PRIORITIES, TAG_COLORS } from '../utils/constants';

const TaskCard = ({ task, onDelete, onEdit, onDragStart, onArchive, readOnly = false }) => {
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

  return (
    <div
      draggable={!readOnly}
      onDragStart={readOnly ? undefined : (e) => onDragStart(e, task.id)}
      onClick={() => onEdit(task)}
      className={`group border-t-2 bg-white/95 dark:bg-white/[0.04] backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      style={{
        borderTopColor: priority.label === 'Urgent' ? '#f43f5e' :
                        priority.label === 'High' ? '#f59e0b' :
                        priority.label === 'Medium' ? '#3b82f6' : 'transparent',
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
            TSK-{task.id.slice(0, 4).toUpperCase()}
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
              title={`Assigned to ${task.assigneeName || 'someone'}`}
            >
              {task.assigneeAvatar ? (
                <img src={task.assigneeAvatar} alt={task.assigneeName} className="w-full h-full object-cover" />
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
                  onClick={(e) => { e.stopPropagation(); onArchive(task.id); }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-300 rounded-lg transition-all"
                  title="Archive task"
                >
                  <Archive size={14} />
                </button>
              )}
              {onDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all">
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
          {task.tags.map((tag, idx) => {
            const color = getTagColor(tag.colorId);
            return (
              <span 
                key={idx} 
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
        {task.commentCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <MessageSquare size={11} />
            <span>{task.commentCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
