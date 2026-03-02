import { Folder, FolderPlus, Edit2, Trash2, Hash, Users, Share2, ChevronRight } from 'lucide-react';
import { ROLE_LABELS } from '../utils/constants';

const Sidebar = ({
  showSidebar,
  boards,
  sharedBoards = [],
  currentBoard,
  setCurrentBoard,
  onAddBoard,
  onEditBoard,
  onDeleteBoard
}) => {
  // ── Reusable inner content ────────────────────────────────────────────
  // Rendered inside both the mobile sheet and the desktop panel.
  const SidebarContent = (
    // [safari] -webkit-overflow-scrolling: touch → momentum scroll on iOS
    <div className="w-64 h-full flex flex-col overflow-y-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>

      {/* ── MY BOARDS ── */}
      <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-2">
            <Folder size={14} strokeWidth={2.5} className="text-slate-400" />
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Boards</h2>
          </div>
          <button
            onClick={onAddBoard}
            className="p-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300 transition-all shadow-sm active:scale-95"
            title="Create new board"
          >
            <FolderPlus size={14} />
          </button>
        </div>

        <div className="space-y-1.5">
          {boards.map(board => {
            const isActive = currentBoard?.id === board.id && !currentBoard?.ownerId;
            const initials = board.name ? board.name.substring(0, 2).toUpperCase() : 'B';

            return (
              <div
                key={board.id}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-white dark:bg-white/10 border-slate-200/60 dark:border-slate-700/60 shadow-sm text-slate-900 dark:text-white'
                    : 'border-transparent hover:bg-white/60 dark:hover:bg-white/5 hover:border-slate-200/40 dark:hover:border-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
                onClick={() => setCurrentBoard(board)}
              >
                {/* Avatar/Badge */}
                <div className={`relative w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                    : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate tracking-tight mb-0.5 ${isActive ? 'text-slate-900 dark:text-white' : 'group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>
                    {board.name}
                  </p>
                  <p className={`text-[9px] truncate transition-colors ${isActive ? 'text-slate-500 dark:text-slate-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    Personal Board
                  </p>
                </div>

                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditBoard(board); }}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    title="Edit board"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteBoard(board); }}
                    className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    title="Delete board"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}

          {boards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 opacity-40">
              <Hash size={28} strokeWidth={1} className="mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-center">No Boards</p>
              <p className="text-[9px] text-slate-400 mt-1 text-center">Click + to create one</p>
            </div>
          )}
        </div>
      </div>

      {/* ── SHARED WITH ME ── */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-5 px-1">
          <Users size={14} strokeWidth={2.5} className="text-slate-400" />
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shared with Me</h2>
        </div>

        <div className="space-y-1.5">
          {sharedBoards.map(sharedBoard => {
            const isActive = currentBoard?.id === sharedBoard.id && !!currentBoard?.ownerId;
            const ownerName = sharedBoard.ownerName || 'Someone';
            const initials = ownerName.substring(0, 2).toUpperCase();

            return (
              <div
                key={sharedBoard.id}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-blue-50/80 dark:bg-blue-500/10 shadow-sm border-blue-100/50 dark:border-blue-500/20 text-blue-900 dark:text-blue-100'
                    : 'border-transparent hover:bg-white/50 dark:hover:bg-white/5 hover:border-slate-200/40 dark:hover:border-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
                onClick={() => setCurrentBoard(sharedBoard)}
                title={`Shared by ${ownerName}`}
              >
                <div className={`relative w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500/30'
                    : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}>
                  {initials}
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] font-bold border-2 ${
                    isActive
                      ? 'bg-white dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 border-blue-50 dark:border-[#0f172a]'
                      : 'bg-white dark:bg-slate-900 text-slate-400 border-white dark:border-slate-900'
                  }`}>
                    <Share2 size={6} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate tracking-tight mb-0.5 ${isActive ? 'text-blue-900 dark:text-blue-100' : 'group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>
                    {sharedBoard.boardName || sharedBoard.name || 'Shared Board'}
                  </p>
                  <p className={`text-[9px] truncate ${isActive ? 'text-blue-600/70 dark:text-blue-300 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    {ownerName.split(' ')[0]} · {ROLE_LABELS[sharedBoard.role] || sharedBoard.role}
                  </p>
                </div>

                <div className={`hidden group-hover:flex items-center opacity-50 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                  <ChevronRight size={14} />
                </div>
              </div>
            );
          })}

          {sharedBoards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 opacity-30">
              <Users size={24} strokeWidth={1} className="mb-2" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-center">None yet</p>
              <p className="text-[9px] text-slate-400 mt-1 text-center leading-tight">Boards others share<br/>with you appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile: fixed overlay sheet ───────────────────────────────── */}
      {/* Slides in from the left, sits above the backdrop overlay in App.jsx */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full z-20 w-72 bg-slate-50/80 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-800/50 transition-transform duration-300 ease-in-out overflow-hidden shadow-2xl ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Board sidebar"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', willChange: 'transform' }}
      >
        {SidebarContent}
      </aside>

      {/* ── Desktop: flex child that animates width ───────────────────── */}
      <aside
        className={`hidden md:block bg-slate-50/80 dark:bg-white/[0.02] backdrop-blur-2xl overflow-hidden flex-shrink-0 transition-[width,border-width] duration-300 ease-in-out ${
          showSidebar
            ? 'w-64 border-r border-slate-200/50 dark:border-slate-800/50'
            : 'w-0 border-0'
        }`}
        aria-label="Board sidebar"
        style={{ willChange: 'width' }}
      >
        {SidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;