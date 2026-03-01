import { useState, useRef, useEffect } from 'react';
import { 
  Layers, User, LogOut, BarChart3, Search, Calendar, CheckCircle2, AlertCircle, 
  Filter, ArrowUpDown, X, PanelLeftClose, PanelLeft, Folder, Archive, 
  MoreHorizontal, Settings, ChevronDown, Tag, Bell, Share2, Users, Sun, Moon, Plus
} from 'lucide-react';
import { PRIORITIES, COLUMNS, TAG_COLORS, DEFAULT_TAGS } from '../utils/constants';

const Header = ({
  user,
  currentBoard,
  showSidebar,
  setShowSidebar,
  handleSignOut,
  showStats,
  setShowStats,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  handleOpenCreateTask,
  canCreate,
  stats,
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  archivedCount,
  setShowArchived,
  allTags,
  onShareBoard,
  onShowTeam,
  teamMemberCount = 0,
  onShowNotifications,
  unreadNotificationsCount = 0,
  theme,
  toggleTheme
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const moreMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  
  const hasActiveFilters = filters.priority !== 'all' || filters.status !== 'all' || filters.tag !== 'all';

  const resetFilters = () => {
    setFilters({
      priority: 'all',
      status: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      tag: 'all',
    });
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 dark:border-slate-800 px-4 md:px-6 lg:px-8 py-3 sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: Toggle + Logo + Board */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Sidebar Toggle */}
          <button 
            onClick={() => setShowSidebar(!showSidebar)} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
            title={showSidebar ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {showSidebar ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </button>
          
          {/* Logo */}
          <div className="flex items-center select-none">
            <Layers size={22} className="text-slate-900 dark:text-slate-100 mr-2" strokeWidth={2.5} />
            <div className="flex items-baseline">
              <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-slate-100">Task</span>
              <span className="text-2xl font-light tracking-tighter text-slate-500 dark:text-slate-400">Flow</span>
            </div>
          </div>

          {/* Current Board Indicator */}
          {currentBoard && (
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                currentBoard.ownerId ? 'bg-blue-50' : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                <Folder size={16} className={currentBoard.ownerId ? 'text-blue-500' : 'text-slate-600 dark:text-slate-300'} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-0.5">
                  {currentBoard.ownerId ? `Shared by ${currentBoard.ownerName || 'someone'}` : 'Board'}
                </span>
                <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate max-w-[160px]">
                  {currentBoard.name || currentBoard.boardName || 'Untitled'}
                </h1>
              </div>
              {currentBoard.ownerId && (
                <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  {currentBoard.role || 'Editor'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center Section: View Mode + Search */}
        <div className="flex items-center gap-3 flex-1 justify-center max-w-xl">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex-shrink-0">
            <button 
              onClick={() => setViewMode('kanban')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'kanban' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'
              }`}
            >
              <Layers size={14} /> Board
            </button>
            <button 
              onClick={() => setViewMode('calendar')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'calendar' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'
              }`}
            >
              <Calendar size={14} /> Calendar
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 dark:focus:bg-slate-900 focus:border-slate-300 dark:border-slate-600 dark:focus:border-slate-600 transition-all outline-none" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        {/* Right Section: Actions + User */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Add Task Button (Visible if they have permission) */}
          {currentBoard && canCreate && (
            <button
              onClick={() => handleOpenCreateTask && handleOpenCreateTask()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 mr-1"
              title="Add a new task"
            >
              <Plus size={14} strokeWidth={2.5} />
              New Task
            </button>
          )}

          {/* Team Members Button */}
          {currentBoard && (
            <button
              onClick={onShowTeam}
              className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all"
              title="View team members"
            >
              <Users size={18} />
              {teamMemberCount >= 2 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {teamMemberCount > 9 ? '9+' : teamMemberCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications Bell */}
          <button 
            onClick={onShowNotifications}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700 transition-all relative"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-700 transition-all"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Filter Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`p-2 rounded-lg transition-all ${
              showFilters || hasActiveFilters 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700'
            }`}
            title="Filter & Sort"
          >
            <Filter size={18} />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>

          {/* More Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)} 
              className={`p-2 rounded-lg transition-all ${
                showMoreMenu ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700'
              }`}
              title="More options"
            >
              <MoreHorizontal size={18} />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                {/* Stats */}
                <button 
                  onClick={() => { setShowStats(!showStats); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
                >
                  <BarChart3 size={16} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {showStats ? 'Hide Statistics' : 'Show Statistics'}
                  </span>
                </button>

                {/* Archived Tasks */}
                <button 
                  onClick={() => { setShowArchived(true); setShowMoreMenu(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Archive size={16} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Archived Tasks</span>
                  </div>
                  {archivedCount > 0 && (
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-bold">
                      {archivedCount}
                    </span>
                  )}
                </button>

                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-slate-800 my-2" />

                {/* Future features can go here */}
                <div className="px-4 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Coming Soon</p>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 opacity-50 cursor-not-allowed">
                  <Settings size={16} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-400">Settings</span>
                </button>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <User size={16} />
                </div>
              )}
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={() => { handleSignOut(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 text-rose-600 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="text-sm font-semibold">Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel - Collapsible */}
      {showFilters && (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-slate-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Filter & Sort</span>
            </div>
            {hasActiveFilters && (
              <button 
                onClick={resetFilters}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 dark:text-slate-100 transition-colors"
              >
                <X size={12} /> Reset
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Priority Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
              <select 
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-slate-400 outline-none transition-all cursor-pointer"
              >
                <option value="all">All Priorities</option>
                {Object.entries(PRIORITIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-slate-400 outline-none transition-all cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Label</label>
              <select 
                value={filters.tag || 'all'}
                onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-slate-400 outline-none transition-all cursor-pointer"
              >
                <option value="all">All Labels</option>
                {(allTags || DEFAULT_TAGS).map((tag) => (
                  <option key={tag.id} value={tag.id}>{tag.label}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sort By</label>
              <select 
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-slate-400 outline-none transition-all cursor-pointer"
              >
                <option value="createdAt">Created Date</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order</label>
              <select 
                value={filters.sortOrder}
                onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-slate-400 outline-none transition-all cursor-pointer"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Panel */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total', val: stats.total, icon: Layers },
            { label: 'Done', val: stats.completed, icon: CheckCircle2 },
            { label: 'Urgent', val: stats.urgent, icon: AlertCircle },
            { label: 'Overdue', val: stats.overdue, icon: Calendar },
          ].map((s, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.label}</p>
                <s.icon size={14} className="text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.val}</p>
            </div>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
