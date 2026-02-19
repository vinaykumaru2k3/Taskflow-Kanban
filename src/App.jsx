import React, { useState, useMemo } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
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
  const [boardForm, setBoardForm] = useState({ name: '', color: '#3B82F6' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, boardId: null, boardName: '' });
  const initialTaskState = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: [], subtasks: [] };
  const [taskForm, setTaskForm] = useState(initialTaskState);

  // --- Handlers ---

  // Board Handlers
  const onSaveBoard = async (e) => {
    e.preventDefault();
    if (!boardForm.name.trim()) return;
    try {
      if (editingBoard) {
        await updateBoard(editingBoard, { name: boardForm.name, color: boardForm.color });
        setEditingBoard(null);
      } else {
        await createBoard({ name: boardForm.name, color: boardForm.color });
      }
      setShowBoardModal(false);
      setBoardForm({ name: '', color: '#3B82F6' });
    } catch (error) {
       // Error handled in hook usually, or add toast here
    }
  };

  const confirmDeleteBoard = (board) => {
    setDeleteConfirm({ show: true, boardId: board.id, boardName: board.name });
  };

  const onConfirmDeleteBoard = async () => {
    if (deleteConfirm.boardId) {
      await deleteBoard(deleteConfirm.boardId);
      setDeleteConfirm({ show: false, boardId: null, boardName: '' });
      if (currentBoard?.id === deleteConfirm.boardId) {
        // Logic handled in useBoards effect primarily, but good to be safe
      }
    }
  };

  const openEditBoard = (board) => {
    setEditingBoard(board.id);
    setBoardForm({ name: board.name, color: board.color });
    setShowBoardModal(true);
  };

  // Task Handlers
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskForm(initialTaskState);
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task.id);
    setTaskForm({ ...task });
    setIsModalOpen(true);
  };

  const handleAddTaskToColumn = (status) => {
    setTaskForm(prev => ({ ...prev, status }));
    setIsModalOpen(true);
  }

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    if (!currentBoard) {
      alert('Please create a board first');
      return;
    }

    try {
      if (editingTask) {
        await updateTask(editingTask, taskForm);
      } else {
        await createTask(taskForm);
      }
      setIsModalOpen(false);
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

  // Subtask Handlers
  const handleAddSubtask = () => {
    setTaskForm(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), { id: Date.now(), text: '', completed: false }] }));
  };

  const toggleSubtask = (id) => {
    setTaskForm(prev => ({ ...prev, subtasks: prev.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s) }));
  };

  const removeSubtask = (id) => {
    setTaskForm(prev => ({ ...prev, subtasks: prev.subtasks.filter(s => s.id !== id) }));
  };

  // Derived State
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

  // Render
  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="w-16 h-16 border-8 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
        <p className="font-black tracking-widest text-xs uppercase animate-pulse text-slate-400">Loading...</p>
      </div>
    </div>
  );

  if (!user) {
    return <Landing onGoogleSignIn={signInWithGoogle} onEmailSignIn={signInWithEmail} isLoading={false} />;
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900 overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar 
        showSidebar={showSidebar}
        boards={boards}
        currentBoard={currentBoard}
        setCurrentBoard={setCurrentBoard}
        onAddBoard={() => { setEditingBoard(null); setBoardForm({ name: '', color: '#3B82F6' }); setShowBoardModal(true); }}
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

        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          <main className="flex-1 p-4 md:p-6 lg:p-8 min-h-0">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {viewMode === 'calendar' ? (
                <div className="flex-1 min-h-0">
                  <CalendarView
                    tasks={filteredTasks}
                    onTaskClick={handleOpenEditTask}
                  />
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


          <footer className="px-4 md:px-6 lg:px-8 py-4 text-center border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-auto">
            <p className="text-[10px] text-slate-400 font-bold">TaskFlow © 2025 </p>
          </footer>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? "Update Objective" : "New Entry"}>
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
              <input required className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500/20 outline-none transition-all" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
              <select className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500/20 outline-none transition-all cursor-pointer" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                {Object.keys(PRIORITIES).map(p => (<option key={p} value={p}>{PRIORITIES[p].label}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
            <textarea className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-medium text-slate-600 focus:bg-white focus:border-blue-500/20 outline-none transition-all min-h-[80px] resize-none" placeholder="Add details..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deadline</label>
            <input type="date" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500/20 outline-none transition-all" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checklist</label>
              <button type="button" onClick={handleAddSubtask} className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
              {taskForm.subtasks?.map((sub, idx) => (
                <div key={sub.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group/sub">
                  <button type="button" onClick={() => toggleSubtask(sub.id)} className={`transition-colors ${sub.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {sub.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>
                  <input className={`flex-1 bg-transparent border-none text-xs font-semibold outline-none ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700'}`} value={sub.text} placeholder="Item..." onChange={(e) => { const updated = [...taskForm.subtasks]; updated[idx].text = e.target.value; setTaskForm({...taskForm, subtasks: updated}); }} />
                  <button type="button" onClick={() => removeSubtask(sub.id)} className="opacity-0 group-hover/sub:opacity-100 text-slate-400 hover:text-rose-500">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
            {editingTask ? 'Update Task' : 'Create Task'}
            <ChevronRight size={16} />
          </button>
        </form>
      </Modal>

      {/* Board Modal */}
      <Modal isOpen={showBoardModal} onClose={() => { setShowBoardModal(false); setEditingBoard(null); setBoardForm({ name: '', color: '#3B82F6' }); }} title={editingBoard ? 'Edit Board' : 'New Board'}>
        <form onSubmit={onSaveBoard} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Board Name</label>
            <input required className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500/20 outline-none transition-all" placeholder="My Project" value={boardForm.name} onChange={e => setBoardForm({...boardForm, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" className="w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer" value={boardForm.color} onChange={e => setBoardForm({...boardForm, color: e.target.value})} />
              <div className="flex gap-2">
                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'].map(color => (
                  <button key={color} type="button" onClick={() => setBoardForm({...boardForm, color})} className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${boardForm.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
            {editingBoard ? 'Update Board' : 'Create Board'}
            <ChevronRight size={16} />
          </button>
        </form>
      </Modal>

      {/* Delete Board Confirmation Modal */}
      <Modal isOpen={deleteConfirm.show} onClose={() => setDeleteConfirm({ show: false, boardId: null, boardName: '' })} title="Delete Board">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
            <Trash2 size={32} className="text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Delete "{deleteConfirm.boardName}"?</h3>
          <p className="text-sm text-slate-500 mb-6">
            This will permanently delete the board and all its tasks. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setDeleteConfirm({ show: false, boardId: null, boardName: '' })}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirmDeleteBoard}
              className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/30"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
