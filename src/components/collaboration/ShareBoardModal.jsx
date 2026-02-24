import React, { useState, useMemo } from 'react';
import { X, UserPlus, Mail, Shield, Check, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { ROLES, getRoleLabel, getRoleColor } from '../../lib/permissions';

const ShareBoardModal = ({ 
  isOpen, 
  onClose, 
  board, 
  user,
  collaborators = [],
  shareBoard,
  removeCollaborator,
  updateCollaboratorRole
}) => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLES.EDITOR);
  const [isSharing, setIsSharing] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Determine the current user's role/ownership from the collaborators array
  const currentUserCollab = useMemo(() => {
    return collaborators.find(c => c.uid === user?.uid);
  }, [collaborators, user]);

  const isOwner = currentUserCollab?.role === ROLES.OWNER;
  const canShare = isOwner || currentUserCollab?.role === ROLES.ADMIN;

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsSharing(true);
    setError('');
    setSuccess('');

    try {
      await shareBoard(board.id, email.trim(), selectedRole);
      setSuccess('Invitation sent successfully!');
      setEmail('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveCollaborator = async (collaborator) => {
    if (!confirm(`Remove ${collaborator.displayName || collaborator.email} from this board?`)) return;
    
    try {
      await removeCollaborator(board.id, collaborator.uid);
    } catch (err) {
      setError(err.message || 'Failed to remove collaborator');
    }
  };

  const handleRoleChange = async (collaborator, newRole) => {
    try {
      await updateCollaboratorRole(board.id, collaborator.uid, newRole);
    } catch (err) {
      setError(err.message || 'Failed to update role');
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/board/${board?.id}`;
    navigator.clipboard.writeText(link).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const el = document.createElement('textarea');
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in duration-300 border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <UserPlus size={20} className="text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Share Board</h3>
              <p className="text-xs text-slate-400">{board?.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Share Form — only shown if user can share */}
          {canShare && (
            <div className="mb-6">
              <form onSubmit={handleShare}>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Invite by Email
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="email"
                      placeholder="colleague@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-lg text-sm font-semibold text-slate-800 focus:bg-white focus:border-slate-300 outline-none transition-all"
                    />
                  </div>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 border-2 border-transparent rounded-lg text-sm font-semibold text-slate-800 focus:border-slate-300 outline-none transition-all cursor-pointer"
                  >
                    <option value={ROLES.VIEWER}>{getRoleLabel(ROLES.VIEWER)}</option>
                    <option value={ROLES.EDITOR}>{getRoleLabel(ROLES.EDITOR)}</option>
                    <option value={ROLES.ADMIN}>{getRoleLabel(ROLES.ADMIN)}</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isSharing}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSharing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Invite
                      </>
                    )}
                  </button>
                </div>
                
                {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
                {success && (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {success}
                  </p>
                )}
              </form>

              {/* Copy Link */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Or share via link</span>
                  <button
                    onClick={copyInviteLink}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {showCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {showCopied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collaborators List */}
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              People with Access
            </h4>
            
            {collaborators.length === 0 ? (
              <div className="text-center py-8 opacity-40">
                <Shield size={32} strokeWidth={1} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold">Only you have access</p>
                <p className="text-[10px] text-slate-400">Invite team members to collaborate</p>
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div 
                    key={collab.uid}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      {collab.photoURL ? (
                        <img 
                          src={collab.photoURL} 
                          alt={collab.displayName}
                          className="w-9 h-9 rounded-full border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                          {collab.displayName?.charAt(0) || collab.email?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          {collab.displayName || 'Unknown User'}
                          {collab.uid === user?.uid && (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">You</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">{collab.email || ''}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Only allow role changes for non-owner collaborators if current user can share */}
                      {canShare && collab.role !== ROLES.OWNER && collab.uid !== user?.uid ? (
                        <select
                          value={collab.role}
                          onChange={(e) => handleRoleChange(collab, e.target.value)}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md border cursor-pointer ${getRoleColor(collab.role)}`}
                        >
                          <option value={ROLES.VIEWER}>Viewer</option>
                          <option value={ROLES.EDITOR}>Editor</option>
                          <option value={ROLES.ADMIN}>Admin</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md border ${getRoleColor(collab.role)}`}>
                          {getRoleLabel(collab.role)}
                        </span>
                      )}
                      
                      {/* Remove button: only for non-owner collaborators, by users who can share */}
                      {canShare && collab.role !== ROLES.OWNER && collab.uid !== user?.uid && (
                        <button
                          onClick={() => handleRemoveCollaborator(collab)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                          title="Remove collaborator"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareBoardModal;
