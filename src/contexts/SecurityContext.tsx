import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/roles';
import { AuditService, AuditLog } from '../services/audit.service';
import { useAuth } from '../context/AuthContext';

interface SecurityContextType {
  // Security monitoring
  recentAuditLogs: AuditLog[];
  securityStats: SecurityStats;
  
  // Account security
  checkAccountSecurity: (user: User) => AccountSecurityStatus;
  lockAccount: (userId: string, reason: string) => Promise<boolean>;
  unlockAccount: (userId: string) => Promise<boolean>;
  
  // Session management
  getActiveSessions: (userId: string) => ActiveSession[];
  terminateSession: (sessionId: string) => Promise<boolean>;
  terminateAllSessions: (userId: string) => Promise<boolean>;
  
  // Password security
  validatePasswordStrength: (password: string) => PasswordStrength;
  checkPasswordHistory: (userId: string, password: string) => boolean;
  
  // Audit functions
  exportAuditLogs: (options?: any) => Promise<string>;
  getAuditLogs: (filters?: any) => Promise<AuditLog[]>;
}

export interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  lockedAccounts: number;
  recentLoginAttempts: number;
  failedLoginAttempts: number;
  suspiciousActivity: number;
}

export interface AccountSecurityStatus {
  isSecure: boolean;
  warnings: string[];
  recommendations: string[];
  score: number; // 0-100
}

export interface ActiveSession {
  sessionId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  loginTime: Date;
  lastActivity: Date;
  isCurrentSession: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4 (very weak to very strong)
  feedback: string[];
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    totalUsers: 0,
    activeUsers: 0,
    lockedAccounts: 0,
    recentLoginAttempts: 0,
    failedLoginAttempts: 0,
    suspiciousActivity: 0,
  });

  useEffect(() => {
    if (user) {
      loadSecurityData();
    }
  }, [user]);

  const loadSecurityData = async () => {
    try {
      // Load recent audit logs
      const logs = await AuditService.getRecentAuditLogs(50);
      setRecentAuditLogs(logs);

      // Load security statistics
      const stats = await AuditService.getAuditStatistics();
      setSecurityStats({
        totalUsers: stats.uniqueUsers,
        activeUsers: stats.uniqueUsers, // Simplified
        lockedAccounts: 0, // Would come from user service
        recentLoginAttempts: stats.recentLoginAttempts,
        failedLoginAttempts: stats.failedLoginAttempts,
        suspiciousActivity: stats.failedLoginAttempts > 5 ? 1 : 0,
      });
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  };

  const checkAccountSecurity = (user: User): AccountSecurityStatus => {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check password age
    if (user.passwordChangedAt) {
      const daysSinceChange = Math.floor(
        (Date.now() - user.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceChange > 90) {
        warnings.push('Password is older than 90 days');
        recommendations.push('Change your password');
        score -= 20;
      }
    }

    // Check 2FA status
    if (!user.twoFactorEnabled) {
      warnings.push('Two-factor authentication is not enabled');
      recommendations.push('Enable two-factor authentication');
      score -= 15;
    }

    // Check failed login attempts
    if (user.failedLoginAttempts && user.failedLoginAttempts > 3) {
      warnings.push('Multiple failed login attempts detected');
      recommendations.push('Review recent login activity');
      score -= 10;
    }

    // Check last login
    if (user.lastLogin) {
      const daysSinceLogin = Math.floor(
        (Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLogin > 30) {
        warnings.push('Account has been inactive for over 30 days');
        score -= 5;
      }
    }

    return {
      isSecure: score >= 70,
      warnings,
      recommendations,
      score: Math.max(0, score),
    };
  };

  const lockAccount = async (userId: string, reason: string): Promise<boolean> => {
    try {
      // In production, this would call an API
      await AuditService.logActivity({
        userId: user?.id || 'system',
        action: 'ACCOUNT_LOCKED',
        details: { targetUserId: userId, reason },
        ipAddress: 'localhost',
        userAgent: navigator.userAgent,
      });

      return true;
    } catch (error) {
      console.error('Failed to lock account:', error);
      return false;
    }
  };

  const unlockAccount = async (userId: string): Promise<boolean> => {
    try {
      // In production, this would call an API
      await AuditService.logActivity({
        userId: user?.id || 'system',
        action: 'ACCOUNT_UNLOCKED',
        details: { targetUserId: userId },
        ipAddress: 'localhost',
        userAgent: navigator.userAgent,
      });

      return true;
    } catch (error) {
      console.error('Failed to unlock account:', error);
      return false;
    }
  };

  const getActiveSessions = (userId: string): ActiveSession[] => {
    // Mock implementation - in production, get from session store
    return [
      {
        sessionId: 'session_123',
        userId,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        lastActivity: new Date(Date.now() - 5 * 60 * 1000),
        isCurrentSession: true,
      },
    ];
  };

  const terminateSession = async (sessionId: string): Promise<boolean> => {
    try {
      // In production, this would invalidate the session on the server
      await AuditService.logActivity({
        userId: user?.id || 'system',
        action: 'FORCE_LOGOUT',
        details: { sessionId, reason: 'Admin terminated session' },
        ipAddress: 'localhost',
        userAgent: navigator.userAgent,
      });

      return true;
    } catch (error) {
      console.error('Failed to terminate session:', error);
      return false;
    }
  };

  const terminateAllSessions = async (userId: string): Promise<boolean> => {
    try {
      const sessions = getActiveSessions(userId);
      for (const session of sessions) {
        await terminateSession(session.sessionId);
      }
      return true;
    } catch (error) {
      console.error('Failed to terminate all sessions:', error);
      return false;
    }
  };

  const validatePasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    const score = Math.min(4, metRequirements - 1);

    const feedback: string[] = [];
    if (!requirements.minLength) feedback.push('Password must be at least 8 characters long');
    if (!requirements.hasUppercase) feedback.push('Add uppercase letters');
    if (!requirements.hasLowercase) feedback.push('Add lowercase letters');
    if (!requirements.hasNumbers) feedback.push('Add numbers');
    if (!requirements.hasSpecialChars) feedback.push('Add special characters');

    return {
      score,
      feedback,
      isValid: score >= 3,
      requirements,
    };
  };

  const checkPasswordHistory = (_userId: string, _password: string): boolean => {
    // Mock implementation - in production, check against password history
    // Return true if password was used recently (should be rejected)
    return false;
  };

  const exportAuditLogs = async (options?: any): Promise<string> => {
    try {
      return await AuditService.exportAuditLogs(options);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw error;
    }
  };

  const getAuditLogs = async (filters?: any): Promise<AuditLog[]> => {
    try {
      return await AuditService.getAuditLogs(filters);
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  };

  return (
    <SecurityContext.Provider value={{
      recentAuditLogs,
      securityStats,
      checkAccountSecurity,
      lockAccount,
      unlockAccount,
      getActiveSessions,
      terminateSession,
      terminateAllSessions,
      validatePasswordStrength,
      checkPasswordHistory,
      exportAuditLogs,
      getAuditLogs,
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
