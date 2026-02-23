import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Calendar
} from 'lucide-react';
import { PRIORITIES } from './utils/constants';
import Modal from './components/Modal';

const CalendarView = ({ tasks, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const daysInWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const formatKey = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysCount = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const tasksByDate = useMemo(() => {
    const grouped = {};
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const d = new Date(task.dueDate);
      const key = formatKey(d);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });
    return grouped;
  }, [tasks]);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push({ key: `prev-${i}`, type: 'empty' });
  }

  for (let i = 1; i <= daysCount; i++) {
    const fullDate = new Date(year, month, i);
    const dateKey = formatKey(fullDate);
    const dayTasks = tasksByDate[dateKey] || [];
    const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    calendarDays.push({
      key: dateKey,
      type: 'day',
      day: i,
      tasks: dayTasks,
      isToday,
      fullDate
    });
  }

  const handleDayClick = (day) => {
    setSelectedDay({
      date: day.fullDate,
      tasks: day.tasks
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-full w-full select-none shadow-sm">
        
        {/* Compact Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">
              <CalendarIcon size={16} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tighter uppercase">
              {monthNames[month]} <span className="text-slate-400 font-light">{year}</span>
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button onClick={prevMonth} className="p-1 hover:bg-white rounded-md text-slate-600 transition-all"><ChevronLeft size={16} /></button>
            <button onClick={goToToday} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-white rounded-md transition-all">Today</button>
            <button onClick={nextMonth} className="p-1 hover:bg-white rounded-md text-slate-600 transition-all"><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {daysInWeek.map((d) => (
            <div key={d} className="py-2 text-center border-r border-slate-100 last:border-0">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 auto-rows-fr flex-1 bg-slate-200 gap-[1px] overflow-hidden">
          {calendarDays.map((cell) => {
            if (cell.type === 'empty') {
              return <div key={cell.key} className="bg-slate-50/50" />;
            }

            return (
              <div
                key={cell.key}
                onClick={() => handleDayClick(cell)}
                className={`bg-white p-2 flex flex-col gap-1 min-h-0 hover:bg-slate-50 cursor-pointer transition-colors ${
                  cell.isToday ? 'bg-slate-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-black ${
                      cell.isToday
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700'
                    }`}
                  >
                    {cell.day}
                  </span>

                  {cell.tasks.length > 0 && (
                    <span className="text-[9px] font-black text-white bg-slate-900 px-1.5 py-0.5 rounded-full shadow-sm">
                      {cell.tasks.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                  {cell.tasks.slice(0, 3).map((task) => {
                    const priority = PRIORITIES[task.priority] || PRIORITIES.low;
                    
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        className={`px-1.5 py-0.5 rounded border-l-2 ${priority.border} bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer`}
                      >
                        <p className={`text-[9px] font-semibold truncate ${
                            task.status === 'done' ? 'text-slate-300 line-through' : 'text-slate-600'
                          }`}>
                          {task.title}
                        </p>
                      </div>
                    );
                  })}
                  {cell.tasks.length > 3 && (
                    <div className="text-[8px] font-medium text-slate-400 pl-1">
                      +{cell.tasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal with TaskCard-like styling */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={
          selectedDay
            ? selectedDay.date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              }).toUpperCase()
            : ''
        }
      >
        <div className="space-y-3">
          {selectedDay?.tasks.length === 0 ? (
            <div className="text-center py-12 opacity-30">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                <CalendarIcon size={32} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">
                Agenda Clear
              </p>
            </div>
          ) : (
            selectedDay?.tasks.map((task) => {
              const priority = PRIORITIES[task.priority] || PRIORITIES.low;
              const subtasksCount = task.subtasks?.length || 0;
              const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
              const progress = subtasksCount > 0 ? (completedSubtasks / subtasksCount) * 100 : 0;
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

              return (
                <div
                  key={task.id}
                  onClick={() => {
                    onTaskClick(task);
                    setSelectedDay(null);
                  }}
                  className={`group relative bg-gradient-to-br from-white to-slate-50 border-2 ${priority.border} rounded-xl p-3.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5 ${priority.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                        {priority.label}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 flex items-center gap-1">
                          <AlertCircle size={10} /> Overdue
                        </span>
                      )}
                      {task.status === 'done' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Done
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-bold text-slate-800 mb-1.5 line-clamp-2 leading-snug">{task.title}</h4>
                  
                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed font-normal">{task.description}</p>
                  )}
                  
                  {subtasksCount > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <CheckSquare size={10} /> {completedSubtasks}/{subtasksCount} Tasks
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center pt-3 border-t border-slate-50 mt-auto">
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                      <Calendar size={11} />
                      <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </>
  );
};

export default CalendarView;
