import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Trash2, Edit2, Check, X } from 'lucide-react';

const CommentSection = ({ 
  comments, 
  currentUser, 
  onAddComment, 
  onDeleteComment, 
  onUpdateComment,
  canComment = true,
  collaborators = [],
  scrollToCommentId,
  onScrollComplete
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const commentRefs = useRef({});

  const onScrollCompleteRef = useRef(onScrollComplete);
  useEffect(() => {
    onScrollCompleteRef.current = onScrollComplete;
  });

  useEffect(() => {
    if (scrollToCommentId && commentRefs.current[scrollToCommentId]) {
      commentRefs.current[scrollToCommentId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (onScrollCompleteRef.current) {
        setTimeout(() => onScrollCompleteRef.current?.(), 1000);
      }
    }
  }, [scrollToCommentId, comments]);

  const filteredCollaborators = collaborators.filter(c => 
    c.displayName?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const mentions = [];
      collaborators.forEach(c => {
        const name = c.displayName || c.email;
        if (newComment.includes(`@${name}`)) {
          mentions.push(c.uid);
        }
      });
      
      await onAddComment(newComment, mentions);
      // [fix] Clear unconditionally — previous code checked res?.success which
      // would NOT clear when the hook returned undefined (no explicit return).
      setNewComment('');
      setShowMentions(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  useEffect(() => {
    setActiveMentionIndex(0);
  }, [mentionSearch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent modal's outer form from submitting
      handleSubmit(e);
      return;
    }
    if (e.key === '@') {
      // [fix] Only open mention popup at a word boundary (start of input or after whitespace)
      const before = newComment.slice(0, e.target.selectionStart);
      if (before.length === 0 || /\s$/.test(before)) {
        setShowMentions(true);
        setMentionSearch('');
      }
    }
    if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const handleMentionSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveMentionIndex(prev => (prev + 1) % filteredCollaborators.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveMentionIndex(prev => (prev - 1 + filteredCollaborators.length) % filteredCollaborators.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedUser = filteredCollaborators[activeMentionIndex];
      if (selectedUser) {
        insertMention(selectedUser);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowMentions(false);
      document.getElementById('input-new-comment')?.focus();
    }
  };

  const insertMention = (user) => {
    const lastAtIndex = newComment.lastIndexOf('@');
    const newText = newComment.slice(0, lastAtIndex) + `@${user.displayName || user.email} `;
    setNewComment(newText);
    setShowMentions(false);
    setMentionSearch('');
    document.getElementById('input-new-comment')?.focus();
  };

  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const [isSavingEdit, setIsSavingEdit] = useState(false); // [fix] double-submit guard for saveEdit

  const saveEdit = async (commentId) => {
    if (!editText.trim() || isSavingEdit) return;
    
    setIsSavingEdit(true);
    try {
      const mentions = [];
      collaborators.forEach(c => {
        const name = c.displayName || c.email;
        if (editText.includes(`@${name}`)) {
          mentions.push(c.uid);
        }
      });
      
      const res = await onUpdateComment(commentId, editText, mentions);
      if (res?.success) {
        cancelEditing();
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const renderCommentContent = (content) => {
    if (!content) return null;
    
    // Sort collaborators by name length descending to match longest names first (e.g. "Jane Doe" before "Jane")
    const allNames = [];
    collaborators.forEach(c => {
      if (c.displayName) allNames.push(c.displayName);
      if (c.email) allNames.push(c.email);
    });
    const names = Array.from(new Set(allNames))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    // Build a dynamic regex to match known names (including those with spaces) 
    // or fallback to matching a single word (for former members).
    const namePattern = names.length > 0
      ? names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
      : '(?!)'; // Match nothing if no names
    
    // Priority 1: One of the known names (case insensitive)
    // Priority 2: A single word until space/punctuation for "former members"
    const mentionPattern = new RegExp(`@(${namePattern}|[a-zA-Z0-9._%+-]+)`, 'gi');
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionPattern.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      
      const mentionedName = match[1];
      // Check if it's one of the current names, a first name, or an email handle
      const isActiveMember = collaborators.some(c => {
        const dName = (c.displayName || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const mention = mentionedName.toLowerCase().trim();
        
        return dName === mention || 
               email === mention || 
               dName.split(' ')[0] === mention || 
               email.split('@')[0] === mention;
      });
      
      parts.push({ 
        type: 'mention', 
        content: `@${mentionedName}`,
        isActive: isActiveMember
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return parts.map((part, i) => {
      if (part.type === 'mention') {
        return (
          <span 
            key={i} 
            className={`font-bold px-1 rounded inline-block ${
              part.isActive 
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 line-through'
            }`}
            title={part.isActive ? '' : 'Former member'}
          >
            {part.content}
          </span>
        );
      }
      return <span key={i}>{part.content}</span>;
    });
  };

  const formatTime = (date) => {
    if (!date) return 'Just now';
    const now = new Date();
    let commentDate;
    try {
      commentDate = date.toDate ? date.toDate() : new Date(date);
      if (isNaN(commentDate.getTime())) {
        return 'Just now';
      }
    } catch {
      return 'Just now';
    }
    const diff = now - commentDate;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (isNaN(minutes) || minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return commentDate.toLocaleDateString();
  };

  return (
    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={14} className="text-slate-400" />
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Comments ({comments.length})
        </label>
      </div>

      {/* Comments List */}
      <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
        {comments.map((comment) => (
          <div 
            key={comment.id} 
            ref={el => commentRefs.current[comment.id] = el}
            className={`flex gap-3 group ${scrollToCommentId === comment.id ? 'bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded-lg' : ''}`}
          >
            {/* Avatar */}
            {comment.authorAvatar ? (
              <img 
                src={comment.authorAvatar} 
                alt={comment.authorName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs">
                {comment.authorName?.charAt(0) || '?'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {comment.authorName || 'Unknown'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatTime(comment.createdAt)}
                </span>
                
                {/* Edit/Delete buttons */}
                {currentUser?.uid === comment.authorId && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`btn-edit-comment-${comment.id}`}
                      onClick={() => startEditing(comment)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:text-slate-300"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      id={`btn-delete-comment-${comment.id}`}
                      onClick={() => onDeleteComment(comment.id)}
                      className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Comment Text */}
              {editingId === comment.id ? (
                <div className="flex items-center gap-2">
                  <input
                    id={`input-edit-comment-${comment.id}`}
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                    autoFocus
                  />
                  <button
                    id={`btn-save-comment-edit-${comment.id}`}
                    onClick={() => saveEdit(comment.id)}
                    className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    id={`btn-cancel-comment-edit-${comment.id}`}
                    onClick={cancelEditing}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:bg-slate-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {renderCommentContent(comment.content)}
                </p>
              )}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-6 opacity-40">
            <MessageSquare size={24} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-400">No comments yet</p>
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      {canComment ? (
        <div className="relative">
          <div className="flex gap-2">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs">
                {currentUser?.displayName?.charAt(0) || '?'}
              </div>
            )}
            
            <div className="flex-1 relative">
              <input
                id="input-new-comment"
                type="text"
                value={newComment}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewComment(val);
                  // [fix] Keep mentionSearch in sync with typed text after @
                  // so the dropdown filters without needing a separate search input focus.
                  if (showMentions) {
                    const lastAt = val.lastIndexOf('@');
                    if (lastAt !== -1) {
                      setMentionSearch(val.slice(lastAt + 1));
                    } else {
                      setShowMentions(false);
                    }
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment... (@mention to notify)"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-slate-400 transition-colors"
              />
              
              {/* Mention dropdown */}
              {showMentions && filteredCollaborators.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <input
                      id="input-mention-search"
                      type="text"
                      placeholder="Search..."
                      value={mentionSearch}
                      onChange={(e) => setMentionSearch(e.target.value)}
                      onKeyDown={handleMentionSearchKeyDown}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded text-xs focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {filteredCollaborators.map((user, index) => (
                      <button
                        id={`btn-mention-user-${user.uid}`}
                        key={user.uid}
                        type="button"
                        onClick={() => insertMention(user)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                          index === activeMentionIndex 
                            ? 'bg-slate-100 dark:bg-slate-800' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
                        )}
                        <span className="text-sm text-slate-700 dark:text-slate-300">{user.displayName || user.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              id="btn-submit-comment"
              type="button"
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-2">
          You don't have permission to comment
        </p>
      )}
    </div>
  );
};

export default CommentSection;
