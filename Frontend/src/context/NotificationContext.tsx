import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppNotification } from '../types';
import {
  getCachedNotifications,
  saveNotificationToCache,
  saveNotificationsToCache,
  deleteCachedNotification,
  clearCachedNotifications,
  subscribeNotificationsChange,
} from '../db';

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

// Initial realistic seed notifications for workspace experience
const INITIAL_SEEDS: AppNotification[] = [
  {
    id: 'notif_seed_1',
    title: 'Card Moved',
    message: 'Clara moved "Implement Offline PouchDB Sync" to In Progress',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    read: false,
    type: 'task_status',
    linkUrl: '/tasks/t1',
    actor: {
      name: 'Clara Zhang',
      initials: 'CZ',
      color: 'from-amber-500 to-orange-600',
    },
    meta: {
      taskId: 't1',
      status: 'in-progress',
    },
  },
  {
    id: 'notif_seed_2',
    title: 'Task Assigned',
    message: 'Alex Chen assigned you to "Design Global Search Palette"',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
    read: false,
    type: 'task_assigned',
    linkUrl: '/tasks/t2',
    actor: {
      name: 'Alex Chen',
      initials: 'AC',
      color: 'from-indigo-500 to-blue-600',
    },
    meta: {
      taskId: 't2',
    },
  },
  {
    id: 'notif_seed_3',
    title: 'Mention in Comment',
    message: 'Sarah mentioned you in "Sprint 14 Retrospective": @you please review the architecture diagram',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    read: true,
    type: 'mention',
    linkUrl: '/tasks/t3',
    actor: {
      name: 'Sarah Connor',
      initials: 'SC',
      color: 'from-emerald-500 to-teal-600',
    },
  },
  {
    id: 'notif_seed_4',
    title: 'Board Invitation',
    message: 'Marcus Brody invited you to collaborate on "Mobile App Launch 2026"',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: true,
    type: 'board_invite',
    linkUrl: '/boards/b1',
    actor: {
      name: 'Marcus Brody',
      initials: 'MB',
      color: 'from-fuchsia-500 to-pink-600',
    },
    meta: {
      boardId: 'b1',
    },
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load notifications from PouchDB
  const refreshFromDB = useCallback(async () => {
    try {
      let cached = await getCachedNotifications();
      const hasSeededKey = 'collabboard_notifications_seeded';
      const alreadySeeded = localStorage.getItem(hasSeededKey);

      if (cached.length === 0 && !alreadySeeded) {
        // Seed initial notifications once so user gets immediate realistic data
        await saveNotificationsToCache(INITIAL_SEEDS);
        localStorage.setItem(hasSeededKey, 'true');
        cached = INITIAL_SEEDS;
      }
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

      // Trigger native desktop push notification if enabled
      try {
        const savedPrefs = localStorage.getItem('user_profile_preferences');
        const prefs = savedPrefs ? JSON.parse(savedPrefs) : null;
        const desktopEnabled = prefs?.desktopNotifications ?? true;

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
    },
    []
  );

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
