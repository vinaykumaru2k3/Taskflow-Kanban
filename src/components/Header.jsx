import { Layers, User, LogOut, BarChart3, Search, Calendar, CheckCircle2, AlertCircle, Filter, ArrowUpDown, X } from 'lucide-react';
import { PRIORITIES, COLUMNS } from '../utils/constants';

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
  stats,
  showFilters,
  setShowFilters,
  filters,
  setFilters
}) => {
  const hasActiveFilters = filters.priority !== 'all' || filters.status !== 'all';

  const resetFilters = () => {
    setFilters({
      priority: 'all',
      status: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 lg:px-8 py-3 sticky top-0 z-40 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle */}
          <button 
            onClick={() => setShowSidebar(!showSidebar)} 
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            <Layers size={20} />
          </button>
          
          {/* Monochromatic Text Logo */}
          <div className="flex items-center select-none">
            <Layers size={22} className="text-slate-900 mr-2" strokeWidth={2.5} />
            <div className="flex items-baseline">
              <span className="text-2xl font-black tracking-tighter text-slate-900">
                Task
              </span>
              <span className="text-2xl font-light tracking-tighter text-slate-500">
                Flow
              </span>
            </div>
          </div>

          {/* Current Board Indicator */}
          {currentBoard && (
            <div className="flex items-center pl-4 border-l border-slate-200 ml-3">
              <span className="text-slate-300 mx-1 select-none font-extralight text-xl">/</span>
              <div className="flex flex-col ml-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">
                  Active Board
                </span>
                <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none truncate max-w-[150px] hidden sm:block">
                  {currentBoard.name}
                </h1>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {/* Filter Toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              showFilters || hasActiveFilters ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Filter size={16} /> 
            Filter
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-white" />
            )}
          </button>

          {/* Stats Toggle */}
          <button 
            onClick={() => setShowStats(!showStats)} 
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              showStats ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart3 size={16} /> Stats
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('kanban')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers size={14} /> Board
            </button>
            <button 
              onClick={() => setViewMode('calendar')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar size={14} /> Calendar
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 lg:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-slate-300 transition-all w-full lg:w-48 outline-none" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          
          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 ml-2">
            <div className="flex items-center gap-2">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-slate-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                  <User size={16} />
                </div>
              )}
              <span className="text-xs font-bold text-slate-600 hidden md:block">
                {user?.displayName || 'User'}
              </span>
            </div>
            <button 
              onClick={handleSignOut} 
              className="p-2 text-slate-400 hover:text-rose-600 transition-colors" 
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-slate-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Filter & Sort</span>
            </div>
            {hasActiveFilters && (
              <button 
                onClick={resetFilters}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X size={12} /> Reset
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Priority Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
              <select 
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:border-slate-400 outline-none transition-all cursor-pointer"
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:border-slate-400 outline-none transition-all cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sort By</label>
              <select 
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:border-slate-400 outline-none transition-all cursor-pointer"
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:border-slate-400 outline-none transition-all cursor-pointer"
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
            <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {s.label}
                </p>
                <s.icon size={14} className="text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.val}</p>
            </div>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
