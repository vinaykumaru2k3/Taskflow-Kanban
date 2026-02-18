import React from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import { COLUMNS } from '../utils/constants';

const KanbanBoard = ({ tasks, onDragStart, onDrop, onEditTask, onDeleteTask, onAddTask }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {COLUMNS.map((col) => (
        <div key={col.id} className="flex flex-col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, col.id)}>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{col.title}</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">{tasks.filter(t => t.status === col.id).length}</span>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {tasks.filter(t => t.status === col.id).map(task => (
              <TaskCard key={task.id} task={task} onDelete={onDeleteTask} onEdit={onEditTask} onDragStart={onDragStart} />
            ))}
            <button onClick={() => onAddTask(col.id)} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all group/btn">
              <Plus size={16} className="group-hover/btn:scale-110 transition-transform" />
              <span className="text-xs font-bold">Add Task</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
