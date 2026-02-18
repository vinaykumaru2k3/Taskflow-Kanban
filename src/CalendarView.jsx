import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, AlertCircle, CheckSquare } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

const PRIORITIES = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-rose-100 text-rose-600', dot: 'bg-rose-600' },
};

const CalendarView = ({ tasks, onTaskClick }) => {
  const [date, setDate] = useState(new Date());

  const tasksByDate = useMemo(() => {
    const grouped = {};
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = new Date(task.dueDate).toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const selectedDateTasks = useMemo(() => {
    return tasksByDate[date.toDateString()] || [];
  }, [tasksByDate, date]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateKey = date.toDateString();
    const dayTasks = tasksByDate[dateKey] || [];
    if (dayTasks.length === 0) return null;

    const hasOverdue = dayTasks.some(t => new Date(t.dueDate) < new Date() && t.status !== 'done');
    const allDone = dayTasks.every(t => t.status === 'done');
    
    let dotColor = 'bg-blue-500';
    if (hasOverdue) dotColor = 'bg-rose-500';
    else if (allDone) dotColor = 'bg-emerald-500';

    return (
      <div className="flex justify-center">
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      </div>
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    const dateKey = date.toDateString();
    const dayTasks = tasksByDate[dateKey] || [];
    if (dayTasks.length === 0) return '';
    
    const hasOverdue = dayTasks.some(t => 
      new Date(t.dueDate) < new Date() && t.status !== 'done'
    );
    const allDone = dayTasks.every(t => t.status === 'done');
    const isToday = date.toDateString() === new Date().toDateString();
    
    if (hasOverdue) return 'bg-rose-50';
    if (allDone) return 'bg-emerald-50';
    if (isToday) return 'bg-blue-50';
    return 'bg-slate-50';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Section */}
      <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <CalendarIcon size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <button
              onClick={() => setDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>
        </div>
        
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-3 border-b border-slate-100">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <Calendar
          onChange={setDate}
          value={date}
          tileContent={tileContent}
          tileClassName={tileClassName}
          showNeighboringMonth={true}
          className="w-full"
        />
      </div>

      {/* Tasks Side Panel */}
      <div className="w-full lg:w-80 bg-white rounded-2xl shadow-lg border border-slate-100 p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <CalendarIcon size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {date.toLocaleDateString('en-US', { weekday: 'long' })}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        
        {selectedDateTasks.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-50 flex items-center justify-center">
              <CalendarIcon size={24} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 font-medium">No tasks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDateTasks.map(task => {
              const priority = PRIORITIES[task.priority] || PRIORITIES.low;
              const isOverdue = new Date(task.dueDate) < today && task.status !== 'done';
              const isDone = task.status === 'done';
              
              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="group p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priority.dot}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{task.title}</h4>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${priority.color}`}>
                          {priority.label}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-600 flex items-center gap-1">
                            <AlertCircle size={10} /> Overdue
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
