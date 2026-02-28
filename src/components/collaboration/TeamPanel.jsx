import React, { useState } from 'react';
import { X, Crown, Trash2, UserPlus, Mail, ChevronDown, Users, Shield, Pencil, Eye, Loader2, Copy, Check } from 'lucide-react';
import { ROLES } from '../../utils/constants';

const ROLE_CONFIG = {
  [ROLES.OWNER]:  { label: 'Owner',  icon: Crown,   cls: 'bg-slate-900 text-white' },
  [ROLES.ADMIN]:  { label: 'Admin',  icon: Shield,  cls: 'bg-slate-700 text-white' },
  [ROLES.EDITOR]: { label: 'Editor', icon: Pencil,  cls: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
  [ROLES.VIEWER]: { label: 'Viewer', icon: Eye,     cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' },
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
        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
      />
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0 border border-slate-200 dark:border-slate-700"
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Users size={18} className="text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-0.5">
                Board Team
              </p>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate max-w-[220px]">
                {boardName}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full">
              {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Invite Form (owner / admin only) ── */}
        {canManage && (
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Invite by Email
            </p>
            <form onSubmit={handleInvite} className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold placeholder-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors shadow-sm"
                />
              </div>
              <div className="relative group">
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors cursor-pointer shadow-sm group-hover:bg-slate-50 dark:group-hover:bg-slate-800"
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
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {sending ? '' : 'Invite'}
              </button>
            </form>
            {sendMsg && (
              <p className={`mt-2 text-[11px] font-semibold ${sendMsg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>
                {sendMsg.text}
              </p>
            )}

            {/* Copy Link Snippet */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Or share via link</span>
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                title="Copy Board Link"
              >
                {showCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {showCopied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        )}

        {/* ── Member List ── */}
        <div className="overflow-y-auto max-h-[55vh]">
          {teamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Users size={36} strokeWidth={1.5} className="mb-3" />
              <p className="text-sm font-bold text-slate-400">No members yet</p>
              {canManage && (
                <p className="text-xs text-slate-300 mt-1">Use the form above to invite someone</p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-50 px-2 py-2">
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isYou ? 'bg-slate-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/70'
                    }`}
                  >
                    {/* Avatar */}
                    <Avatar member={member} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {member.displayName || 'Unknown'}
                        </span>
                        {isYou && (
                          <span className="text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                    </div>

                    {/* Role: inline dropdown for owner/admin on changeable rows, badge otherwise */}
                    {canChangeRole ? (
                      <div className="relative flex-shrink-0">
                        {updating ? (
                          <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black ${rc.cls}`}>
                            <Loader2 size={10} className="animate-spin" />
                            {rc.label}
                          </div>
                        ) : (
                          <>
                            <select
                              value={member.role}
                              onChange={e => handleRoleChange(member, e.target.value)}
                              className={`appearance-none pl-2.5 pr-6 py-1.5 rounded-lg text-[10px] font-black cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition-all ${rc.cls}`}
                              title="Change role"
                            >
                              {INVITABLE_ROLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                          </>
                        )}
                      </div>
                    ) : (
                      <span className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black flex-shrink-0 ${rc.cls}`}>
                        <RI size={10} />
                        {rc.label}
                      </span>
                    )}

                    {/* Remove */}
                    {canRemove && (
                      <button
                        onClick={() => handleRemove(member)}
                        disabled={removing}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 flex-shrink-0"
                        title={`Remove ${member.displayName}`}
                      >
                        {removing
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamPanel;
