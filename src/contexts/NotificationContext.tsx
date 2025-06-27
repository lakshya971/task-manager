import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Notification, 
  NotificationPreferences, 
  NotificationStats,
  NotificationType,
  NotificationPriority 
} from '../types/notifications';
import { NotificationService } from '../services/notification.service';
import { useAuth } from '../context/AuthContext';

interface NotificationContextType {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  sendNotification: (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    priority?: NotificationPriority
  ) => Promise<Notification>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  
  // Preferences
  preferences: NotificationPreferences | null;
  updatePreferences: (preferences: NotificationPreferences) => void;
  
  // Stats
  stats: NotificationStats | null;
  refreshStats: () => void;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing] = useState(false);

  // Initialize notification service and load data
  useEffect(() => {
    NotificationService.initialize();
    if (user) {
      loadNotifications();
      loadPreferences();
      loadStats();
    }
  }, [user]);

  // Subscribe to real-time notification updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = NotificationService.subscribe(user.id, (event: string, data: any) => {
      switch (event) {
        case 'new_notification':
          setNotifications(prev => [data, ...prev]);
          break;
        case 'notification_read':
          setNotifications(prev => 
            prev.map(n => n.id === data.id ? { ...n, read: true } : n)
          );
          break;
        case 'notifications_read_all':
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          break;
        case 'notification_deleted':
          setNotifications(prev => prev.filter(n => n.id !== data.id));
          break;
      }
    });

    return unsubscribe;
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userNotifications = NotificationService.getNotificationsForUser(user.id, 100);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadPreferences = useCallback(() => {
    if (!user) return;
    
    const userPreferences = NotificationService.getUserPreferences(user.id);
    setPreferences(userPreferences);
  }, [user]);

  const loadStats = useCallback(() => {
    if (!user) return;
    
    try {
      const userStats = NotificationService.getNotificationStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  }, [user]);

  const sendNotification = useCallback(async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    priority?: NotificationPriority
  ): Promise<Notification> => {
    try {
      const notification = await NotificationService.sendNotification(
        userId,
        type,
        title,
        message,
        data,
        priority
      );
      
      // If it's for the current user, add to local state
      if (userId === user?.id) {
        setNotifications(prev => [notification, ...prev]);
      }
      
      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      await NotificationService.markAsRead(notificationId, user.id);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      await NotificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      await NotificationService.deleteNotification(notificationId, user.id);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [user]);

  const updatePreferences = useCallback((newPreferences: NotificationPreferences) => {
    if (!user) return;
    
    try {
      NotificationService.setUserPreferences(user.id, newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }, [user]);

  const refreshStats = useCallback(() => {
    loadStats();
  }, [loadStats]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    sendNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    updatePreferences,
    stats,
    refreshStats,
    isLoading,
    isRefreshing,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
