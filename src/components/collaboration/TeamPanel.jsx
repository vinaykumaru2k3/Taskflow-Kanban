import React, { useState } from 'react';
import { X, Crown, Trash2, UserPlus, Mail, ChevronDown, Users, Shield, Pencil, Eye, Loader2, Copy, Check } from 'lucide-react';
import { ROLES } from '../../utils/constants';

const ROLE_CONFIG = {
  [ROLES.OWNER]:  { label: 'Owner',  icon: Crown,   cls: 'text-slate-900 dark:text-slate-100' },
  [ROLES.ADMIN]:  { label: 'Admin',  icon: Shield,  cls: 'text-slate-700 dark:text-slate-300' },
  [ROLES.EDITOR]: { label: 'Editor', icon: Pencil,  cls: 'text-slate-500 dark:text-slate-400' },
  [ROLES.VIEWER]: { label: 'Viewer', icon: Eye,     cls: 'text-slate-400 dark:text-slate-500' },
};

const INVITABLE_ROLES = [
  { value: ROLES.ADMIN,  label: 'Admin'  },
  { value: ROLES.EDITOR, label: 'Editor' },
  { value: ROLES.VIEWER, label: 'Viewer' },
];

/* ── Avatar ─────────────────────────────────────── */
const Avatar = ({ member }) => {
  const initial = (member.displayName || member.email || '?').charAt(0).toUpperCase();
  const hue = (member.uid || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  if (member.photoURL) {
    return (
      <img
        src={member.photoURL}
        alt={member.displayName}
        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-black flex-shrink-0"
      style={{ backgroundColor: `hsl(${hue},40%,40%)` }}
    >
      {initial}
    </div>
  );
};

/* ── TeamPanel ───────────────────────────────────── */
const TeamPanel = ({
  isOpen,
  onClose,
  board,
  teamMembers = [],
  currentUser,
  userRole,
  onInvite,
  onRemove,
  onUpdateRole,
}) => {
  const [email, setEmail]           = useState('');
  const [inviteRole, setInviteRole] = useState(ROLES.EDITOR);
  const [sending, setSending]       = useState(false);
  const [sendMsg, setSendMsg]       = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [showCopied, setShowCopied] = useState(false);

  if (!isOpen) return null;

  const boardName = board?.name || board?.boardName || 'This Board';
  const canManage = userRole === ROLES.OWNER || userRole === ROLES.ADMIN;

  /* ── Invite ── */
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim() || !onInvite) return;
    setSending(true);
    setSendMsg(null);
    try {
      const result = await onInvite(email.trim(), inviteRole);
      setSendMsg({ ok: true, text: result?.message || 'Invitation sent!' });
      setEmail('');
    } catch (err) {
      setSendMsg({ ok: false, text: err.message || 'Failed to send invitation.' });
    } finally {
      setSending(false);
    }
  };

  /* ── Remove ── */
  const handleRemove = async (member) => {
    if (!onRemove) return;
    setRemovingId(member.uid);
    try {
      await onRemove(member.uid);
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  };

  /* ── Role change ── */
  const handleRoleChange = async (member, newRole) => {
    if (!onUpdateRole || newRole === member.role) return;
    setUpdatingId(member.uid);
    try {
      await onUpdateRole(member.uid, newRole);
    } catch (err) {
      console.error('Role update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Copy Link ── */
  const copyInviteLink = () => {
    const link = `${window.location.origin}/board/${board?.id}`;
    navigator.clipboard.writeText(link).catch(() => {
      // Fallback
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              <Users size={14} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">
                Team Access
              </p>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate max-w-[200px]">
                {boardName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Invite Form (owner / admin only) ── */}
        {canManage && (
          <div className="px-6 pb-5 border-b border-slate-100 dark:border-slate-800/50">
            <form onSubmit={handleInvite} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Invite via email..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-xs font-semibold placeholder-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-300 dark:focus:border-slate-600 transition-colors"
                />
              </div>
              <div className="relative group">
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-slate-300 dark:focus:border-slate-600 transition-colors cursor-pointer"
                >
                  {INVITABLE_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="flex items-center justify-center w-8 h-8 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                {sending ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
              </button>
            </form>
            {sendMsg && (
              <p className={`mt-2 text-[10px] font-bold ${sendMsg.ok ? 'text-emerald-500' : 'text-rose-500'}`}>
                {sendMsg.text}
              </p>
            )}

            {/* Copy Link Snippet */}
            <div className="mt-3 pt-3 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Share Link</span>
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                title="Copy Board Link"
              >
                {showCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {showCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* ── Member List ── */}
        <div className="overflow-y-auto max-h-[50vh] p-2">
          {teamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-40">
              <Users size={24} strokeWidth={2} className="mb-2 text-slate-400" />
              <p className="text-xs font-bold text-slate-500">No members</p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {teamMembers.map((member) => {
                const rc         = ROLE_CONFIG[member.role] || ROLE_CONFIG[ROLES.VIEWER];
                const RI         = rc.icon;
                const isYou      = member.uid === currentUser?.uid;
                const isOwnerRow = member.role === ROLES.OWNER;
                const removing   = removingId === member.uid;
                const updating   = updatingId === member.uid;

                // Can we change this member's role?
                const canChangeRole = canManage && !isOwnerRow && !isYou;
                // Can we remove this member?
                const canRemove     = canManage && !isOwnerRow && !isYou;

                return (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/member relative"
                  >
                    {/* Avatar */}
                    <Avatar member={member} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {member.displayName || 'Unknown'}
                        </span>
                        {isYou && (
                          <span className="text-[8px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                    </div>

                    {/* Actions Container */}
                    <div className="flex flex-col items-end justify-center">
                      <div className={`transition-opacity duration-200 ${canChangeRole ? 'group-hover/member:opacity-0 group-hover/member:pointer-events-none absolute right-4 top-1/2 -translate-y-1/2' : ''}`}>
                        <span className={`flex items-center gap-1 text-[9px] uppercase tracking-widest font-black ${rc.cls}`}>
                          {rc.label}
                        </span>
                      </div>

                      {/* Hover Actions (Role edit & delete) */}
                      {(canChangeRole || canRemove) && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/member:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 bg-slate-50 dark:bg-slate-800/90 pl-2 rounded-l-md">
                          {canChangeRole && (
                            <div className="relative">
                              {updating ? (
                                <div className={`flex items-center px-1 text-[9px] font-bold ${rc.cls}`}>
                                  <Loader2 size={10} className="animate-spin" />
                                </div>
                              ) : (
                                <>
                                  <select
                                    value={member.role}
                                    onChange={e => handleRoleChange(member, e.target.value)}
                                    className={`appearance-none pl-2 pr-4 py-1 text-[9px] uppercase tracking-widest font-black cursor-pointer bg-slate-100 dark:bg-slate-800 rounded-md outline-none transition-all ${rc.cls}`}
                                    title="Change role"
                                  >
                                    {INVITABLE_ROLES.map(r => (
                                      <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={8} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                </>
                              )}
                            </div>
                          )}

                          {canRemove && (
                            <button
                              onClick={() => handleRemove(member)}
                              disabled={removing}
                              className="p-1.5 text-slate-300 hover:text-rose-500 transition-all disabled:opacity-40"
                              title={`Remove ${member.displayName}`}
                            >
                              {removing
                                ? <Loader2 size={12} className="animate-spin" />
                                : <Trash2 size={12} />
                              }
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamPanel;
