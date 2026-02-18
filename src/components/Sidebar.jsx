import React from 'react';
import { FolderPlus, Edit2, Trash2, Layers } from 'lucide-react';

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
    <aside className={`${showSidebar ? 'w-64' : 'w-0'} fixed z-30 h-full bg-white border-r border-slate-200 transition-all duration-300 overflow-hidden`}>
      <div className="w-64 h-full flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Boards</h2>
            <button 
              onClick={onAddBoard} 
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" 
              title="Create new board"
            >
              <FolderPlus size={16} />
            </button>
          </div>
          <div className="space-y-1">
            {boards.map(board => (
              <div 
                key={board.id} 
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${currentBoard?.id === board.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600'}`} 
                onClick={() => setCurrentBoard(board)}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: board.color || '#3B82F6' }} />
                <span className="flex-1 text-sm font-bold truncate">{board.name}</span>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); onEditBoard(board); }} className="p-1 hover:bg-slate-200 rounded">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteBoard(board); }} className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-500 rounded">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {boards.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No boards yet.<br />Create one to get started!</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
