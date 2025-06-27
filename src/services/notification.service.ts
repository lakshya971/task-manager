import { 
  Notification, 
  NotificationType, 
  NotificationPriority, 
  NotificationChannel,
  NotificationPreferences,
  NotificationStats 
} from '../types/notifications';
import { User } from '../types/roles';
import { Task } from '../types';
import { EmailService } from './email.service';
import { WebSocketService } from './websocket.service';
import { AuditService } from './audit.service';

export class NotificationService {
  private static notifications: Notification[] = [];
  private static userPreferences: Map<string, NotificationPreferences> = new Map();
  private static listeners: Map<string, Function[]> = new Map();

  /**
   * Initialize notification service
   */
  static initialize() {
    // Load user preferences from localStorage
    const savedPreferences = localStorage.getItem('notification_preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        Object.entries(preferences).forEach(([userId, prefs]) => {
          this.userPreferences.set(userId, prefs as NotificationPreferences);
        });
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    }

    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const notifications = JSON.parse(savedNotifications);
        this.notifications = notifications.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
        }));
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }

    // Initialize WebSocket connection for real-time notifications
    WebSocketService.connect();
    WebSocketService.on('notification', this.handleRealtimeNotification.bind(this));
  }

  /**
   * Send a notification
   */
  static async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    priority: NotificationPriority = NotificationPriority.MEDIUM
  ): Promise<Notification> {
    const notification: Notification = {
      id: this.generateId(),
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
      priority,
      channel: await this.determineChannels(userId, type),
    };

    // Add expiration date for certain types of notifications
    if (type === NotificationType.DEADLINE_REMINDER) {
      notification.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }

    // Store notification
    this.notifications.unshift(notification);
    this.saveNotifications();

    // Send through appropriate channels
    await this.deliverNotification(notification);

    // Log notification activity
    await AuditService.logActivity({
      userId,
      action: 'NOTIFICATION_SENT',
      details: {
        notificationId: notification.id,
        type,
        channels: notification.channel,
        priority,
      },
      ipAddress: 'system',
      userAgent: 'notification-service',
    });

    return notification;
  }

  /**
   * Send task assignment notification
   */
  static async sendTaskAssignedNotification(task: Task, assignedUser: User, assignedBy: User) {
    const notification = await this.sendNotification(
      assignedUser.id,
      NotificationType.TASK_ASSIGNED,
      'New Task Assigned',
      `You have been assigned a new task: "${task.title}"`,
      {
        taskId: task.id,
        taskTitle: task.title,
        assignedBy: assignedBy.name,
        dueDate: task.dueDate,
        priority: task.priority,
      },
      this.mapTaskPriorityToNotificationPriority(task.priority)
    );

    // Send email notification
    if (notification.channel.includes(NotificationChannel.EMAIL)) {
      await EmailService.sendTaskAssignedEmail(task, assignedUser, assignedBy);
    }

    return notification;
  }

  /**
   * Send task update notification
   */
  static async sendTaskUpdatedNotification(task: Task, updatedBy: User, changes: string[]) {
    const assignedUserId = task.assigneeId;
    
    if (assignedUserId && assignedUserId !== updatedBy.id) { // Don't notify the person who made the change
      const notification = await this.sendNotification(
        assignedUserId,
        NotificationType.TASK_UPDATED,
        'Task Updated',
        `Task "${task.title}" has been updated`,
        {
          taskId: task.id,
          taskTitle: task.title,
          updatedBy: updatedBy.name,
          changes,
        },
        NotificationPriority.MEDIUM
      );

      // Send email notification
      if (notification.channel.includes(NotificationChannel.EMAIL)) {
        await EmailService.sendTaskUpdatedEmail(task, assignedUserId, updatedBy, changes);
      }
    }
  }

  /**
   * Send deadline reminder notification
   */
  static async sendDeadlineReminderNotification(task: Task, reminderType: 'upcoming' | 'overdue') {
    const assignedUserId = task.assigneeId;
    
    if (assignedUserId) {
      const title = reminderType === 'upcoming' 
        ? 'Task Deadline Approaching' 
        : 'Task Overdue';
      
      const message = reminderType === 'upcoming'
        ? `Task "${task.title}" is due soon`
        : `Task "${task.title}" is overdue`;

      const notification = await this.sendNotification(
        assignedUserId,
        reminderType === 'upcoming' ? NotificationType.DEADLINE_REMINDER : NotificationType.TASK_OVERDUE,
        title,
        message,
        {
          taskId: task.id,
          taskTitle: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          reminderType,
        },
        reminderType === 'overdue' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM
      );

      // Send email notification
      if (notification.channel.includes(NotificationChannel.EMAIL)) {
        await EmailService.sendDeadlineReminderEmail(task, assignedUserId, reminderType);
      }
    }
  }

  /**
   * Send video call invitation notification
   */
  static async sendVideoCallInvitation(
    meetingId: string,
    title: string,
    scheduledTime: Date,
    invitedUsers: string[],
    organizer: User
  ) {
    for (const userId of invitedUsers) {
      const notification = await this.sendNotification(
        userId,
        NotificationType.VIDEO_CALL_INVITATION,
        'Video Call Invitation',
        `You've been invited to "${title}"`,
        {
          meetingId,
          title,
          scheduledTime,
          organizer: organizer.name,
        },
        NotificationPriority.HIGH
      );

      // Send email notification
      if (notification.channel.includes(NotificationChannel.EMAIL)) {
        await EmailService.sendVideoCallInvitationEmail(
          meetingId,
          title,
          scheduledTime,
          userId,
          organizer
        );
      }
    }
  }

  /**
   * Get notifications for a user
   */
  static getNotificationsForUser(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Notification[] {
    return this.notifications
      .filter(n => {
        if (n.userId !== userId) return false;
        if (unreadOnly && n.read) return false;
        if (n.expiresAt && n.expiresAt < new Date()) return false;
        return true;
      })
      .slice(offset, offset + limit);
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const notification = this.notifications.find(n => n.id === notificationId && n.userId === userId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners(userId, 'notification_read', notification);
      return true;
    }
    return false;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const unreadNotifications = this.notifications.filter(n => n.userId === userId && !n.read);
    unreadNotifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners(userId, 'notifications_read_all', unreadNotifications.length);
    return unreadNotifications.length;
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const index = this.notifications.findIndex(n => n.id === notificationId && n.userId === userId);
    if (index !== -1) {
      const notification = this.notifications.splice(index, 1)[0];
      this.saveNotifications();
      this.notifyListeners(userId, 'notification_deleted', notification);
      return true;
    }
    return false;
  }

  /**
   * Get notification stats for a user
   */
  static getNotificationStats(userId: string): NotificationStats {
    const userNotifications = this.notifications.filter(n => n.userId === userId);
    const totalSent = userNotifications.length;
    const totalRead = userNotifications.filter(n => n.read).length;
    const totalUnread = totalSent - totalRead;

    const byType: Record<NotificationType, number> = {} as any;
    const byChannel: Record<NotificationChannel, number> = {} as any;

    userNotifications.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
      n.channel.forEach(channel => {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      });
    });

    return {
      totalSent,
      totalRead,
      totalUnread,
      byType,
      byChannel,
      deliveryRate: totalSent > 0 ? (totalSent / totalSent) * 100 : 0, // Would be actual delivery rate in production
      openRate: totalSent > 0 ? (totalRead / totalSent) * 100 : 0,
    };
  }

  /**
   * Subscribe to notification events
   */
  static subscribe(userId: string, callback: Function): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, []);
    }
    this.listeners.get(userId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const userListeners = this.listeners.get(userId);
      if (userListeners) {
        const index = userListeners.indexOf(callback);
        if (index !== -1) {
          userListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Set user notification preferences
   */
  static setUserPreferences(userId: string, preferences: NotificationPreferences): void {
    this.userPreferences.set(userId, preferences);
    this.savePreferences();
  }

  /**
   * Get user notification preferences
   */
  static getUserPreferences(userId: string): NotificationPreferences {
    return this.userPreferences.get(userId) || this.getDefaultPreferences(userId);
  }

  // Private methods
  private static generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async determineChannels(userId: string, type: NotificationType): Promise<NotificationChannel[]> {
    const preferences = this.getUserPreferences(userId);
    return preferences.channels[type] || [NotificationChannel.IN_APP];
  }

  private static async deliverNotification(notification: Notification): Promise<void> {
    // Always deliver in-app notifications
    this.notifyListeners(notification.userId, 'new_notification', notification);

    // Send real-time notification via WebSocket
    WebSocketService.emit('user_notification', {
      userId: notification.userId,
      notification,
    });
  }

  private static handleRealtimeNotification(data: any): void {
    if (data.notification) {
      const notification = {
        ...data.notification,
        createdAt: new Date(data.notification.createdAt),
        expiresAt: data.notification.expiresAt ? new Date(data.notification.expiresAt) : undefined,
      };
      this.notifications.unshift(notification);
      this.saveNotifications();
      this.notifyListeners(notification.userId, 'new_notification', notification);
    }
  }

  private static notifyListeners(userId: string, event: string, data: any): void {
    const userListeners = this.listeners.get(userId);
    if (userListeners) {
      userListeners.forEach(callback => {
        try {
          callback(event, data);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      });
    }
  }

  private static saveNotifications(): void {
    try {
      // Only save recent notifications to avoid localStorage size issues
      const recentNotifications = this.notifications.slice(0, 1000);
      localStorage.setItem('notifications', JSON.stringify(recentNotifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  private static savePreferences(): void {
    try {
      const preferencesObj: any = {};
      this.userPreferences.forEach((value, key) => {
        preferencesObj[key] = value;
      });
      localStorage.setItem('notification_preferences', JSON.stringify(preferencesObj));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  private static getDefaultPreferences(userId: string): NotificationPreferences {
    const defaultChannels: NotificationChannel[] = [NotificationChannel.IN_APP, NotificationChannel.EMAIL];
    
    return {
      userId,
      channels: {
        [NotificationType.TASK_ASSIGNED]: defaultChannels,
        [NotificationType.TASK_UPDATED]: [NotificationChannel.IN_APP],
        [NotificationType.TASK_COMPLETED]: [NotificationChannel.IN_APP],
        [NotificationType.TASK_OVERDUE]: defaultChannels,
        [NotificationType.DEADLINE_REMINDER]: defaultChannels,
        [NotificationType.VIDEO_CALL_INVITATION]: defaultChannels,
        [NotificationType.VIDEO_CALL_STARTING]: [NotificationChannel.IN_APP],
        [NotificationType.TEAM_MEMBER_ADDED]: [NotificationChannel.IN_APP],
        [NotificationType.SYSTEM_UPDATE]: [NotificationChannel.IN_APP],
        [NotificationType.SECURITY_ALERT]: defaultChannels,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      emailDigest: {
        enabled: true,
        frequency: 'daily',
        time: '09:00',
      },
    };
  }

  private static mapTaskPriorityToNotificationPriority(taskPriority: string): NotificationPriority {
    switch (taskPriority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return NotificationPriority.HIGH;
      case 'medium':
        return NotificationPriority.MEDIUM;
      case 'low':
      default:
        return NotificationPriority.LOW;
    }
  }
}
