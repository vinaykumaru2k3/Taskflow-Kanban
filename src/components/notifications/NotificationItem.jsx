import React, { useState } from 'react';
import { X, ArrowRight, Check, X as XIcon, UserPlus } from 'lucide-react';

const NotificationItem = ({ notification, icon, onMarkAsRead, onDelete, onAction, onAccept, onReject }) => {
  const { type, title, message, boardId, boardName, fromUserName, role, read, status, createdAt } = notification;
  const [isActing, setIsActing] = useState(false);

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const notifDate = date.toDate ? date.toDate() : new Date(date);
    const diff = now - notifDate;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return notifDate.toLocaleDateString();
  };

  const handleAccept = async (e) => {
    e.stopPropagation();
    if (isActing) return;
    setIsActing(true);
    try {
      await onAccept(notification);
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async (e) => {
    e.stopPropagation();
    if (isActing) return;
    setIsActing(true);
    try {
      await onReject(notification.id);
    } finally {
      setIsActing(false);
    }
  };

  const handleClick = () => {
    if (!read) onMarkAsRead();
    // Only navigate if invite is accepted (or it's a non-invite notification)
    if (type !== 'invite' || status === 'accepted') {
      if (onAction) onAction(notification);
    }
  };

  const isPendingInvite = type === 'invite' && status === 'pending';
  const isAccepted = type === 'invite' && status === 'accepted';
  const isRejected = type === 'invite' && status === 'rejected';

  return (
    <div 
      className={`relative group px-4 py-3.5 transition-colors ${
        !read ? 'bg-blue-50/60' : 'bg-white dark:bg-slate-900'
      } ${!isPendingInvite ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800' : ''}`}
      onClick={!isPendingInvite ? handleClick : undefined}
    >
      {/* Unread indicator dot */}
      {!read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          type === 'invite'
            ? isAccepted
              ? 'bg-emerald-100 text-emerald-600'
              : isRejected
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              : 'bg-purple-100 text-purple-600'
            : type === 'mention' ? 'bg-blue-100 text-blue-600'
            : type === 'assignment' ? 'bg-green-100 text-green-600'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
        }`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{message}</p>
          <p className="text-[10px] text-slate-400 mt-1">{formatTime(createdAt)}</p>

          {/* ── Accept / Reject buttons for pending invites ── */}
          {isPendingInvite && (
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={handleAccept}
                disabled={isActing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isActing ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                Accept
              </button>
              <button
                onClick={handleReject}
                disabled={isActing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-bold rounded-lg transition-all border border-slate-200 dark:border-slate-700 hover:border-rose-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <XIcon size={12} />
                Decline
              </button>
              <span className="text-[10px] text-slate-400 capitalize">
                as {role || 'editor'}
              </span>
            </div>
          )}

          {/* Status badge for resolved invites */}
          {isAccepted && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <Check size={10} /> Joined
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              Declined
            </span>
          )}
        </div>

        {/* Navigate arrow — only for accepted invites / non-invites */}
        {!isPendingInvite && boardId && (
          <div className="flex-shrink-0 self-center">
            <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 dark:text-slate-400 transition-colors" />
          </div>
        )}
      </div>

      {/* Delete button (X in top-right) */}
      {!isPendingInvite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-all"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default NotificationItem;
