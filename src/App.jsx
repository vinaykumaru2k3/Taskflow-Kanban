import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, query, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Plus, Trash2, X, Search, CheckSquare, Calendar, AlertCircle, BarChart3, ChevronRight, CheckCircle2, Circle, LogOut, User, Layers } from 'lucide-react';
import Landing from './Landing';

const firebaseConfig = {
  apiKey: "AIzaSyC5JJIcfKd8c0AbtzpVrtRRF_I3FmhXUcc",
  authDomain: "taskflow-app-f6474.firebaseapp.com",
  projectId: "taskflow-app-f6474",
  storageBucket: "taskflow-app-f6474.firebasestorage.app",
  messagingSenderId: "10228174207",
  appId: "1:10228174207:web:9f095a4e2146df0d8b1e4a",
  measurementId: "G-752KK8JZXB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

const PRIORITIES = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-rose-100 text-rose-600', dot: 'bg-rose-600' },
};

const TaskCard = ({ task, onDelete, onEdit, onDragStart }) => {
  const priority = PRIORITIES[task.priority] || PRIORITIES.low;
  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const progress = subtasksCount > 0 ? (completedSubtasks / subtasksCount) * 100 : 0;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onEdit(task)}
      className="group relative bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${priority.dot}`} />
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5 ${priority.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </span>
          {isOverdue && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 flex items-center gap-1">
              <AlertCircle size={10} /> Overdue
            </span>
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all">
          <Trash2 size={14} />
        </button>
      </div>
      <h4 className="text-sm font-bold text-slate-800 mb-1.5 line-clamp-2 leading-snug">{task.title}</h4>
      {task.description && <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-normal">{task.description}</p>}
      {subtasksCount > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <CheckSquare size={10} /> {completedSubtasks}/{subtasksCount} Tasks
            </span>
            <span className="text-[10px] font-bold text-slate-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <div className="flex items-center pt-3 border-t border-slate-50 mt-auto">
        <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
          <Calendar size={11} />
          <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[70vh] overflow-hidden flex flex-col animate-in zoom-in duration-300 border border-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const initialTaskState = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: [], subtasks: [] };
  const [taskForm, setTaskForm] = useState(initialTaskState);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setTasks(items);
    });
    return () => unsubscribe();
  }, [user]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTaskForm(initialTaskState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task.id);
    setTaskForm({ ...task });
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      if (editingTask) {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', editingTask), { ...taskForm, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'users', user.uid, 'tasks'), { ...taskForm, createdAt: serverTimestamp() });
      }
      setIsModalOpen(false);
      setTaskForm(initialTaskState);
    } catch (err) { console.error("Error saving task:", err); }
  };

  const handleDeleteTask = async (id) => {
    try { await deleteDoc(doc(db, 'users', user.uid, 'tasks', id)); }
    catch (err) { console.error("Error deleting task:", err); }
  };

  const handleDragStart = (e, id) => { e.dataTransfer.setData('taskId', id); };

  const handleDrop = async (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId');
    if (!id) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', id), { status });
    } catch (err) { console.error("Error updating status:", err); }
  };

  const handleAddSubtask = () => {
    setTaskForm(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), { id: Date.now(), text: '', completed: false }] }));
  };

  const toggleSubtask = (id) => {
    setTaskForm(prev => ({ ...prev, subtasks: prev.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s) }));
  };

  const removeSubtask = (id) => {
    setTaskForm(prev => ({ ...prev, subtasks: prev.subtasks.filter(s => s.id !== id) }));
  };

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

  // Show loading while Firebase checks auth state
  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="w-16 h-16 border-8 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
        <p className="font-black tracking-widest text-xs uppercase animate-pulse text-slate-400">Loading...</p>
      </div>
    </div>
  );

  // Show landing page when not authenticated
  if (!user) {
    return (
      <Landing
        onGoogleSignIn={handleGoogleSignIn}
        isLoading={false}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <header className="bg-gradient-to-r from-white to-blue-50/30 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 lg:px-8 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/Taskflow logo.png" alt="TaskFlow" className="h-12 w-auto" />
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Live</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border-2 border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                    <User size={16} />
                  </div>
                )}
                <span className="text-xs font-bold text-slate-600 hidden md:block">{user?.displayName || 'User'}</span>
                <button onClick={handleSignOut} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all" title="Sign out">
                  <LogOut size={16} />
                </button>
              </div>
              <button onClick={() => setShowStats(!showStats)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${showStats ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <BarChart3 size={16} /> Stats
              </button>
              <div className="relative flex-1 lg:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-300 transition-all w-full lg:w-48 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30 active:scale-95">
                <Plus size={18} /> New
              </button>
            </div>
          </div>
          {showStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {[
                { label: 'Total', val: stats.total, bg: 'bg-blue-50', text: 'text-blue-600' },
                { label: 'Done', val: stats.completed, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                { label: 'Urgent', val: stats.urgent, bg: 'bg-orange-50', text: 'text-orange-600' },
                { label: 'Overdue', val: stats.overdue, bg: 'bg-rose-50', text: 'text-rose-600' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} p-3 rounded-xl border border-slate-100`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${s.text}`}>{s.label}</p>
                    {i === 0 && <Layers size={14} className={s.text} />}
                    {i === 1 && <CheckCircle2 size={14} className={s.text} />}
                    {i === 2 && <AlertCircle size={14} className={s.text} />}
                    {i === 3 && <Calendar size={14} className={s.text} />}
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{s.val}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex flex-col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, col.id)}>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{col.title}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">{filteredTasks.filter(t => t.status === col.id).length}</span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {filteredTasks.filter(t => t.status === col.id).map(task => (
                    <TaskCard key={task.id} task={task} onDelete={handleDeleteTask} onEdit={handleOpenEdit} onDragStart={handleDragStart} />
                  ))}
                  <button onClick={() => { setTaskForm(prev => ({ ...prev, status: col.id })); setIsModalOpen(true); }} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all group/btn">
                    <Plus size={16} className="group-hover/btn:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Add Task</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
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
      <footer className="px-4 md:px-6 lg:px-8 py-4 text-center border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <p className="text-[10px] text-slate-400 font-bold">TaskFlow © 2025 </p>
      </footer>
    </div>
  );
}
