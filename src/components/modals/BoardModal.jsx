import React from 'react';
import { Layers, ChevronRight } from 'lucide-react';
import Modal from '../Modal';

const BoardModal = ({
  isOpen,
  onClose,
  editingBoard,
  boardForm,
  setBoardForm,
  onSaveBoard
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => { onClose(); }} 
      title={editingBoard ? 'Update Protocol' : 'New Board'}
    >
      <form onSubmit={onSaveBoard} className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Board Name</label>
            <Layers size={14} className="text-slate-300" />
          </div>
          <input 
            id="input-board-name"
            required 
            autoFocus
            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-xl text-base font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900/10 dark:focus:border-slate-600 outline-none transition-all" 
            placeholder="e.g., Sprint Planning" 
            value={boardForm.name || ''} 
            onChange={e => setBoardForm({...boardForm, name: e.target.value})} 
          />
          <p className="mt-3 text-[10px] text-slate-400 font-medium leading-relaxed">
            This board will follow the default <span className="text-slate-900 dark:text-slate-100 font-bold">Monochrome Protocol</span>.
          </p>
        </div>
        <div className="pt-2">
          <button 
            id="btn-submit-board" 
            type="submit" 
            className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {editingBoard ? 'Apply Changes' : 'Initialize Board'}
            <ChevronRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BoardModal;
