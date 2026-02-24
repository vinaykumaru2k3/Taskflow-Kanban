import React, { useState } from 'react';
import { MessageSquare, Send, AtSign, Trash2, Edit2, Check, X } from 'lucide-react';

const CommentSection = ({ 
  comments, 
  currentUser, 
  onAddComment, 
  onDeleteComment, 
  onUpdateComment,
  canComment = true,
  collaborators = []
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  const filteredCollaborators = collaborators.filter(c => 
    c.displayName?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Parse mentions from text
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        mentions.push(match[1]);
      }
      
      await onAddComment(newComment, mentions);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === '@') {
      setShowMentions(true);
      setMentionSearch('');
    }
    if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const insertMention = (user) => {
    const lastAtIndex = newComment.lastIndexOf('@');
    const newText = newComment.slice(0, lastAtIndex) + `@${user.displayName || user.email} `;
    setNewComment(newText);
    setShowMentions(false);
    setMentionSearch('');
  };

  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (commentId) => {
    if (!editText.trim()) return;
    
    try {
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(editText)) !== null) {
        mentions.push(match[1]);
      }
      
      await onUpdateComment(commentId, editText, mentions);
      cancelEditing();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const commentDate = date.toDate ? date.toDate() : new Date(date);
    const diff = now - commentDate;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return commentDate.toLocaleDateString();
  };

  return (
    <div className="border-t border-slate-100 pt-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={14} className="text-slate-400" />
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Comments ({comments.length})
        </label>
      </div>

      {/* Comments List */}
      <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            {/* Avatar */}
            {comment.userPhotoURL ? (
              <img 
                src={comment.userPhotoURL} 
                alt={comment.userName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold text-xs">
                {comment.userName?.charAt(0) || '?'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-800">
                  {comment.userName || 'Unknown'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatTime(comment.createdAt)}
                </span>
                
                {/* Edit/Delete buttons */}
                {currentUser?.uid === comment.userId && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(comment)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
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
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                    autoFocus
                  />
                  <button
                    onClick={() => saveEdit(comment.id)}
                    className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {comment.text}
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
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex gap-2">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold text-xs">
                {currentUser?.displayName?.charAt(0) || '?'}
              </div>
            )}
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment... (@mention to notify)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 transition-colors"
              />
              
              {/* Mention dropdown */}
              {showMentions && filteredCollaborators.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={mentionSearch}
                      onChange={(e) => setMentionSearch(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 rounded text-xs focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {filteredCollaborators.map((user) => (
                      <button
                        key={user.uid}
                        type="button"
                        onClick={() => insertMention(user)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                      >
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200" />
                        )}
                        <span className="text-sm text-slate-700">{user.displayName || user.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-slate-400 text-center py-2">
          You don't have permission to comment
        </p>
      )}
    </div>
  );
};

export default CommentSection;
