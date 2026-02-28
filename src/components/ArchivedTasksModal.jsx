import { Archive, RotateCcw, Trash2, CheckCircle2, AlertCircle, CheckSquare, Calendar } from 'lucide-react';
import { PRIORITIES } from '../utils/constants';

const ArchivedTasksModal = ({ isOpen, onClose, tasks, onRestore, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Archive size={20} className="text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Archived Tasks</h2>
              <p className="text-[10px] text-slate-400 font-medium">{tasks.length} archived</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-40">
              <Archive size={48} strokeWidth={1} className="mb-4 text-slate-300" />
              <p className="text-sm font-bold text-slate-400">No archived tasks</p>
              <p className="text-xs text-slate-300 mt-1">Completed tasks can be archived from the Done column</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const priority = PRIORITIES[task.priority] || PRIORITIES.low;
                const subtasksCount = task.subtasks?.length || 0;
                const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
                const progress = subtasksCount > 0 ? (completedSubtasks / subtasksCount) * 100 : 0;
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

                return (
                  <div
                    key={task.id}
                    className={`group relative bg-gradient-to-br from-white dark:from-slate-800 to-slate-50 dark:to-slate-800/80 border-2 ${priority.border} rounded-xl p-3.5 shadow-sm transition-all overflow-hidden opacity-75 hover:opacity-100`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5 ${priority.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                          {priority.label}
                        </span>
                        {task.status === 'done' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Done
                          </span>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => onRestore(task.id)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-all"
                          title="Restore task"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button 
                          onClick={() => onDelete(task.id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg text-slate-400 hover:text-rose-500 transition-all"
                          title="Delete permanently"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5 line-clamp-2 leading-snug">{task.title}</h4>
                    
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed font-normal">{task.description}</p>
                    )}
                    
                    {subtasksCount > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <CheckSquare size={10} /> {completedSubtasks}/{subtasksCount} Tasks
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center pt-3 border-t border-slate-50 dark:border-slate-700/50 mt-auto">
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                        <Calendar size={11} />
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchivedTasksModal;
