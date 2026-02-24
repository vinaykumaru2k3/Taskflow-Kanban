import React from 'react';
import { X, ArrowRight } from 'lucide-react';

const NotificationItem = ({ notification, icon, onMarkAsRead, onDelete, onAction }) => {
  const { type, title, message, data, read, createdAt } = notification;

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

  const handleClick = () => {
    if (!read) {
      onMarkAsRead();
    }
    if (onAction) {
      onAction(notification);
    }
  };

  return (
    <div 
      className={`relative group p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
        !read ? 'bg-blue-50/50' : ''
      }`}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!read && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          type === 'invitation' ? 'bg-purple-100 text-purple-600' :
          type === 'mention' ? 'bg-blue-100 text-blue-600' :
          type === 'assignment' ? 'bg-green-100 text-green-600' :
          'bg-slate-100 text-slate-600'
        }`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{message}</p>
          <p className="text-[10px] text-slate-400 mt-1">
            {formatTime(createdAt)}
          </p>
        </div>

        {/* Action indicator */}
        {data?.boardId && (
          <div className="flex-shrink-0 self-center">
            <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all"
      >
        <X size={12} />
      </button>
    </div>
  );
};

export default NotificationItem;
