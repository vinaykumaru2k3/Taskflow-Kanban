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

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (year, month) =>
    new Date(year, month, 1).getDay();

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );

  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

  const goToToday = () => setCurrentDate(new Date());

  // 🔒 timezone-safe day key
  const formatKey = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysCount = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  // ✅ group tasks by normalized day
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

  // leading blanks
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push({ key: `prev-${i}`, type: 'empty' });
  }

  // actual days
  for (let i = 1; i <= daysCount; i++) {
    const fullDate = new Date(year, month, i);
    const dateKey = formatKey(fullDate);
    const dayTasks = tasksByDate[dateKey] || [];

    const isToday =
      i === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

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
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-full min-h-0 w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/60 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
              <CalendarIcon size={20} strokeWidth={2} />
            </div>

            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {monthNames[month]}{' '}
              <span className="text-slate-400 font-medium">{year}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-blue-600 transition"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>

            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition"
            >
              Today
            </button>

            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-blue-600 transition"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Week header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {daysInWeek.map((d) => (
            <div key={d} className="py-3 text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 auto-rows-[minmax(110px,1fr)] flex-1 min-h-0 bg-slate-100 gap-[1px]">
          {calendarDays.map((cell) => {
            if (cell.type === 'empty') {
              return <div key={cell.key} className="bg-slate-50/30" />;
            }

            return (
              <div
                key={cell.key}
                onClick={() => handleDayClick(cell)}
                className={`bg-white p-2 flex flex-col gap-1 min-h-0 hover:bg-slate-50 cursor-pointer ${
                  cell.isToday ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold ${
                      cell.isToday
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-700'
                    }`}
                  >
                    {cell.day}
                  </span>

                  {cell.tasks.length > 0 && (
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {cell.tasks.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  {cell.tasks.slice(0, 3).map((task) => {
                    const priority =
                      PRIORITIES[task.priority] || PRIORITIES.medium;

                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        className="group relative pl-2 pr-1.5 py-1 rounded-md border border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm cursor-pointer"
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-md ${priority.dot}`}
                        />
                        <p
                          className={`text-[10px] font-bold truncate ${
                            task.status === 'done'
                              ? 'text-slate-400 line-through'
                              : 'text-slate-700'
                          }`}
                        >
                          {task.title}
                        </p>
                      </div>
                    );
                  })}

                  {cell.tasks.length > 3 && (
                    <div className="text-[9px] text-slate-400 font-medium text-center mt-auto">
                      + {cell.tasks.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={
          selectedDay
            ? selectedDay.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })
            : ''
        }
      >
        <div className="space-y-3">
          {selectedDay?.tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                <CalendarIcon size={32} />
              </div>
              <p className="text-slate-500 font-medium">
                No tasks scheduled for this day.
              </p>
            </div>
          ) : (
            selectedDay?.tasks.map((task) => {
              const priority =
                PRIORITIES[task.priority] || PRIORITIES.medium;

              const isOverdue =
                new Date(task.dueDate) < new Date() &&
                task.status !== 'done';

              return (
                <div
                  key={task.id}
                  onClick={() => {
                    onTaskClick(task);
                    setSelectedDay(null);
                  }}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition cursor-pointer bg-white"
                >
                  <div className={`w-1 h-12 rounded-full ${priority.dot}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${priority.color}`}
                      >
                        {priority.label}
                      </span>

                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-600 flex items-center gap-1">
                          <AlertCircle size={10} /> Overdue
                        </span>
                      )}

                      {task.status === 'done' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Completed
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-bold ${
                        task.status === 'done'
                          ? 'text-slate-400 line-through'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-slate-400 truncate mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-blue-500"
                  />
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
