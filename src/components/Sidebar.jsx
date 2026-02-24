import { FolderPlus, Edit2, Trash2, Hash, Check, Users, Share2 } from 'lucide-react';
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
    <aside className={`${showSidebar ? 'w-64' : 'w-0'} h-full bg-white border-r border-slate-200 transition-all duration-300 overflow-hidden flex-shrink-0`}>
      <div className="w-64 h-full flex flex-col overflow-y-auto">

        {/* ── MY BOARDS ── */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">My Boards</h2>
            <button 
              onClick={onAddBoard} 
              className="p-1.5 hover:bg-slate-900 hover:text-white rounded-lg text-slate-400 transition-all" 
              title="Create new board"
            >
              <FolderPlus size={16} />
            </button>
          </div>
          
          <div className="space-y-1">
            {boards.map(board => {
              const isActive = currentBoard?.id === board.id && !currentBoard?.ownerId;
              return (
                <div 
                  key={board.id} 
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-slate-100 text-slate-900' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`} 
                  onClick={() => setCurrentBoard(board)}
                >
                  {/* Active Indicator */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    isActive 
                      ? 'bg-slate-900 text-white' 
                      : 'border-2 border-slate-200 group-hover:border-slate-300'
                  }`}>
                    {isActive && <Check size={12} strokeWidth={3} />}
                  </div>

                  <span className="flex-1 text-sm font-bold truncate tracking-tight">{board.name}</span>
                  
                  <div className={`hidden group-hover:flex items-center gap-1 text-slate-400`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditBoard(board); }} 
                      className="p-1 rounded hover:bg-slate-200 transition-colors"
                      title="Edit board"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteBoard(board); }} 
                      className="p-1 rounded hover:bg-rose-50 hover:text-rose-500 transition-colors"
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
            <Users size={12} className="text-slate-400" />
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shared with Me</h2>
          </div>
          
          <div className="space-y-1">
            {sharedBoards.map(sharedBoard => {
              // A shared board is "active" when currentBoard has this id AND an ownerId
              const isActive = currentBoard?.id === sharedBoard.id && !!currentBoard?.ownerId;
              return (
                <div 
                  key={sharedBoard.id} 
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-blue-900' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`} 
                  onClick={() => setCurrentBoard(sharedBoard)}
                  title={`Shared by ${sharedBoard.ownerName || 'someone'}`}
                >
                  {/* Active Indicator */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'border-2 border-slate-200 group-hover:border-blue-300'
                  }`}>
                    {isActive ? <Check size={12} strokeWidth={3} /> : <Share2 size={10} className="text-slate-300 group-hover:text-blue-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate tracking-tight">
                      {sharedBoard.boardName || sharedBoard.name || 'Shared Board'}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate">
                      by {sharedBoard.ownerName || 'someone'} · {ROLE_LABELS[sharedBoard.role] || sharedBoard.role}
                    </p>
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