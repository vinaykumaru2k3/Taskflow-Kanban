import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ChevronRight, Layers, Archive, X, Tag, Eye } from 'lucide-react';

// [perf] Lazy-load heavy page-level components so the main Kanban view loads immediately.
const Landing       = lazy(() => import('./Landing'));
const CalendarView  = lazy(() => import('./CalendarView'));
const WorkflowTree  = lazy(() => import('./WorkflowTree'));
const Documentation = lazy(() => import('./Documentation'));
const PrivacyPolicy = lazy(() => import('./PrivacyPolicy'));
const Support       = lazy(() => import('./Support'));

// Critical path imports
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import TaskModal from './components/modals/TaskModal';
import BoardModal from './components/modals/BoardModal';
import DeleteBoardModal from './components/modals/DeleteBoardModal';
import ArchivedTasksModal from './components/ArchivedTasksModal';
import TeamPanel from './components/collaboration/TeamPanel';
import NotificationPanel from './components/notifications/NotificationPanel';
import CommentSection from './components/comments/CommentSection';
import MobileNav from './components/MobileNav';

import { PRIORITIES, TAG_COLORS, DEFAULT_TAGS, ROLES } from './utils/constants';
import { canCreateTasks, canEditTask } from './lib/permissions';
import { useAuth } from './hooks/useAuth';
import { useBoards } from './hooks/useBoards';
import { useTasks } from './hooks/useTasks';
import { useCollaboration } from './hooks/useCollaboration';
import { useNotifications } from './hooks/useNotifications';
import { useComments } from './hooks/useComments';
import { useTheme } from './hooks/useTheme';
import { hasDependencyCycle } from './utils/dependencyValidation';
import Toast from './components/Toast';

// [perf] Generic debounce hook to throttle expensive handlers (search, resize)
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// [perf] Lightweight spinner shown while lazy chunks load
const LazyFallback = () => (
  <div className="flex-1 flex items-center justify-center min-h-[200px]">
    <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-slate-100 rounded-full animate-spin" />
  </div>
);

// Default filter/sort state
const defaultFilters = {
  priority: 'all', // 'all', 'urgent', 'high', 'medium', 'low'
  status: 'all', // 'all', 'todo', 'in-progress', 'review', 'done'
  sortBy: 'createdAt', // 'createdAt', 'dueDate', 'priority'
  sortOrder: 'desc', // 'asc', 'desc'
  tag: 'all', // 'all' or tag id
};

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    window.showToast = (message, type = 'error') => {
      addToast(message, type);
    };
    return () => {
      delete window.showToast;
    };
  }, [addToast]);
  const { boards, currentBoard, setCurrentBoard, createBoard, updateBoard, deleteBoard } = useBoards(user);
  const { theme, toggleTheme } = useTheme();


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
    deleteNotification,
    notifyMention,
    notifyAssignment
  } = useNotifications(user);

  const { tasks, createTask, updateTask, deleteTask, archiveTask, restoreTask } = useTasks(user, currentBoard, notifyAssignment);

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
  const canAssign = userRole === ROLES.OWNER || userRole === ROLES.ADMIN;

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const isSavingRef = useRef(false); // double-submit guard for handleSaveTask

  const [showStats, setShowStats] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [showFilters, setShowFilters] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customTagColor, setCustomTagColor] = useState('blue');

  // [perf] Debounce search so we don't filter on every keystroke (saves re-renders)
  const debouncedSearch = useDebounce(searchQuery, 200);

  // [safari/mobile] Lock body scroll when any modal is open.
  // position: fixed + top prevents rubber-band scrolling of background content on iOS.
  const anyModalOpen = isModalOpen || showBoardModal || showArchived || showTeamPanel;
  useEffect(() => {
    if (anyModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [anyModalOpen]);

  // Filter & Sort State (persisted to localStorage)
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('taskflow-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all properties exist
        return { ...defaultFilters, ...parsed };
      } catch (err) {
        console.error('Failed to parse filters from localStorage:', err);
      }
    }
    return defaultFilters;
  });

  // Form States
  const [boardForm, setBoardForm] = useState({ name: '', color: '#1e293b' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, boardId: null, boardName: '' });
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const initialTaskState = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: [], subtasks: [], assigneeId: '', blockedBy: [], blocks: [] };
  const [taskForm, setTaskForm] = useState(initialTaskState);

  // Comments hook
  const {
    comments,
    loading: commentsLoading,
    addComment,
    updateComment,
    deleteComment
  } = useComments(user, currentBoard?.id, editingTask, taskForm?.title, notifyMention, addToast);



  // --- Board Handlers ---

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
      setBoardForm({ name: '', color: '#1e293b' });
    } catch (error) { console.error(error); }
  };

  const confirmDeleteBoard = (board) => {
    setDeleteConfirm({ show: true, boardId: board.id, boardName: board.name });
  };

  const onConfirmDeleteBoard = async () => {
    if (!deleteConfirm.boardId || isDeletingBoard) return;
    setIsDeletingBoard(true);
    try {
      await deleteBoard(deleteConfirm.boardId);
      setDeleteConfirm({ show: false, boardId: null, boardName: '' });
      addToast('Board deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting board:', err);
      addToast('Failed to delete board: ' + err.message, 'error');
    } finally {
      setIsDeletingBoard(false);
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
    if (!canEdit) return; // viewers cannot save
    if (!taskForm.title.trim()) return;
    // Double-submit guard: ignore rapid re-clicks while Firestore write is in-flight
    if (isSavingRef.current) return;
    
    // Check for dependency cycles before saving
    if (hasDependencyCycle(tasks, editingTask, taskForm.blockedBy, taskForm.blocks)) {
      window.showToast("Error: Saving this task would create a circular dependency cycle. Please resolve the cycle before saving.", "error");
      return;
    }

    isSavingRef.current = true;
    try {
      let assigneeData = { assigneeId: null, assigneeName: null, assigneeAvatar: null };
      if (taskForm.assigneeId) {
         if (taskForm.assigneeId === user.uid) {
             assigneeData = { assigneeId: user.uid, assigneeName: user.displayName || user.email, assigneeAvatar: user.photoURL || null };
         } else {
             const member = teamMembers.find(m => m.uid === taskForm.assigneeId);
             if (member) {
                 assigneeData = { assigneeId: member.uid, assigneeName: member.displayName || member.email, assigneeAvatar: member.photoURL || null };
             } else {
                 // Fallback if they were assigned but left the board
                 assigneeData = { assigneeId: taskForm.assigneeId, assigneeName: taskForm.assigneeName, assigneeAvatar: taskForm.assigneeAvatar };
             }
         }
      }

      const finalTask = { ...taskForm, ...assigneeData };
      // Prevent stale task form state from inadvertently wiping out active dynamic properties 
      delete finalTask.commentCount;

      let triggerConfettiNeeded = false;
      if (editingTask) {
        const oldTask = tasks.find(t => t.id === editingTask);
        if (oldTask) {
          // 1. Check if status changed to 'done'
          if (oldTask.status !== 'done' && finalTask.status === 'done') {
            triggerConfettiNeeded = true;
          }
          // 2. Check if subtask list just became fully completed
          const oldSubtasks = oldTask.subtasks || [];
          const newSubtasks = finalTask.subtasks || [];
          const wasFullyCompleted = oldSubtasks.length > 0 && oldSubtasks.every(s => s.completed);
          const isFullyCompleted = newSubtasks.length > 0 && newSubtasks.every(s => s.completed);
          if (!wasFullyCompleted && isFullyCompleted) {
            triggerConfettiNeeded = true;
          }
        }
      } else {
        // 3. Direct creation in 'done' state or with completed checklist
        if (finalTask.status === 'done') {
          triggerConfettiNeeded = true;
        }
        const newSubtasks = finalTask.subtasks || [];
        if (newSubtasks.length > 0 && newSubtasks.every(s => s.completed)) {
          triggerConfettiNeeded = true;
        }
      }

      if (editingTask) {
        const oldTask = tasks.find(t => t.id === editingTask);
        await updateTask(editingTask, finalTask, oldTask);
      } else {
        await createTask(finalTask);
      }
      setIsModalOpen(false);
      setEditingTask(null);
      setTaskForm(initialTaskState);

      if (triggerConfettiNeeded) {
        import('./utils/confetti').then(({ triggerConfetti }) => triggerConfetti());
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to save task. Please try again.', 'error');
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleDragStart = (e, id) => { e.dataTransfer.setData('taskId', id); };

  const handleDrop = async (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId');
    if (!id) return;
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    if (task.blockedBy?.length > 0 && status === 'done') {
      const blockedByTasks = tasks.filter(t => task.blockedBy.includes(t.id) && t.status !== 'done');
      if (blockedByTasks.length > 0) {
        const taskNames = blockedByTasks.map(t => t.title).join(', ');
        // Non-blocking warning toast instead of confirm() — lets the user
        // see the warning without freezing the UI thread.
        addToast(`Warning: "${task.title}" is blocked by incomplete tasks: ${taskNames}. Move anyway or resolve blockers first.`, 'warning');
        return;
      }
    }
    
    const previousStatus = task.status;
    await updateTask(id, { status });

    if (previousStatus !== 'done' && status === 'done') {
      import('./utils/confetti').then(({ triggerConfetti }) => triggerConfetti());
    }
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

  // Centralized effect to reset board if shared board is deleted/uninvited
  useEffect(() => {
    if (!currentBoard || !user) return;
    const isSharedBoard = currentBoard.ownerId && currentBoard.ownerId !== user.uid;
    if (isSharedBoard) {
      const exists = sharedBoards.some(b => b.id === currentBoard.id);
      if (!exists && sharedBoards.length > 0) {
        setCurrentBoard(boards[0] || null);
      }
    }
  }, [sharedBoards, currentBoard, boards, user, setCurrentBoard]);

  // Priority order for sorting
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t =>
      // Exclude archived tasks from main view
      !t.archived &&
      (t.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.description?.toLowerCase().includes(debouncedSearch.toLowerCase()))
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
  }, [tasks, debouncedSearch, filters]);

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
      window.showToast?.('Failed to accept invite: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleNotificationAction = (notification) => {
    if (notification.boardId) {
      // Try to find in sharedBoards first, then own boards
      let foundBoard = sharedBoards.find(b => b.id === notification.boardId) || boards.find(b => b.id === notification.boardId);
      if (foundBoard) {
        if (currentBoard?.id !== foundBoard.id) {
          setCurrentBoard(foundBoard);
        }
        setShowNotifications(false);
        
        if (notification.taskId) {
          // If we are already on the board and tasks are loaded:
          if (currentBoard?.id === foundBoard.id) {
            const task = tasks.find(t => t.id === notification.taskId);
            if (task) {
              setEditingTask(task.id);
              setTaskForm({ ...task });
              setIsModalOpen(true);
            } else {
              setPendingAction({ taskId: notification.taskId, commentId: notification.commentId });
            }
          } else {
            // Need to wait for new board's tasks to load
            setPendingAction({ taskId: notification.taskId, commentId: notification.commentId });
          }
        }
      }
    }
  };

  useEffect(() => {
    if (pendingAction && tasks.length > 0) {
      const task = tasks.find(t => t.id === pendingAction.taskId);
      if (task) {
        setEditingTask(task.id);
        setTaskForm({ ...task });
        setIsModalOpen(true);
        // pendingAction is kept for CommentSection to scroll, it clears itself or we can clear it on modal close
      }
    }
  }, [tasks, pendingAction]);

  const stats = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.archived);
    const total = activeTasks.length;
    const completed = activeTasks.filter(t => t.status === 'done').length;
    const urgent = activeTasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
    const overdue = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    return { total, completed, urgent, overdue };
  }, [tasks]);

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col items-center gap-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black tracking-[0.3em] text-[10px] uppercase text-slate-400">Syncing</p>
      </div>
    </div>
  );

  if (!user) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
          <div className="w-10 h-10 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
        </div>
      }>
        <Landing onGoogleSignIn={signInWithGoogle} onEmailSignIn={signInWithEmail} isLoading={false} />
      </Suspense>
    );
  }

  return (
    // [safari/mobile] Use 100dvh (dynamic viewport height) so the app fills the screen even when
    // the browser chrome (address bar/tab bar) is visible. Falls back to 100vh for older browsers.
    <div
      className="flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif", height: '100dvh', minHeight: '100vh' }}
    >
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
        canCreate={canCreate}
        stats={stats}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        setFilters={setFilters}
        archivedCount={archivedTasks.length}
        setShowArchived={setShowArchived}
        allTags={allTags}
        onShowTeam={() => setShowTeamPanel(true)}
        teamMemberCount={teamMembers.length}
        onShowNotifications={() => setShowNotifications(true)}
        unreadNotificationsCount={unreadCount}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Area - Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* [mobile] Backdrop overlay — tapping it closes the sidebar on small screens */}
        {showSidebar && (
          <div
            className="md:hidden fixed inset-0 z-10 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar 
          showSidebar={showSidebar}
          boards={boards}
          sharedBoards={sharedBoards}
          currentBoard={currentBoard}
          setCurrentBoard={(b) => { 
            setCurrentBoard(b); 
            if (window.innerWidth < 768) {
              setShowSidebar(false); 
            }
          }}
          onAddBoard={() => { setEditingBoard(null); setBoardForm({ name: '', color: '#1e293b' }); setShowBoardModal(true); }}
          onEditBoard={openEditBoard}
          onDeleteBoard={confirmDeleteBoard}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-slate-50/30 dark:bg-[#09090b]">

          <div className="flex-1 flex flex-col min-h-0 relative z-10">
            {/* [mobile] Add bottom padding so content isn't hidden behind the MobileNav */}
            <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8 overflow-y-auto custom-scrollbar">
              <div className="max-w-7xl mx-auto h-full flex flex-col">
                {!currentBoard ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                      <Layers size={32} className="text-blue-500 dark:text-blue-400 border-2 border-transparent" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">Welcome to TaskFlow</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm leading-relaxed text-sm">
                      To get started with tracking and prioritizing your tasks, you'll need to create your first board.
                    </p>
                    <button
                      id="btn-init-first-board"
                      onClick={() => { setEditingBoard(null); setBoardForm({ name: '', color: '#1e293b' }); setShowBoardModal(true); }}
                      className="px-8 py-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl transition-all shadow-xl shadow-slate-200 dark:shadow-none hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                    >
                      <Plus size={18} strokeWidth={3} />
                      Initialize First Board
                    </button>
                  </div>
                ) : viewMode === 'calendar' ? (
                  <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <Suspense fallback={<LazyFallback />}>
                      <CalendarView tasks={filteredTasks} onTaskClick={handleOpenEditTask} />
                    </Suspense>
                  </div>
                ) : viewMode === 'workflow' ? (
                  <Suspense fallback={<LazyFallback />}>
                    <WorkflowTree tasks={filteredTasks} />
                  </Suspense>
                ) : viewMode === 'docs' ? (
                  <Suspense fallback={<LazyFallback />}>
                    <Documentation onBack={() => setViewMode('kanban')} />
                  </Suspense>
                ) : viewMode === 'privacy' ? (
                  <Suspense fallback={<LazyFallback />}>
                    <PrivacyPolicy onBack={() => setViewMode('kanban')} />
                  </Suspense>
                ) : viewMode === 'support' ? (
                  <Suspense fallback={<LazyFallback />}>
                    <Support onBack={() => setViewMode('kanban')} />
                  </Suspense>
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

            {/* Premium SaaS Footer */}
            <footer className="px-6 py-4 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-transparent backdrop-blur-md flex-shrink-0 z-20 transition-colors">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-default">
                <Layers size={14} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">TaskFlow © 2026</p>
              </div>
              
              <div className="hidden md:flex items-center gap-6 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <a href="#" onClick={e => { e.preventDefault(); setViewMode('docs'); }} className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Documentation</a>
                <a href="#" onClick={e => { e.preventDefault(); setViewMode('privacy'); }} className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Privacy Policy</a>
                <a href="#" onClick={e => { e.preventDefault(); setViewMode('support'); }} className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Support</a>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-600 dark:text-slate-400">System Normal</span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ─────────────────────────────────── */}
      <MobileNav
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNewTask={handleOpenCreateTask}
        canCreate={canCreate}
        onToggleSidebar={() => setShowSidebar((s) => !s)}
        currentBoard={currentBoard}
      />

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); setPendingAction(null); }}
        editingTask={editingTask}
        canEdit={canEdit}
        canAssign={canAssign}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        handleSaveTask={handleSaveTask}
        user={user}
        teamMembers={teamMembers}
        filteredTasks={filteredTasks}
        customTagInput={customTagInput}
        setCustomTagInput={setCustomTagInput}
        customTagColor={customTagColor}
        setCustomTagColor={setCustomTagColor}
        handleCreateCustomTag={handleCreateCustomTag}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
        handleAddSubtask={handleAddSubtask}
        toggleSubtask={toggleSubtask}
        removeSubtask={removeSubtask}
        comments={comments}
        addComment={async (text, mentions) => {
          const res = await addComment(text, mentions);
          if (res?.success) {
            const currentTask = tasks.find(t => t.id === editingTask);
            if (currentTask) {
              await updateTask(editingTask, { commentCount: (currentTask.commentCount || 0) + 1 });
            }
          }
          return res;
        }}
        deleteComment={async (commentId) => {
          const res = await deleteComment(commentId);
          if (res?.success) {
            const currentTask = tasks.find(t => t.id === editingTask);
            if (currentTask) {
              await updateTask(editingTask, { commentCount: Math.max(0, (currentTask.commentCount || 0) - 1) });
            }
          }
          return res;
        }}
        updateComment={updateComment}
        userRole={userRole}
        pendingAction={pendingAction}
        setPendingAction={setPendingAction}
      />

      <BoardModal
        isOpen={showBoardModal}
        onClose={() => { setShowBoardModal(false); setEditingBoard(null); setBoardForm({ name: '', color: '#1e293b' }); }}
        editingBoard={editingBoard}
        boardForm={boardForm}
        setBoardForm={setBoardForm}
        onSaveBoard={onSaveBoard}
      />

      <DeleteBoardModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, boardId: null, boardName: '' })}
        boardName={deleteConfirm.boardName}
        onConfirm={onConfirmDeleteBoard}
        isLoading={isDeletingBoard}
      />

      {/* Archived Tasks Modal */}
      <ArchivedTasksModal 
        isOpen={showArchived}
        onClose={() => setShowArchived(false)}
        tasks={archivedTasks}
        onRestore={restoreTask}
        onDelete={deleteTask}
      />

      <TeamPanel
        isOpen={showTeamPanel}
        onClose={() => setShowTeamPanel(false)}
        board={currentBoard}
        teamMembers={teamMembers}
        currentUser={user}
        userRole={userRole}
        onInvite={(email, role) => shareBoard(currentBoard?.id, email, role)}
        onRemove={(uid, strategy) => removeCollaborator(currentBoard?.id, uid, strategy)}
        onUpdateRole={(uid, newRole) => updateCollaboratorRole(currentBoard?.id, uid, newRole)}
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

      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>

    </div>
  );
}
