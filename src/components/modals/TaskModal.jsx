import React from 'react';
import { Eye, Tag, X, Plus, Trash2, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import Modal from '../Modal';
import CommentSection from '../comments/CommentSection';
import MultiSelect from '../MultiSelect';
import { PRIORITIES, TAG_COLORS, DEFAULT_TAGS } from '../../utils/constants';

const TaskModal = ({
  isOpen,
  onClose,
  editingTask,
  canEdit,
  canAssign,
  taskForm,
  setTaskForm,
  handleSaveTask,
  user,
  teamMembers = [],
  filteredTasks = [],
  customTagInput,
  setCustomTagInput,
  customTagColor,
  setCustomTagColor,
  handleCreateCustomTag,
  handleAddTag,
  handleRemoveTag,
  handleAddSubtask,
  toggleSubtask,
  removeSubtask,
  comments = [],
  addComment,
  deleteComment,
  updateComment,
  userRole,
  pendingAction,
  setPendingAction
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => { onClose(); }} 
      title={editingTask ? (canEdit ? 'Update Entry' : 'View Entry') : 'New Entry'}
    >
      <form onSubmit={handleSaveTask} className="space-y-5">
        {/* Read-only notice for viewers */}
        {!canEdit && (
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <Eye size={14} className="text-slate-400 flex-shrink-0" />
            <p className="text-xs font-bold text-slate-400">
              You have <span className="text-slate-600 dark:text-slate-300">Viewer</span> access — this board is read-only.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="input-task-title" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
            <input 
              id="input-task-title" 
              required 
              disabled={!canEdit} 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900/10 dark:focus:border-slate-600 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
              placeholder="Task title" 
              value={taskForm.title || ''} 
              onChange={e => setTaskForm({...taskForm, title: e.target.value})} 
            />
          </div>
          <div>
            <label htmlFor="select-task-priority" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
            <select 
              id="select-task-priority" 
              disabled={!canEdit} 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-slate-900/10 dark:focus:border-slate-600 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" 
              value={taskForm.priority || 'medium'} 
              onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
            >
              {Object.keys(PRIORITIES).map(p => (
                <option key={p} value={p}>{PRIORITIES[p].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="select-task-assignee" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assignee</label>
            <select 
              id="select-task-assignee" 
              disabled={!canAssign} 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-slate-900/10 dark:focus:border-slate-600 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" 
              value={taskForm.assigneeId || ''} 
              onChange={e => setTaskForm({...taskForm, assigneeId: e.target.value})}
            >
              <option value="">Unassigned</option>
              <option value={user?.uid}>{user?.displayName || user?.email} (You)</option>
              {teamMembers.filter(m => m.uid !== user?.uid).map(m => (
                <option key={m.uid} value={m.uid}>{m.displayName || m.email}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="textarea-task-desc" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
          <textarea 
            id="textarea-task-desc" 
            disabled={!canEdit} 
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900/10 dark:focus:border-slate-600 outline-none transition-all min-h-[100px] resize-none disabled:opacity-60 disabled:cursor-not-allowed" 
            placeholder="Contextual details..." 
            value={taskForm.description || ''} 
            onChange={e => setTaskForm({...taskForm, description: e.target.value})} 
          />
        </div>

        <div>
          <label htmlFor="input-task-deadline" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deadline</label>
          <input 
            id="input-task-deadline" 
            type="date" 
            disabled={!canEdit} 
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-slate-900/10 dark:focus:border-slate-600 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
            value={taskForm.dueDate || ''} 
            onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} 
          />
        </div>
        
        {/* Dependencies Section */}
        {canEdit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Blocked By</label>
              <MultiSelect
                options={filteredTasks.filter(t => t.id !== editingTask)}
                selectedValues={taskForm.blockedBy || []}
                onChange={newValue => setTaskForm({...taskForm, blockedBy: newValue})}
                placeholder="Select task dependencies..."
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Blocks</label>
              <MultiSelect
                options={filteredTasks.filter(t => t.id !== editingTask)}
                selectedValues={taskForm.blocks || []}
                onChange={newValue => setTaskForm({...taskForm, blocks: newValue})}
                placeholder="Select tasks blocked by this..."
                disabled={!canEdit}
              />
            </div>
          </div>
        )}
        
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
              {taskForm.tags.map((tag) => {
                const color = TAG_COLORS.find(c => c.id === tag.colorId) || TAG_COLORS[0];
                return (
                  <span 
                    key={tag.id || tag.label} 
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${color.bg} ${color.text} ${color.border}`}
                  >
                    {tag.label}
                    <button 
                      id={`btn-remove-tag-${tag.id}`}
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
          
          {/* Tag Selector — hidden for viewers */}
          {canEdit && (
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_TAGS.map((tag) => {
                const color = TAG_COLORS.find(c => c.id === tag.colorId) || TAG_COLORS[0];
                const isSelected = taskForm.tags?.some(t => t.id === tag.id);
                return (
                  <button
                    id={`btn-toggle-tag-${tag.id}`}
                    key={tag.id}
                    type="button"
                    onClick={() => isSelected ? handleRemoveTag(tag.id) : handleAddTag(tag)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-all ${
                      isSelected 
                        ? `${color.bg} ${color.text} ${color.border} ring-2 ring-offset-1 ring-slate-400` 
                        : `bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600`
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Custom Tag Creator — hidden for viewers */}
          {canEdit && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Create Custom Label</p>
              <div className="flex gap-2">
                <input
                  id="input-custom-tag-name"
                  type="text"
                  placeholder="Label name..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-slate-400 outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCustomTag())}
                />
                <div className="flex gap-1">
                  {TAG_COLORS.slice(0, 5).map((color) => (
                    <button
                      id={`btn-custom-tag-color-${color.id}`}
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
                  id="btn-create-custom-tag"
                  type="button"
                  onClick={handleCreateCustomTag}
                  disabled={!customTagInput.trim()}
                  className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checklist</label>
            {canEdit && (
              <button 
                id="btn-add-subtask" 
                type="button" 
                onClick={handleAddSubtask} 
                className="text-[10px] font-black text-slate-900 dark:text-slate-100 hover:opacity-70 flex items-center gap-1"
              >
                <Plus size={12} /> Add Item
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
            {taskForm.subtasks?.map((sub, idx) => (
              <div key={sub.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group/sub border border-transparent hover:border-slate-200 dark:border-slate-700 transition-all">
                <button 
                  id={`btn-toggle-subtask-${sub.id}`} 
                  type="button" 
                  disabled={!canEdit} 
                  onClick={() => canEdit && toggleSubtask(sub.id)} 
                  className={`transition-colors ${sub.completed ? 'text-slate-900 dark:text-slate-100' : 'text-slate-300'} ${!canEdit ? 'cursor-default' : ''}`}
                >
                  {sub.completed ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <Circle size={18} strokeWidth={2.5} />}
                </button>
                <input 
                  id={`input-subtask-${sub.id}`} 
                  disabled={!canEdit} 
                  className={`flex-1 bg-transparent border-none text-xs font-bold outline-none disabled:cursor-not-allowed ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`} 
                  value={sub.text || ''} 
                  placeholder="Item description..." 
                  onChange={(e) => { 
                    const updated = taskForm.subtasks.map((s, i) => i === idx ? { ...s, text: e.target.value } : s); 
                    setTaskForm({...taskForm, subtasks: updated}); 
                  }} 
                />
                {canEdit && (
                  <button 
                    id={`btn-remove-subtask-${sub.id}`} 
                    type="button" 
                    onClick={() => removeSubtask(sub.id)} 
                    className="opacity-0 group-hover/sub:opacity-100 text-slate-400 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {editingTask && (
          <CommentSection 
            comments={comments}
            currentUser={user}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onUpdateComment={updateComment}
            collaborators={teamMembers || []}
            canComment={!!userRole} 
            scrollToCommentId={pendingAction?.commentId}
            onScrollComplete={() => setPendingAction(null)}
          />
        )}

        {canEdit ? (
          <button 
            id="btn-submit-task" 
            type="submit" 
            className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {editingTask ? 'Update Entry' : 'Create Entry'}
            <ChevronRight size={16} />
          </button>
        ) : (
          <button 
            id="btn-close-task-modal" 
            type="button" 
            onClick={() => { onClose(); setPendingAction(null); }} 
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Close
          </button>
        )}
      </form>
    </Modal>
  );
};

export default TaskModal;
