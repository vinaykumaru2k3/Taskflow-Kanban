import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle
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

        {/* Calendar grid - Fixed height issues with flex-1 */}
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

                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  {cell.tasks.slice(0, 2).map((task) => {
                    const taskPriority = PRIORITIES[task.priority] || PRIORITIES.low;
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        className={`group relative pl-2 pr-1.5 py-0.5 rounded bg-slate-50 border-l-2 ${taskPriority.border} hover:bg-slate-100 transition-all`}
                      >
                        <p className={`text-[9px] font-bold truncate ${
                            task.status === 'done' ? 'text-slate-300 line-through' : 'text-slate-600'
                          }`}>
                          {task.title}
                        </p>
                      </div>
                    );
                  })}
                  {cell.tasks.length > 2 && (
                    <div className="text-[8px] font-black text-slate-300 pl-1 mt-auto">
                      + {cell.tasks.length - 2} MORE
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal - Kept your original logic but monochromatic */}
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
              const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
              const taskPriority = PRIORITIES[task.priority] || PRIORITIES.low;

              return (
                <div
                  key={task.id}
                  onClick={() => {
                    onTaskClick(task);
                    setSelectedDay(null);
                  }}
                  className={`group flex items-center gap-4 p-4 rounded-xl border-l-4 ${taskPriority.border} border border-slate-100 hover:border-slate-300 transition-all cursor-pointer bg-white shadow-sm`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${taskPriority.color}`}>
                        {taskPriority.label}
                      </span>

                      {isOverdue && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded bg-rose-500 text-white uppercase flex items-center gap-1">
                          <AlertCircle size={10} /> Overdue
                        </span>
                      )}

                      {task.status === 'done' && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-50 text-slate-400 uppercase flex items-center gap-1 border border-slate-100">
                          <CheckCircle2 size={10} /> Done
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-bold tracking-tight ${
                        task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'
                      }`}>
                      {task.title}
                    </h4>
                  </div>

                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
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