// Re-export User and UserRole from roles.ts for consistency
export type { User, UserRole } from './roles';
// Import User type for use in this file
import type { User } from './roles';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  assignerId: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  completedAt?: Date;
  attachments: TaskAttachment[];
  comments: TaskComment[];
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'in_review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  mentions: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_updated' | 'deadline_reminder' | 'meeting_invite' | 'user_mention';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  organizerId: string;
  participants: string[];
  meetingLink?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

// Reporting and Analytics Types
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  averageCompletionTime: number; // in hours
  productivityScore: number; // 0-100
}

export interface TeamPerformanceMetrics {
  teamId: string;
  teamName: string;
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  averageTaskCompletionTime: number;
  onTimeCompletionRate: number; // percentage
  productivityTrend: number; // percentage change from previous period
  topPerformers: EmployeePerformanceMetric[];
}

export interface EmployeePerformanceMetric {
  userId: string;
  userName: string;
  email: string;
  role: string;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksOverdue: number;
  averageCompletionTime: number;
  onTimeCompletionRate: number;
  productivityScore: number;
  lastActive: Date;
}

export interface AnalyticsTimeframe {
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
}

export interface TaskAnalytics {
  timeframe: AnalyticsTimeframe;
  tasksByStatus: Array<{
    status: TaskStatus;
    count: number;
    percentage: number;
  }>;
  tasksByPriority: Array<{
    priority: TaskPriority;
    count: number;
    percentage: number;
  }>;
  completionTrends: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
  performanceByTeam: TeamPerformanceMetrics[];
  performanceByUser: EmployeePerformanceMetric[];
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'team_performance' | 'individual_performance' | 'task_analytics' | 'productivity_report';
  timeframe: AnalyticsTimeframe;
  filters: {
    userIds?: string[];
    teamIds?: string[];
    priorities?: TaskPriority[];
    statuses?: TaskStatus[];
  };
  format: 'pdf' | 'excel';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    nextRun: Date;
  };
  createdBy: string;
  createdAt: Date;
}

// User Management Types
export interface UserInvitation {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitationToken: string;
}

export interface UserDirectory {
  users: Array<User>;
  totalCount: number;
  filters: {
    roles: string[];
    departments: string[];
    statuses: string[];
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}