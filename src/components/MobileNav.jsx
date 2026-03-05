import { Layers, Calendar, Workflow, Plus, Menu } from 'lucide-react';

/**
 * MobileNav
 *
 * A fixed bottom navigation bar shown only on small screens (< md).
 * Provides quick access to all view modes and "New Task" action.
 * Styled with a glassy frosted glass effect and smooth indicator.
 */
const MobileNav = ({
  viewMode,
  setViewMode,
  onNewTask,
  canCreate,
  onToggleSidebar,
  currentBoard,
}) => {
  const tabs = [
    { id: 'boards',    label: 'Boards',    icon: Menu,      action: onToggleSidebar },
    { id: 'kanban',   label: 'Board',     icon: Layers,    viewMode: 'kanban'   },
    { id: 'calendar', label: 'Calendar',  icon: Calendar,  viewMode: 'calendar' },
    { id: 'workflow', label: 'Workflow', icon: Workflow, viewMode: 'workflow' },
  ];

  return (
    // [safari/ios] safe-area-inset-bottom ensures the nav clears the home indicator
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-[#0a0f1c]/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.viewMode ? viewMode === tab.viewMode : false;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.action) {
                  tab.action();
                } else if (tab.viewMode) {
                  setViewMode(tab.viewMode);
                }
              }}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all active:scale-90 min-h-[52px] ${
                isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active pill indicator */}
              {isActive && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full bg-blue-500" />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? 'text-blue-600 dark:text-blue-400' : ''}
              />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                isActive ? 'text-blue-600 dark:text-blue-400' : ''
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Center FAB — New Task */}
        {canCreate && currentBoard && (
          <button
            onClick={onNewTask}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl active:scale-90 transition-all min-h-[52px] text-slate-400 dark:text-slate-500"
            aria-label="New task"
          >
            <div className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all active:scale-90">
              <Plus size={20} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider">New</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default MobileNav;
