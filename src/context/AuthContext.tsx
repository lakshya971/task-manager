import { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Permission, RoleManager } from '../types/roles';
import { AuthService, LoginCredentials } from '../services/auth.service';
import { AuditService } from '../services/audit.service';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  canCreateRole: (targetRole: UserRole) => boolean;
  canManageUser: (targetUser: User) => boolean;
  refreshToken: () => Promise<boolean>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Initialize audit service
      AuditService.initialize();
      
      // Check if user has valid session
      const isValid = await AuthService.validateSession();
      if (isValid) {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await AuthService.forceLogout('initialization_error');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await AuthService.login(credentials);
      
      if (response.success && response.user) {
        setUser(response.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await AuthService.logout(user?.id);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const newToken = await AuthService.refreshToken();
      if (newToken) {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const checkSession = async (): Promise<boolean> => {
    try {
      const isValid = await AuthService.validateSession();
      if (!isValid) {
        await logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session check error:', error);
      return false;
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return RoleManager.hasPermission(user.role, permission);
  };

  const canCreateRole = (targetRole: UserRole): boolean => {
    if (!user) return false;
    return RoleManager.canCreateRole(user.role, targetRole);
  };

  const canManageUser = (targetUser: User): boolean => {
    if (!user) return false;
    return RoleManager.canManageUser(user.role, targetUser.role);
  };

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const isValid = await AuthService.validateSession();
      if (!isValid) {
        await logout();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      isLoading,
      hasPermission,
      canCreateRole,
      canManageUser,
      refreshToken,
      checkSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}