import { useState, useRef, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import TaskCard from './TaskCard';
import { COLUMNS } from '../utils/constants';
import { useTouchDnd } from '../hooks/useTouchDnd';

/**
 * KanbanBoard
 *
 * On desktop (md+): 4-column grid with HTML5 DnD.
 * On mobile (< md): Single-column carousel, swipe left/right to switch columns.
 *                   Long-press a card to enter touch-DnD mode and drag to
 *                   adjacent columns.
 */
const KanbanBoard = ({
  tasks,
  onDragStart,       // HTML5 DnD (desktop)
  onDrop,            // HTML5 DnD (desktop) — also called for touch drop
  onEditTask,
  onDeleteTask,
  onAddTask,
  onArchiveTask,
  readOnly,
}) => {
  const boardRef = useRef(null); // ref for the desktop grid container (overlay anchor)
  // ── Mobile carousel state ──────────────────────────────────────────────
  const [activeColIndex, setActiveColIndex] = useState(0);
  const carouselRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // ── Touch DnD ─────────────────────────────────────────────────────────
  const handleTouchDrop = useCallback(
    (taskId, targetColumnId) => {
      // Fake a DnD event compatible with the existing handler in App.jsx
      const fakeEvent = { dataTransfer: { getData: () => taskId } };
      onDrop(fakeEvent, targetColumnId);
    },
    [onDrop]
  );

  const { getCardHandlers, dragging, overColumnId } = useTouchDnd({
    onDrop: handleTouchDrop,
    enabled: !readOnly,
  });

  // ── Swipe detection for mobile column carousel ─────────────────────────
  const handleCarouselTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleCarouselTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    // Only register horizontal swipes (dx significant, dy not too large)
    if (Math.abs(dx) > 50 && dy < 80) {
      if (dx < 0 && activeColIndex < COLUMNS.length - 1) {
        setActiveColIndex((i) => i + 1);
      } else if (dx > 0 && activeColIndex > 0) {
        setActiveColIndex((i) => i - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // ── Desktop HTML5 DnD column props ────────────────────────────────────
  const desktopColumnProps = (col) => ({
    onDragOver: (e) => e.preventDefault(),
    onDrop: (e) => onDrop(e, col.id),
  });

  return (
    <>
      {/* ── Desktop (md+): 4-column grid ── */}
      {/* position:relative so the SVG overlay can be abs-positioned over this */}
      <div ref={boardRef} className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const dropHighlight = dragging && overColumnId === col.id;

          return (
            <div
              key={col.id}
              {...desktopColumnProps(col)}
              data-column-id={col.id}
              className={`flex flex-col rounded-xl transition-all duration-150 ${
                dropHighlight
                  ? 'ring-2 ring-blue-500/40 bg-blue-50/30 dark:bg-blue-500/5'
                  : ''
              }`}
              style={{ contain: 'layout style' }}
            >
              <ColumnHeader col={col} count={colTasks.length} />
              <div className="space-y-3 min-h-[200px]">
                {colTasks.map((task) => (
                  // data-task-id lets DependencyOverlay locate each card via querySelector
                  <div key={task.id}>
                    <TaskCard
                      task={task}
                      onDelete={onDeleteTask}
                      onEdit={onEditTask}
                      onDragStart={onDragStart}
                      onArchive={onArchiveTask}
                      readOnly={readOnly}
                      touchHandlers={getCardHandlers(task.id)}
                    />
                  </div>
                ))}
                <AddTaskButton col={col} onAddTask={onAddTask} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mobile (< md): Swipeable column carousel ── */}
      <div className="md:hidden flex flex-col gap-4">
        {/* Column Tab Indicators */}
        <div className="flex items-center gap-2 px-1">
          {COLUMNS.map((col, i) => (
            <button
              key={col.id}
              onClick={() => setActiveColIndex(i)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                i === activeColIndex
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500'
              }`}
            >
              <span>{col.title}</span>
              <span className="ml-1 opacity-60">
                ({tasks.filter((t) => t.status === col.id).length})
              </span>
            </button>
          ))}
        </div>

        {/* Swipeable card list */}
        <div
          ref={carouselRef}
          onTouchStart={handleCarouselTouchStart}
          onTouchEnd={handleCarouselTouchEnd}
          className="relative"
        >
          {COLUMNS.map((col, i) => {
            if (i !== activeColIndex) return null;
            const colTasks = tasks.filter((t) => t.status === col.id);
            const dropHighlight = dragging && overColumnId === col.id;

            return (
              <div
                key={col.id}
                data-column-id={col.id}
                className={`space-y-3 min-h-[300px] transition-all duration-150 ${
                  dropHighlight
                    ? 'ring-2 ring-blue-500/40 rounded-xl p-2 bg-blue-50/20 dark:bg-blue-500/5'
                    : ''
                }`}
              >
                {colTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-700">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-sm font-semibold">No tasks here yet</p>
                    {onAddTask && col.id === 'todo' && (
                      <p className="text-xs text-slate-400 mt-1">Tap + to add one</p>
                    )}
                  </div>
                )}

                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDelete={onDeleteTask}
                    onEdit={onEditTask}
                    onDragStart={onDragStart}
                    onArchive={onArchiveTask}
                    readOnly={readOnly}
                    touchHandlers={getCardHandlers(task.id)}
                  />
                ))}

                <AddTaskButton col={col} onAddTask={onAddTask} />
              </div>
            );
          })}

          {/* Arrow navigation buttons */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setActiveColIndex((i) => Math.max(0, i - 1))}
              disabled={activeColIndex === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronLeft size={16} />
              <span className="text-xs font-bold">{COLUMNS[activeColIndex - 1]?.title ?? ''}</span>
            </button>
            <button
              onClick={() => setActiveColIndex((i) => Math.min(COLUMNS.length - 1, i + 1))}
              disabled={activeColIndex === COLUMNS.length - 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-30 transition-all active:scale-95"
            >
              <span className="text-xs font-bold">{COLUMNS[activeColIndex + 1]?.title ?? ''}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

function ColumnHeader({ col, count }) {
  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {col.title}
      </h2>
      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
        {count}
      </span>
    </div>
  );
}

function AddTaskButton({ col, onAddTask }) {
  if (!onAddTask || col.id !== 'todo') return null;
  return (
    <button
      onClick={() => onAddTask(col.id)}
      className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all group/btn active:scale-95"
    >
      <Plus size={16} className="group-hover/btn:scale-110 transition-transform" />
      <span className="text-xs font-bold">Add Task</span>
    </button>
  );
}

export default KanbanBoard;
