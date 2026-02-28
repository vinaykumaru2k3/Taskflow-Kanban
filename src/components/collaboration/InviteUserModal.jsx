import React, { useState } from 'react';
import { X, Mail, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { ROLES, getRoleLabel } from '../../lib/permissions';

const InviteUserModal = ({ isOpen, onClose, onInvite, boardName }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES.EDITOR);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsInviting(true);
    setError('');

    try {
      await onInvite(email.trim(), role);
      setSuccess(true);
      setEmail('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Mail size={20} className="text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Invite Collaborator</h3>
              <p className="text-xs text-slate-400">{boardName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Invitation Sent!</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your colleague will receive an email invitation.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-slate-300 dark:border-slate-600 outline-none transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: ROLES.VIEWER, label: 'Viewer', desc: 'View only' },
                    { value: ROLES.EDITOR, label: 'Editor', desc: 'Create & edit' },
                    { value: ROLES.ADMIN, label: 'Admin', desc: 'Manage team' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        role === option.value
                          ? 'border-slate-900 bg-slate-50 dark:bg-slate-800'
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{option.label}</p>
                      <p className="text-[10px] text-slate-400">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <AlertCircle size={16} className="text-rose-500" />
                  <p className="text-xs font-bold text-rose-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isInviting}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isInviting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Send Invitation
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;
