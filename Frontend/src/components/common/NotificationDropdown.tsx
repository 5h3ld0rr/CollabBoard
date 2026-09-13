import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Sparkles,
  MessageSquare,
  Kanban,
  UserPlus,
  Users,
  CheckCircle2,
  AtSign,
  Settings,
} from 'lucide-react';
import { useNotifications } from '../../context';
import type { AppNotification, NotificationType } from '../../types';

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'task_assigned':
      return <UserPlus className="w-3 h-3 text-indigo-300" />;
    case 'task_status':
      return <Kanban className="w-3 h-3 text-amber-300" />;
    case 'task_comment':
      return <MessageSquare className="w-3 h-3 text-sky-300" />;
    case 'mention':
      return <AtSign className="w-3 h-3 text-violet-300" />;
    case 'board_invite':
      return <Users className="w-3 h-3 text-pink-300" />;
    case 'system':
    default:
      return <Sparkles className="w-3 h-3 text-emerald-300" />;
  }
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter((n) => !n.read);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.linkUrl) {
      navigate(notif.linkUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        className={`p-2 rounded-xl border transition relative cursor-pointer ${
          isOpen
            ? 'bg-slate-800 border-indigo-500/50 text-white shadow-sm shadow-indigo-500/20'
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-950 shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl shadow-black/90 backdrop-blur-xl z-50 ring-1 ring-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-130">
          {/* Header */}
          <div className="p-3.5 pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  Notifications
                </span>
                {unreadCount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {unreadCount} new
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                    All read
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="flex items-center space-x-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-800"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 mt-2.5 p-0.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'unread'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
                  {activeTab === 'unread' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <BellOff className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  {activeTab === 'unread' ? 'All caught up!' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-50">
                  {activeTab === 'unread'
                    ? 'You have read all your notifications.'
                    : 'New activity, assignments, and updates will show up here.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative p-3 transition-colors cursor-pointer flex items-start space-x-3 ${
                    notif.read
                      ? 'bg-transparent hover:bg-slate-800/40 text-slate-300'
                      : 'bg-indigo-950/20 hover:bg-indigo-900/30 text-slate-100'
                  }`}
                >
                  {/* Left Avatar / Icon */}
                  <div className="relative shrink-0 mt-0.5">
                    {notif.actor ? (
                      <div
                        className={`w-8 h-8 rounded-xl bg-linear-to-br ${
                          notif.actor.color || 'from-indigo-600 to-violet-600'
                        } text-white font-bold text-xs flex items-center justify-center shadow-inner`}
                      >
                        {notif.actor.initials}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-indigo-400">
                        <Bell className="w-4 h-4" />
                      </div>
                    )}
                    {/* Tiny type badge at bottom right */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                      {getNotificationIcon(notif.type)}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      <span
                        className={`text-xs font-semibold truncate ${
                          notif.read ? 'text-slate-300' : 'text-white'
                        }`}
                      >
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 wrap-break-word">
                      {notif.message}
                    </p>

                    <div className="mt-1 text-[10px] text-slate-500 font-medium">
                      {formatRelativeTime(notif.timestamp)}
                    </div>
                  </div>

                  {/* Hover Action Buttons */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 backdrop-blur-md rounded-lg p-0.5 border border-slate-700/60 shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        notif.read ? markAsUnread(notif.id) : markAsRead(notif.id)
                      }
                      title={notif.read ? 'Mark as unread' : 'Mark as read'}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNotification(notif.id)}
                      title="Dismiss notification"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            {notifications.length > 0 ? (
              <button
                type="button"
                onClick={() => clearAll()}
                className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            ) : (
              <span className="text-slate-600">No notifications</span>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/profile');
              }}
              className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer ml-auto"
            >
              <Settings className="w-3 h-3" />
              <span>Preferences</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
