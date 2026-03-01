import { Folder, FolderPlus, Edit2, Trash2, Hash, Check, Users, Share2, ChevronRight } from 'lucide-react';
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
  return (
    <aside className={`${showSidebar ? 'w-64' : 'w-0'} h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 overflow-hidden flex-shrink-0`}>
      <div className="w-64 h-full flex flex-col overflow-y-auto">

        {/* ── MY BOARDS ── */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Folder size={12} strokeWidth={3} className="text-slate-400" />
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">My Boards</h2>
            </div>
            <button 
              onClick={onAddBoard} 
              className="p-1.5 hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-900 rounded-lg text-slate-400 transition-all" 
              title="Create new board"
            >
              <FolderPlus size={16} />
            </button>
          </div>
          
          <div className="space-y-1">
            {boards.map(board => {
              const isActive = currentBoard?.id === board.id && !currentBoard?.ownerId;
              const initials = board.name ? board.name.substring(0, 2).toUpperCase() : 'B';
              
              return (
                <div 
                  key={board.id} 
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`} 
                  onClick={() => setCurrentBoard(board)}
                >
                  {/* Avatar/Badge */}
                  <div className={`relative w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-[9px] font-black transition-colors ${
                    isActive
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                  }`}>
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate tracking-tight mb-0.5">
                      {board.name}
                    </p>
                    <p className={`text-[9px] truncate ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      Personal Board
                    </p>
                  </div>
                  
                  <div className={`hidden group-hover:flex items-center gap-0.5`}>
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
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={12} strokeWidth={3} className="text-slate-400" />
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shared with Me</h2>
          </div>
          
          <div className="space-y-1">
            {sharedBoards.map(sharedBoard => {
              // A shared board is "active" when currentBoard has this id AND an ownerId
              const isActive = currentBoard?.id === sharedBoard.id && !!currentBoard?.ownerId;
              const ownerName = sharedBoard.ownerName || 'Someone';
              const initials = ownerName.substring(0, 2).toUpperCase();
              
              return (
                <div 
                  key={sharedBoard.id} 
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`} 
                  onClick={() => setCurrentBoard(sharedBoard)}
                  title={`Shared by ${ownerName}`}
                >
                  {/* Avatar/Badge */}
                  <div className={`relative w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-[9px] font-black transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
                  }`}>
                    {initials}
                    {/* Role indicator overlay */}
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] font-bold border-2 ${
                      isActive 
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-50 dark:border-blue-900/40' 
                        : 'bg-white dark:bg-slate-900 text-slate-400 border-white dark:border-slate-900'
                    }`}>
                      <Share2 size={6} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate tracking-tight mb-0.5">
                      {sharedBoard.boardName || sharedBoard.name || 'Shared Board'}
                    </p>
                    <p className={`text-[9px] truncate ${isActive ? 'text-blue-600/70 dark:text-blue-300' : 'text-slate-400 dark:text-slate-500'}`}>
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
    </aside>
  );
};

export default Sidebar;