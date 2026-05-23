import React from 'react';
import { Trash2, ChevronRight } from 'lucide-react';
import Modal from '../Modal';

const DeleteBoardModal = ({
  isOpen,
  onClose,
  boardName,
  onConfirm
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Delete Protocol"
    >
      <div className="text-center py-2">
        <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
          <Trash2 size={28} className="text-slate-900 dark:text-slate-100" strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Permanently Remove Board?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-[260px] mx-auto leading-relaxed">
          This will erase <span className="text-slate-900 dark:text-slate-100 font-bold">"{boardName}"</span> and all associated data.
        </p>
        <div className="flex flex-col gap-3">
          <button 
            id="btn-confirm-delete-board"
            onClick={onConfirm}
            className="w-full px-4 py-3.5 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white dark:hover:text-white text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 group"
          >
            Confirm Deletion
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            id="btn-cancel-delete-board"
            onClick={onClose}
            className="w-full px-4 py-3 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 dark:text-slate-100 font-bold text-xs uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteBoardModal;
