export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  priority: NotificationPriority;
  channel: NotificationChannel[];
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  TASK_COMPLETED = 'task_completed',
  TASK_OVERDUE = 'task_overdue',
  DEADLINE_REMINDER = 'deadline_reminder',
  VIDEO_CALL_INVITATION = 'video_call_invitation',
  VIDEO_CALL_STARTING = 'video_call_starting',
  TEAM_MEMBER_ADDED = 'team_member_added',
  SYSTEM_UPDATE = 'system_update',
  SECURITY_ALERT = 'security_alert',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    [key in NotificationType]: NotificationChannel[];
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  emailDigest?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'never';
    time: string; // HH:mm format
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  type: NotificationType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailConfiguration {
  provider: 'gmail' | 'mailgun' | 'sendgrid' | 'custom';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export interface NotificationStats {
  totalSent: number;
  totalRead: number;
  totalUnread: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  deliveryRate: number;
  openRate: number;
}
