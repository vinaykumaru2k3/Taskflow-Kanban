import React, { useRef, useEffect } from 'react';
import { Bell, X, Check, UserPlus, AtSign, CheckSquare, MessageSquare } from 'lucide-react';
import NotificationItem from './NotificationItem';

const NotificationPanel = ({ 
  isOpen, 
  onClose, 
  notifications, 
  unreadCount = 0,
  onMarkAsRead, 
  onMarkAllAsRead,
  onDelete,
  onAction,
  onAccept,
  onReject
}) => {
  const panelRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'invite':
        return <UserPlus size={16} />;
      case 'mention':
        return <AtSign size={16} />;
      case 'assignment':
        return <CheckSquare size={16} />;
      case 'comment':
        return <MessageSquare size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  if (!isOpen) return null;

  return (
    /* Fixed position so it always appears near the top-right regardless of where it's rendered in the DOM */
    <div 
      ref={panelRef}
      className="fixed top-16 right-4 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-600" />
          <span className="text-sm font-bold text-slate-800">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
              title="Mark all as read"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={32} strokeWidth={1} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-400">No notifications yet</p>
            <p className="text-[10px] text-slate-300 mt-1">
              You'll see invites and mentions here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                icon={getNotificationIcon(notification.type)}
                onMarkAsRead={() => onMarkAsRead(notification.id)}
                onDelete={() => onDelete(notification.id)}
                onAction={onAction}
                onAccept={onAccept}
                onReject={onReject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-center text-xs text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
