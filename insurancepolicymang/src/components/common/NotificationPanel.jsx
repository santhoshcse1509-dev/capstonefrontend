import { useEffect } from 'react';
import {
  Bell,
  X,
  FileText,
  ShieldCheck,
  CreditCard,
  MessageSquareWarning,
  CheckCheck,
} from 'lucide-react';

/**
 * NotificationPanel — slide-out notification panel from the right.
 *
 * Props:
 *   isOpen        — boolean, whether the panel is visible
 *   onClose       — callback to close the panel
 *   notifications — array of {
 *                     id, type: 'claim'|'policy'|'payment'|'grievance',
 *                     title, message, timestamp, read: bool
 *                   }
 *   onMarkAllRead — optional callback when "Mark all as read" is clicked
 */
export default function NotificationPanel({
  isOpen = false,
  onClose,
  notifications = [],
  onMarkAllRead,
}) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  function relativeTime(timestamp) {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  }

  const typeConfig = {
    claim: {
      border: 'border-l-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/15',
      icon: <FileText className="w-4 h-4 text-rose-500" />,
      dot: 'bg-rose-500',
    },
    policy: {
      border: 'border-l-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/15',
      icon: <ShieldCheck className="w-4 h-4 text-blue-500" />,
      dot: 'bg-blue-500',
    },
    payment: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/15',
      icon: <CreditCard className="w-4 h-4 text-amber-500" />,
      dot: 'bg-amber-500',
    },
    grievance: {
      border: 'border-l-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/15',
      icon: <MessageSquareWarning className="w-4 h-4 text-violet-500" />,
      dot: 'bg-violet-500',
    },
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);
  const hasUnread = unread.length > 0;

  function NotificationItem({ notification }) {
    const cfg = typeConfig[notification.type] || typeConfig.policy;
    return (
      <div
        className={`flex gap-3 p-3 rounded-lg border-l-4 ${cfg.border} ${
          notification.read ? 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800' : cfg.bg + ' border border-slate-100 dark:border-slate-800/50'
        } transition-colors`}
      >
        {/* Icon */}
        <div className="mt-0.5 shrink-0">
          {cfg.icon}
        </div>
 
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold leading-snug ${notification.read ? 'text-slate-650 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
              {notification.title}
            </p>
            {!notification.read && (
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
            {notification.message}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 font-medium">
            {relativeTime(notification.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-sky-50/95 backdrop-blur-md border-l border-sky-200/60 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sky-200/40 bg-sky-100/30 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-black text-indigo-950">Notifications</h2>
            {hasUnread && (
              <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-blue-600 dark:bg-indigo-650 text-white text-[10px] font-bold">
                {unread.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-105 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mark all as read */}
        {hasUnread && (
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 shrink-0">
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-indigo-400 hover:text-blue-800 dark:hover:text-indigo-300 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {notifications.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800">
                <Bell className="w-8 h-8 text-slate-305 dark:text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">All caught up!</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  No notifications at the moment.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Unread section */}
              {unread.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-2 px-1">
                    New
                  </p>
                  <div className="space-y-2">
                    {unread.map((n) => (
                      <NotificationItem key={n.id} notification={n} />
                    ))}
                  </div>
                </div>
              )}

              {/* Read section */}
              {read.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-2 px-1">
                    Earlier
                  </p>
                  <div className="space-y-2">
                    {read.map((n) => (
                      <NotificationItem key={n.id} notification={n} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 shrink-0">
          <p className="text-[10px] text-slate-400 dark:text-slate-550 text-center">
            Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </>
  );
}
