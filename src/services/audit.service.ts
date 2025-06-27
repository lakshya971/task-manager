export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
}

export type AuditAction = 
  // Authentication
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'FORCE_LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  
  // User Management
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_STATUS_CHANGED'
  | 'USER_ROLE_CHANGED'
  
  // Task Management
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  
  // Notifications
  | 'NOTIFICATION_SENT'
  | 'EMAIL_SENT'
  | 'EMAIL_FAILED'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATION_DELETED'
  
  // API Operations
  | 'API_CALL_SUCCESS'
  | 'API_CALL_FAILED'
  
  // System Events
  | 'PERMISSION_DENIED'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATA_EXPORT'
  | 'SYSTEM_CONFIG_CHANGED'
  | 'SECURITY_ALERT';

export interface CreateAuditLogData {
  userId: string;
  action: AuditAction;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
}

export interface AuditQueryOptions {
  userId?: string;
  action?: AuditAction;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  private static auditLogs: AuditLog[] = [];

  /**
   * Log an audit event
   */
  static async logActivity(data: CreateAuditLogData): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: this.generateId(),
        userId: data.userId,
        action: data.action,
        details: data.details,
        timestamp: new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        sessionId: data.sessionId,
      };

      // Store in memory (in production, save to database)
      this.auditLogs.push(auditLog);

      // Log to console for development
      console.log('📝 Audit Log:', {
        action: auditLog.action,
        userId: auditLog.userId,
        timestamp: auditLog.timestamp.toISOString(),
        details: auditLog.details,
      });

      // In production, you might want to send to external logging service
      // await this.sendToExternalLogger(auditLog);

    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Get audit logs with optional filtering
   */
  static async getAuditLogs(options: AuditQueryOptions = {}): Promise<AuditLog[]> {
    try {
      let filteredLogs = [...this.auditLogs];

      // Filter by user ID
      if (options.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === options.userId);
      }

      // Filter by action
      if (options.action) {
        filteredLogs = filteredLogs.filter(log => log.action === options.action);
      }

      // Filter by date range
      if (options.dateFrom) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= options.dateFrom!);
      }

      if (options.dateTo) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= options.dateTo!);
      }

      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || 100;
      
      return filteredLogs.slice(offset, offset + limit);

    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.getAuditLogs({ userId, limit });
  }

  /**
   * Get recent audit logs
   */
  static async getRecentAuditLogs(limit: number = 20): Promise<AuditLog[]> {
    return this.getAuditLogs({ limit });
  }

  /**
   * Get security-related audit logs
   */
  static async getSecurityAuditLogs(dateFrom?: Date, limit: number = 100): Promise<AuditLog[]> {
    const securityActions: AuditAction[] = [
      'LOGIN_FAILED',
      'FORCE_LOGOUT',
      'ACCOUNT_LOCKED',
      'PERMISSION_DENIED',
      'UNAUTHORIZED_ACCESS',
      'SECURITY_ALERT'
    ];

    const logs = await this.getAuditLogs({ dateFrom, limit: 1000 });
    return logs.filter(log => securityActions.includes(log.action)).slice(0, limit);
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(): Promise<{
    totalLogs: number;
    logsByAction: Record<AuditAction, number>;
    recentLoginAttempts: number;
    failedLoginAttempts: number;
    uniqueUsers: number;
  }> {
    const logs = this.auditLogs;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const logsByAction = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<AuditAction, number>);

    const recentLogs = logs.filter(log => log.timestamp >= oneDayAgo);
    const recentLoginAttempts = recentLogs.filter(log => 
      log.action === 'LOGIN_SUCCESS' || log.action === 'LOGIN_FAILED'
    ).length;

    const failedLoginAttempts = recentLogs.filter(log => 
      log.action === 'LOGIN_FAILED'
    ).length;

    const uniqueUsers = new Set(logs.map(log => log.userId)).size;

    return {
      totalLogs: logs.length,
      logsByAction,
      recentLoginAttempts,
      failedLoginAttempts,
      uniqueUsers,
    };
  }

  /**
   * Export audit logs to CSV
   */
  static async exportAuditLogs(options: AuditQueryOptions = {}): Promise<string> {
    try {
      const logs = await this.getAuditLogs(options);
      
      // CSV headers
      const headers = ['ID', 'User ID', 'Action', 'Timestamp', 'IP Address', 'User Agent', 'Details'];
      
      // Convert logs to CSV rows
      const rows = logs.map(log => [
        log.id,
        log.userId,
        log.action,
        log.timestamp.toISOString(),
        log.ipAddress,
        log.userAgent,
        JSON.stringify(log.details)
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Log export activity
      await this.logActivity({
        userId: 'system',
        action: 'DATA_EXPORT',
        details: { exportType: 'audit_logs', recordCount: logs.length },
        ipAddress: 'localhost',
        userAgent: navigator.userAgent,
      });

      return csvContent;

    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw error;
    }
  }

  /**
   * Clear old audit logs (for maintenance)
   */
  static async clearOldLogs(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      const initialCount = this.auditLogs.length;
      
      this.auditLogs = this.auditLogs.filter(log => log.timestamp >= cutoffDate);
      
      const removedCount = initialCount - this.auditLogs.length;

      if (removedCount > 0) {
        await this.logActivity({
          userId: 'system',
          action: 'SYSTEM_CONFIG_CHANGED',
          details: { operation: 'clear_old_logs', removedCount, olderThanDays },
          ipAddress: 'localhost',
          userAgent: 'system',
        });
      }

      return removedCount;

    } catch (error) {
      console.error('Failed to clear old audit logs:', error);
      return 0;
    }
  }

  /**
   * Generate unique ID for audit logs
   */
  private static generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize audit service with some sample logs
   */
  static initialize(): void {
    // Add some sample audit logs for demonstration
    this.auditLogs = [
      {
        id: 'audit_1',
        userId: 'user1',
        action: 'LOGIN_SUCCESS',
        details: { email: 'admin@company.com' },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      {
        id: 'audit_2',
        userId: 'user1',
        action: 'USER_CREATED',
        details: { createdUserId: 'user5', role: 'EMPLOYEE' },
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      {
        id: 'audit_3',
        userId: 'anonymous',
        action: 'LOGIN_FAILED',
        details: { email: 'test@invalid.com', reason: 'User not found' },
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        ipAddress: '192.168.1.200',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    ];
  }
}
