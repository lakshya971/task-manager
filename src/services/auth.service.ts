import { User, UserRole } from '../types/roles';
import { mockUsers } from '../data/mockData';
import { AuditService } from './audit.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export class AuthService {
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Authenticate user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials;
      
      // Find user by email
      const user = mockUsers.find(u => u.email === email && u.status === 'active');
      
      if (!user) {
        await AuditService.logActivity({
          userId: 'anonymous',
          action: 'LOGIN_FAILED',
          details: { email, reason: 'User not found' },
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent,
        });
        
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Verify password (in production, use bcrypt)
      const isValidPassword = await this.verifyPassword(password, user.password || 'password');
      
      if (!isValidPassword) {
        await AuditService.logActivity({
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: { email, reason: 'Invalid password' },
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent,
        });
        
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Generate JWT token
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store tokens in localStorage (in production, use httpOnly cookies)
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(user));

      // Log successful login
      await AuditService.logActivity({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        details: { email },
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
      });

      return {
        success: true,
        token,
        user
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login'
      };
    }
  }

  /**
   * Logout user and invalidate tokens
   */
  static async logout(userId?: string): Promise<void> {
    try {
      // Log logout activity
      if (userId) {
        await AuditService.logActivity({
          userId,
          action: 'LOGOUT',
          details: {},
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent,
        });
      }

      // Clear tokens from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');

      // In production, add token to blacklist on server
      // await this.blacklistToken(token);

    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      // Simple JWT verification (in production, use a proper JWT library)
      const payload = this.decodeToken(token);
      
      if (!payload || payload.exp < Date.now()) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      const payload = this.verifyToken(refreshToken);
      if (!payload) return null;

      const user = mockUsers.find(u => u.id === payload.userId);
      if (!user || user.status !== 'active') return null;

      const newToken = this.generateToken(user);
      localStorage.setItem('accessToken', newToken);

      return newToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Get current authenticated user from token
   */
  static getCurrentUser(): User | null {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;

      const payload = this.verifyToken(token);
      if (!payload) return null;

      const user = mockUsers.find(u => u.id === payload.userId);
      return user && user.status === 'active' ? user : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    const payload = this.verifyToken(token);
    return payload !== null;
  }

  /**
   * Generate JWT token for user
   */
  private static generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + this.TOKEN_EXPIRY
    };

    // Simple token generation (in production, use proper JWT library)
    return btoa(JSON.stringify(payload));
  }

  /**
   * Generate refresh token
   */
  private static generateRefreshToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + this.REFRESH_TOKEN_EXPIRY
    };

    return btoa(JSON.stringify(payload));
  }

  /**
   * Decode JWT token
   */
  private static decodeToken(token: string): JWTPayload | null {
    try {
      return JSON.parse(atob(token));
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify password (in production, use bcrypt)
   */
  private static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    // Simple password verification for demo
    // In production, use: return await bcrypt.compare(plainPassword, hashedPassword);
    return plainPassword === hashedPassword || plainPassword === 'password';
  }

  /**
   * Get client IP address
   */
  private static getClientIP(): string {
    // In production, get from server-side request headers
    return 'localhost';
  }

  /**
   * Force logout if token is invalid or expired
   */
  static async forceLogout(reason: string): Promise<void> {
    const user = this.getCurrentUser();
    
    if (user) {
      await AuditService.logActivity({
        userId: user.id,
        action: 'FORCE_LOGOUT',
        details: { reason },
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
      });
    }

    await this.logout(user?.id);
  }

  /**
   * Validate session and refresh if needed
   */
  static async validateSession(): Promise<boolean> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return false;

      const payload = this.verifyToken(token);
      if (!payload) {
        // Try to refresh token
        const newToken = await this.refreshToken();
        return newToken !== null;
      }

      // Check if token is close to expiry (refresh if less than 5 minutes remaining)
      if (payload.exp - Date.now() < 5 * 60 * 1000) {
        const newToken = await this.refreshToken();
        return newToken !== null;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Clear all authentication data (useful for production deployment)
   */
  static clearAllAuthData(): void {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      
      // Clear any other auth-related localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('All authentication data cleared');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Check if app is in production environment
   */
  static isProduction(): boolean {
    return import.meta.env.PROD || window.location.hostname !== 'localhost';
  }
}
