/* oxlint-disable react/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Kanban, UserPlus, X } from 'lucide-react';
import type { AppNotification } from '../types';
import {
  getCachedNotifications,
  saveNotificationToCache,
  saveNotificationsToCache,
  deleteCachedNotification,
  clearCachedNotifications,
  subscribeNotificationsChange,
} from '../db';
import { playNotificationSound } from '../utils/sound';
import { subscribeDirectNotification } from '../sync/socketClient';

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addNotification: (
    notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> &
      Partial<Pick<AppNotification, 'id' | 'timestamp' | 'read'>>
  ) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [exitingToastIds, setExitingToastIds] = useState<Set<string>>(new Set());
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const navigate = useNavigate();

  const removeToast = useCallback((id: string) => {
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }

    setExitingToastIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    setTimeout(() => {
      setActiveToasts((prev) => prev.filter((t) => t.id !== id));
      setExitingToastIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 350);
  }, []);

  // Clear any pending toast timers on unmount
  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timer) => clearTimeout(timer));
      toastTimersRef.current.clear();
    };
  }, []);

  // Load notifications from PouchDB
  const refreshFromDB = useCallback(async () => {
    try {
      let cached = await getCachedNotifications();
      setNotifications(cached);
    } catch (err) {
      console.warn('[NotificationContext] Failed to load from PouchDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromDB();

    // Subscribe to PouchDB changes feed for reactive cross-tab and background updates
    const unsubscribe = subscribeNotificationsChange(() => {
      refreshFromDB();
    });

    return () => {
      unsubscribe();
    };
  }, [refreshFromDB]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const target = notifications.find((n) => n.id === id);
    if (target) {
      await saveNotificationToCache({ ...target, read: true });
    }
  }, [notifications]);

  // Mark single notification as unread
  const markAsUnread = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: false } : n))
    );
    const target = notifications.find((n) => n.id === id);
    if (target) {
      await saveNotificationToCache({ ...target, read: false });
    }
  }, [notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    await saveNotificationsToCache(updated);
  }, [notifications]);

  // Remove / dismiss single notification
  const removeNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteCachedNotification(id);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    setNotifications([]);
    await clearCachedNotifications();
  }, []);

  // Add a new notification
  const addNotification = useCallback(
    async (
      notifData: Omit<AppNotification, 'id' | 'timestamp' | 'read'> &
        Partial<Pick<AppNotification, 'id' | 'timestamp' | 'read'>>
    ) => {
      const newNotif: AppNotification = {
        id: notifData.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: notifData.title,
        message: notifData.message,
        timestamp: notifData.timestamp || new Date().toISOString(),
        read: notifData.read ?? false,
        type: notifData.type,
        linkUrl: notifData.linkUrl,
        actor: notifData.actor,
        meta: notifData.meta,
      };

      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      await saveNotificationToCache(newNotif);

      // Trigger in-app live toast banner (stacks down, auto-dismisses 1 by 1)
      setActiveToasts((prev) => {
        // Keep at most 4 previous + 1 new = 5 toasts maximum to prevent viewport crowding
        const trimmed = prev.length >= 5 ? prev.slice(prev.length - 4) : prev;
        return [...trimmed, newNotif];
      });

      const timer = setTimeout(() => {
        removeToast(newNotif.id);
      }, 5000);
      toastTimersRef.current.set(newNotif.id, timer);

      // Trigger native desktop push notification if enabled
      try {
        const savedPrefs = localStorage.getItem('user_profile_preferences');
        const prefs = savedPrefs ? JSON.parse(savedPrefs) : null;
        const desktopEnabled = prefs?.desktopNotifications ?? false;

        if (
          desktopEnabled &&
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new window.Notification(newNotif.title, {
            body: newNotif.message,
            icon: '/favicon.ico',
          });
        }
      } catch {
        // Ignore desktop notification failures
      }

      // Trigger subtle sound cue if enabled
      try {
        playNotificationSound();
      } catch {
        // Ignore sound failures
      }
    },
    []
  );

  // Listen for direct personal notifications over Socket.io (e.g. task assignment, board invite)
  useEffect(() => {
    const unsubscribe = subscribeDirectNotification((payload) => {
      if (payload) {
        addNotification(payload);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        removeNotification,
        clearAll,
        addNotification,
      }}
    >
      {children}

      {/* Floating In-App Real-Time Notification Toast Stack (grows down, disappears 1 by 1 with slide-out transition) */}
      {activeToasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed top-20 right-4 sm:right-6 z-100 flex flex-col pointer-events-none max-w-sm w-full"
        >
          {activeToasts.map((toast) => {
            const isExiting = exitingToastIds.has(toast.id);

            return (
              <div
                key={toast.id}
                role="status"
                className={`pointer-events-auto w-full bg-slate-900/95 border border-indigo-500/50 shadow-2xl shadow-black/80 rounded-2xl p-4 mb-3 backdrop-blur-xl flex items-start space-x-3.5 ring-1 ring-white/10 transition-colors hover:border-indigo-400/70 overflow-hidden ${
                  isExiting ? 'toast-slide-out' : 'toast-slide-in'
                }`}
              >
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                  {toast.type === 'task_status' ? (
                    <Kanban className="w-4 h-4 text-amber-400" />
                  ) : toast.type === 'task_assigned' ? (
                    <UserPlus className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Bell className="w-4 h-4 text-indigo-400" />
                  )}
                </div>

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (toast.linkUrl) {
                      navigate(toast.linkUrl);
                    }
                    removeToast(toast.id);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <p className="text-xs font-bold text-white tracking-wide truncate">
                      {toast.title}
                    </p>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase bg-indigo-500/20 text-indigo-300">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {toast.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0 cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const useOptionalNotifications = (): NotificationContextValue | null => {
  return useContext(NotificationContext) || null;
};
