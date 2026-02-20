import React, { useState, useMemo } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ChevronRight, Layers, Hash } from 'lucide-react';
import Landing from './Landing';
import CalendarView from './CalendarView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import Modal from './components/Modal';
import { PRIORITIES } from './utils/constants';
import { useAuth } from './hooks/useAuth';
import { useBoards } from './hooks/useBoards';
import { useTasks } from './hooks/useTasks';

export default function App() {
  // Custom Hooks
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const { boards, currentBoard, setCurrentBoard, createBoard, updateBoard, deleteBoard } = useBoards(user);
  const { tasks, createTask, updateTask, deleteTask } = useTasks(user, currentBoard);

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');

  // Form States
  const [boardForm, setBoardForm] = useState({ name: '', color: '#1e293b' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, boardId: null, boardName: '' });
  const initialTaskState = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: [], subtasks: [] };
  const [taskForm, setTaskForm] = useState(initialTaskState);

  // --- Board Handlers ---

  const onSaveBoard = async (e) => {
    e.preventDefault();
    if (!boardForm.name.trim()) return;
    try {
      if (editingBoard) {
        await updateBoard(editingBoard, { name: boardForm.name, color: '#1e293b' });
        setEditingBoard(null);
      } else {
        await createBoard({ name: boardForm.name, color: '#1e293b' });
      }
      setShowBoardModal(false);
      setBoardForm({ name: '', color: '#1e293b' });
    } catch (error) { console.error(error); }
  };

  const confirmDeleteBoard = (board) => {
    setDeleteConfirm({ show: true, boardId: board.id, boardName: board.name });
  };

  const onConfirmDeleteBoard = async () => {
    if (deleteConfirm.boardId) {
      await deleteBoard(deleteConfirm.boardId);
      setDeleteConfirm({ show: false, boardId: null, boardName: '' });
    }
  };

  const openEditBoard = (board) => {
    setEditingBoard(board.id);
    setBoardForm({ name: board.name, color: board.color });
    setShowBoardModal(true);
  };

  // --- Task Handlers ---

  const handleOpenCreateTask = () => {
    setEditingTask(null); // Reset ID so it treats as a new task
    setTaskForm({ ...initialTaskState });
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task.id);
    setTaskForm({ ...task });
    setIsModalOpen(true);
  };

  const handleAddTaskToColumn = (status) => {
    setEditingTask(null); // Ensure we are NOT in edit mode
    setTaskForm({ ...initialTaskState, status }); 
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      if (editingTask) {
        await updateTask(editingTask, taskForm);
      } else {
        await createTask(taskForm);
      }
      setIsModalOpen(false);
      setEditingTask(null);
      setTaskForm(initialTaskState);
    } catch (err) { console.error(err); }
  };

  const handleDragStart = (e, id) => { e.dataTransfer.setData('taskId', id); };

  const handleDrop = async (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId');
    if (!id) return;
    await updateTask(id, { status });
  };

  // --- Subtask Handlers ---

  const handleAddSubtask = () => {
    setTaskForm(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), { id: Date.now(), text: '', completed: false }] }));
  };

  const toggleSubtask = (id) => {
    setTaskForm(prev => ({ ...prev, subtasks: prev.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s) }));
  };

  const removeSubtask = (id) => {
    setTaskForm(prev => ({ ...prev, subtasks: prev.subtasks.filter(s => s.id !== id) }));
  };

  // --- Memoized Data ---

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tasks, searchQuery]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    return { total, completed, urgent, overdue };
  }, [tasks]);

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-white text-slate-900">
      <div className="flex flex-col items-center gap-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black tracking-[0.3em] text-[10px] uppercase text-slate-400">Syncing</p>
      </div>
    </div>
  );

  if (!user) {
    return <Landing onGoogleSignIn={signInWithGoogle} onEmailSignIn={signInWithEmail} isLoading={false} />;
  }

  return (
    <div className="h-screen flex bg-white text-slate-900 overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar 
        showSidebar={showSidebar}
        boards={boards}
        currentBoard={currentBoard}
        setCurrentBoard={setCurrentBoard}
        onAddBoard={() => { setEditingBoard(null); setBoardForm({ name: '', color: '#1e293b' }); setShowBoardModal(true); }}
        onEditBoard={openEditBoard}
        onDeleteBoard={confirmDeleteBoard}
      />

      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${showSidebar ? 'lg:pl-64' : 'lg:pl-0'}`}>
        <Header 
          user={user}
          currentBoard={currentBoard}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          handleSignOut={signOut}
          showStats={showStats}
          setShowStats={setShowStats}
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleOpenCreateTask={handleOpenCreateTask}
          stats={stats}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30"> 
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {viewMode === 'calendar' ? (
                <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <CalendarView tasks={filteredTasks} onTaskClick={handleOpenEditTask} />
                </div>
              ) : (
                <KanbanBoard 
                  tasks={filteredTasks}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  onEditTask={handleOpenEditTask}
                  onDeleteTask={deleteTask}
                  onAddTask={handleAddTaskToColumn}
                />
              )}
            </div>
          </main>

          {/* Fixed Footer */}
          <footer className="px-8 py-3 text-center border-t border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-center gap-2 opacity-40">
              <Layers size={12} />
              <p className="text-[9px] font-black uppercase tracking-[0.3em]">TaskFlow Protocol © 2026</p>
            </div>
          </footer>
        </div>
      </div>

      {/* Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTask(null); }} title={editingTask ? "Update Entry" : "New Entry"}>
        <form onSubmit={handleSaveTask} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
              <input required className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-slate-900/10 outline-none transition-all" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
              <select className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold text-slate-800 focus:border-slate-900/10 outline-none transition-all cursor-pointer" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                {Object.keys(PRIORITIES).map(p => (<option key={p} value={p}>{PRIORITIES[p].label}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
            <textarea className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-medium text-slate-600 focus:bg-white focus:border-slate-900/10 outline-none transition-all min-h-[100px] resize-none" placeholder="Contextual details..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deadline</label>
            <input type="date" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold text-slate-800 focus:border-slate-900/10 outline-none transition-all" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checklist</label>
              <button type="button" onClick={handleAddSubtask} className="text-[10px] font-black text-slate-900 hover:opacity-70 flex items-center gap-1">
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
              {taskForm.subtasks?.map((sub, idx) => (
                <div key={sub.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group/sub border border-transparent hover:border-slate-200 transition-all">
                  <button type="button" onClick={() => toggleSubtask(sub.id)} className={`transition-colors ${sub.completed ? 'text-slate-900' : 'text-slate-300'}`}>
                    {sub.completed ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <Circle size={18} strokeWidth={2.5} />}
                  </button>
                  <input className={`flex-1 bg-transparent border-none text-xs font-bold outline-none ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700'}`} value={sub.text} placeholder="Item description..." onChange={(e) => { const updated = [...taskForm.subtasks]; updated[idx].text = e.target.value; setTaskForm({...taskForm, subtasks: updated}); }} />
                  <button type="button" onClick={() => removeSubtask(sub.id)} className="opacity-0 group-hover/sub:opacity-100 text-slate-400 hover:text-rose-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
            {editingTask ? 'Update Entry' : 'Create Entry'}
            <ChevronRight size={16} />
          </button>
        </form>
      </Modal>

      {/* Simplified Board Modal */}
      <Modal 
        isOpen={showBoardModal} 
        onClose={() => { setShowBoardModal(false); setEditingBoard(null); setBoardForm({ name: '', color: '#1e293b' }); }} 
        title={editingBoard ? 'Update Protocol' : 'New Board'}
      >
        <form onSubmit={onSaveBoard} className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Board Name</label>
              <Layers size={14} className="text-slate-300" />
            </div>
            <input 
              required 
              autoFocus
              className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-xl text-base font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-slate-900/10 outline-none transition-all" 
              placeholder="e.g., Sprint Planning" 
              value={boardForm.name} 
              onChange={e => setBoardForm({...boardForm, name: e.target.value})} 
            />
            <p className="mt-3 text-[10px] text-slate-400 font-medium leading-relaxed">
              This board will follow the default <span className="text-slate-900 font-bold">Monochrome Protocol</span>.
            </p>
          </div>
          <div className="pt-2">
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
              {editingBoard ? 'Apply Changes' : 'Initialize Board'}
              <ChevronRight size={16} />
            </button>
          </div>
        </form>
      </Modal>

      {/* Updated Delete Protocol Modal */}
      <Modal 
        isOpen={deleteConfirm.show} 
        onClose={() => setDeleteConfirm({ show: false, boardId: null, boardName: '' })} 
        title="Delete Protocol"
      >
        <div className="text-center py-2">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
            <Trash2 size={28} className="text-slate-900" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Permanently Remove Board?</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-[260px] mx-auto leading-relaxed">
            This will erase <span className="text-slate-900 font-bold">"{deleteConfirm.boardName}"</span> and all associated data.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={onConfirmDeleteBoard}
              className="w-full px-4 py-4 bg-slate-900 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group"
            >
              Confirm Deletion
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => setDeleteConfirm({ show: false, boardId: null, boardName: '' })}
              className="w-full px-4 py-3 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}