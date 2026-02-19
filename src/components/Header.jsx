import React from 'react';
import { Layers, User, LogOut, BarChart3, Search, Plus, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

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
  stats
}) => {
  return (
    <header className="bg-gradient-to-r from-white to-blue-50/30 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 lg:px-8 py-4 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors lg:hidden">
              <Layers size={20} />
            </button>
            <img src="/Taskflow logo.png" alt="TaskFlow" className="h-10 w-auto" />
            {currentBoard && (
              <div className="flex items-center gap-3 pl-4 border-l-2 border-slate-100 ml-1">
                <span className="w-3 h-3 rounded-full ring-4 ring-slate-50" style={{ backgroundColor: currentBoard.color || '#3B82F6' }} />
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">{currentBoard.name}</h1>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button onClick={() => setShowStats(!showStats)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${showStats ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <BarChart3 size={16} /> Stats
            </button>
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button 
                onClick={() => setViewMode('kanban')} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Layers size={14} /> Board
              </button>
              <button 
                onClick={() => setViewMode('calendar')} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Calendar size={14} /> Calendar
              </button>
            </div>
            <div className="relative flex-1 lg:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-300 transition-all w-full lg:w-48 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 ml-2">
              <div className="flex items-center gap-2">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border-2 border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                    <User size={16} />
                  </div>
                )}
                <span className="text-xs font-bold text-slate-600 hidden md:block">{user?.displayName || 'User'}</span>
              </div>
              <button onClick={handleSignOut} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all" title="Sign out">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total', val: stats.total, bg: 'bg-blue-50', text: 'text-blue-600' },
            { label: 'Done', val: stats.completed, bg: 'bg-emerald-50', text: 'text-emerald-600' },
            { label: 'Urgent', val: stats.urgent, bg: 'bg-orange-50', text: 'text-orange-600' },
            { label: 'Overdue', val: stats.overdue, bg: 'bg-rose-50', text: 'text-rose-600' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} p-3 rounded-xl border border-slate-100`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${s.text}`}>{s.label}</p>
                {i === 0 && <Layers size={14} className={s.text} />}
                {i === 1 && <CheckCircle2 size={14} className={s.text} />}
                {i === 2 && <AlertCircle size={14} className={s.text} />}
                {i === 3 && <Calendar size={14} className={s.text} />}
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.val}</p>
            </div>
          ))}
        </div>
      )}
      </div>
    </header>
  );
};

export default Header;
