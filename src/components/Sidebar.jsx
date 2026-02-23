import { FolderPlus, Edit2, Trash2, Hash, Check } from 'lucide-react';

const Sidebar = ({ 
  showSidebar, 
  boards, 
  currentBoard, 
  setCurrentBoard, 
  onAddBoard, 
  onEditBoard, 
  onDeleteBoard 
}) => {
  return (
    <aside className={`${showSidebar ? 'w-64' : 'w-0'} h-full bg-white border-r border-slate-200 transition-all duration-300 overflow-hidden flex-shrink-0`}>
      <div className="w-64 h-full flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Your Boards</h2>
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
              const isActive = currentBoard?.id === board.id;
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
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                    isActive 
                      ? 'bg-slate-900 text-white' 
                      : 'border-2 border-slate-200 group-hover:border-slate-300'
                  }`}>
                    {isActive && <Check size={12} strokeWidth={3} />}
                  </div>

                  <span className="flex-1 text-sm font-bold truncate tracking-tight">{board.name}</span>
                  
                  <div className={`hidden group-hover:flex items-center gap-1 ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditBoard(board); }} 
                      className="p-1 rounded hover:bg-slate-200 transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteBoard(board); }} 
                      className="p-1 rounded hover:bg-rose-50 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {boards.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <Hash size={32} strokeWidth={1} className="mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-center">No Boards</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;