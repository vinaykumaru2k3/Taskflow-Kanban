import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ChevronRight, Layers, Archive, X, Tag } from 'lucide-react';
import Landing from './Landing';
import CalendarView from './CalendarView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import Modal from './components/Modal';
import ArchivedTasksModal from './components/ArchivedTasksModal';
import ShareBoardModal from './components/collaboration/ShareBoardModal';
import TeamPanel from './components/collaboration/TeamPanel';
import NotificationPanel from './components/notifications/NotificationPanel';
import { PRIORITIES, TAG_COLORS, DEFAULT_TAGS, ROLES } from './utils/constants';
import { canCreateTasks, canEditTask } from './lib/permissions';
import { useAuth } from './hooks/useAuth';
import { useBoards } from './hooks/useBoards';
import { useTasks } from './hooks/useTasks';
import { useCollaboration } from './hooks/useCollaboration';
import { useNotifications } from './hooks/useNotifications';

// Default filter/sort state
const defaultFilters = {
  priority: 'all', // 'all', 'urgent', 'high', 'medium', 'low'
  status: 'all', // 'all', 'todo', 'in-progress', 'review', 'done'
  sortBy: 'createdAt', // 'createdAt', 'dueDate', 'priority'
  sortOrder: 'desc', // 'asc', 'desc'
  tag: 'all', // 'all' or tag id
};

export default function App() {
  // Custom Hooks
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const { boards, currentBoard, setCurrentBoard, createBoard, updateBoard, deleteBoard } = useBoards(user);
  const { tasks, createTask, updateTask, deleteTask, archiveTask, restoreTask } = useTasks(user, currentBoard);
  
  // Collaboration hooks
  const { 
    collaborators,
    teamMembers,
    sharedBoards, 
    shareBoard,
    acceptInvite,
    rejectInvite,
    removeCollaborator, 
    updateCollaboratorRole,
    getUserRoleForBoard,
    isBoardOwner 
  } = useCollaboration(user, currentBoard);

  // Notifications hook
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications(user);

  // Derive the current user's role for the selected board
  // — OWNER for own boards, the shared role for shared boards, null if no board
  const userRole = useMemo(() => {
    if (!user || !currentBoard) return null;
    // If it's a shared board, the role is stored in the board object itself
    if (currentBoard.ownerId && currentBoard.ownerId !== user.uid) {
      return currentBoard.role || ROLES.VIEWER;
    }
    // Own board → OWNER
    return ROLES.OWNER;
  }, [user, currentBoard]);

  const canCreate = canCreateTasks(userRole);
  const canEdit   = userRole === ROLES.OWNER || userRole === ROLES.ADMIN || userRole === ROLES.EDITOR;

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [showFilters, setShowFilters] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customTagColor, setCustomTagColor] = useState('blue');

  // Filter & Sort State (persisted to localStorage)
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('taskflow-filters');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure all properties exist
      return { ...defaultFilters, ...parsed };
    }
    return defaultFilters;
  });

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

  // --- Tag Handlers ---

  const handleAddTag = (tag) => {
    // Check if tag already exists
    if (taskForm.tags?.some(t => t.id === tag.id)) return;
    setTaskForm(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
  };

  const handleRemoveTag = (tagId) => {
    setTaskForm(prev => ({ ...prev, tags: prev.tags?.filter(t => t.id !== tagId) || [] }));
  };

  const handleCreateCustomTag = () => {
    if (!customTagInput.trim()) return;
    const newTag = {
      id: `custom-${Date.now()}`,
      label: customTagInput.trim(),
      colorId: customTagColor
    };
    setTaskForm(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
    setCustomTagInput('');
    setCustomTagColor('blue');
  };

  // --- Memoized Data ---

  // Persist filters to localStorage
  useEffect(() => {
    localStorage.setItem('taskflow-filters', JSON.stringify(filters));
  }, [filters]);

  // Priority order for sorting
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => 
      // Exclude archived tasks from main view
      !t.archived &&
      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Filter by priority
    if (filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority);
    }

    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }

    // Filter by tag
    if (filters.tag !== 'all') {
      result = result.filter(t => t.tags?.some(tag => tag.id === filters.tag));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      if (filters.sortBy === 'priority') {
        comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
      } else if (filters.sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB;
      } else {
        // createdAt - default
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        comparison = timeA - timeB;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [tasks, searchQuery, filters]);

  // Archived tasks
  const archivedTasks = useMemo(() => {
    return tasks.filter(t => t.archived);
  }, [tasks]);

  // Collect all unique tags from tasks
  const allTags = useMemo(() => {
    const tagMap = new Map();
    tasks.forEach(task => {
      task.tags?.forEach(tag => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });
    // Also include default tags
    DEFAULT_TAGS.forEach(tag => {
      if (!tagMap.has(tag.id)) {
        tagMap.set(tag.id, tag);
      }
    });
    return Array.from(tagMap.values());
  }, [tasks]);

  // Handle accepting an invite — grant access then navigate to that board
  const handleAcceptInvite = async (notification) => {
    try {
      await acceptInvite(notification);
      // The sharedBoards listener will update, but we can navigate immediately
      // Build a minimal shared board object from the notification data
      const sharedBoardObj = {
        id: notification.boardId,
        boardName: notification.boardName,
        boardColor: notification.boardColor,
        ownerId: notification.fromUserId,
        ownerName: notification.fromUserName,
        ownerEmail: notification.fromUserEmail,
        role: notification.role
      };
      setCurrentBoard(sharedBoardObj);
      setShowNotifications(false);
    } catch (err) {
      console.error('Failed to accept invite:', err);
      alert('Failed to accept invite: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle clicking on a notification — e.g., navigate to shared board on invite
  const handleNotificationAction = (notification) => {
    if (notification.boardId) {
      // Try to find in sharedBoards first, then own boards
      const sharedBoard = sharedBoards.find(b => b.id === notification.boardId);
      if (sharedBoard) {
        setCurrentBoard(sharedBoard);
        setShowNotifications(false);
        return;
      }
      const ownBoard = boards.find(b => b.id === notification.boardId);
      if (ownBoard) {
        setCurrentBoard(ownBoard);
        setShowNotifications(false);
      }
    }
  };

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
    <div className="h-screen flex flex-col bg-white text-slate-900 overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header - Full Width */}
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
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        setFilters={setFilters}
        archivedCount={archivedTasks.length}
        setShowArchived={setShowArchived}
        allTags={allTags}
        onShareBoard={() => setShowShareModal(true)}
        onShowTeam={() => setShowTeamPanel(true)}
        teamMemberCount={teamMembers.length}
        onShowNotifications={() => setShowNotifications(true)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Main Area - Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          showSidebar={showSidebar}
          boards={boards}
          sharedBoards={sharedBoards}
          currentBoard={currentBoard}
          setCurrentBoard={setCurrentBoard}
          onAddBoard={() => { setEditingBoard(null); setBoardForm({ name: '', color: '#1e293b' }); setShowBoardModal(true); }}
          onEditBoard={openEditBoard}
          onDeleteBoard={confirmDeleteBoard}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
                    onDragStart={canEdit ? handleDragStart : () => {}}
                    onDrop={canEdit ? handleDrop : () => {}}
                    onEditTask={handleOpenEditTask}
                    onDeleteTask={canEdit ? deleteTask : null}
                    onAddTask={canCreate ? handleAddTaskToColumn : null}
                    onArchiveTask={canEdit ? archiveTask : null}
                    readOnly={!canEdit}
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
          
          {/* Tags Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} /> Labels
              </label>
            </div>
            
            {/* Selected Tags */}
            {taskForm.tags && taskForm.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {taskForm.tags.map((tag, idx) => {
                  const color = TAG_COLORS.find(c => c.id === tag.colorId) || TAG_COLORS[0];
                  return (
                    <span 
                      key={idx} 
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${color.bg} ${color.text} ${color.border}`}
                    >
                      {tag.label}
                      <button 
                        type="button"
                        onClick={() => handleRemoveTag(tag.id)}
                        className="hover:opacity-70"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            
            {/* Tag Selector */}
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_TAGS.map((tag) => {
                const color = TAG_COLORS.find(c => c.id === tag.colorId) || TAG_COLORS[0];
                const isSelected = taskForm.tags?.some(t => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => isSelected ? handleRemoveTag(tag.id) : handleAddTag(tag)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-all ${
                      isSelected 
                        ? `${color.bg} ${color.text} ${color.border} ring-2 ring-offset-1 ring-slate-400` 
                        : `bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300`
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
            
            {/* Custom Tag Creator */}
            <div className="border-t border-slate-100 pt-3 mt-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Create Custom Label</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Label name..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-slate-400 outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCustomTag())}
                />
                <div className="flex gap-1">
                  {TAG_COLORS.slice(0, 5).map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setCustomTagColor(color.id)}
                      className={`w-6 h-6 rounded-md ${color.bg} border-2 transition-all ${
                        customTagColor === color.id ? color.border : 'border-transparent'
                      }`}
                      title={color.id}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleCreateCustomTag}
                  disabled={!customTagInput.trim()}
                  className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
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

      {/* Archived Tasks Modal */}
      <ArchivedTasksModal 
        isOpen={showArchived}
        onClose={() => setShowArchived(false)}
        tasks={archivedTasks}
        onRestore={restoreTask}
        onDelete={deleteTask}
      />

      {/* Team Panel */}
      <TeamPanel
        isOpen={showTeamPanel}
        onClose={() => setShowTeamPanel(false)}
        board={currentBoard}
        teamMembers={teamMembers}
        currentUser={user}
        userRole={userRole}
        onInvite={(email, role) => shareBoard(currentBoard?.id, email, role)}
        onRemove={(uid) => removeCollaborator(currentBoard?.id, uid)}
        onUpdateRole={(uid, newRole) => updateCollaboratorRole(currentBoard?.id, uid, newRole)}
      />

      {/* Share Board Modal */}
      <ShareBoardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        board={currentBoard}
        collaborators={collaborators}
        shareBoard={shareBoard}
        removeCollaborator={removeCollaborator}
        updateCollaboratorRole={updateCollaboratorRole}
        user={user}
      />

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
        onAction={handleNotificationAction}
        onAccept={handleAcceptInvite}
        onReject={rejectInvite}
      />
    </div>
  );
}
