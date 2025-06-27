import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Permission, RoleManager } from '../types/roles';
import { useAuth } from '../context/AuthContext';

interface RbacContextType {
  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  
  // Role-based checks
  canCreateRole: (targetRole: UserRole) => boolean;
  canManageUser: (targetUser: User) => boolean;
  canAccessData: (dataOwnerRole: UserRole) => boolean;
  getCreatableRoles: () => UserRole[];
  
  // User hierarchy
  isHigherRole: (targetRole: UserRole) => boolean;
  isEqualOrHigherRole: (targetRole: UserRole) => boolean;
  getSubordinateUsers: (users: User[]) => User[];
  
  // UI helpers
  shouldShowComponent: (requiredPermissions?: Permission[], requiredRoles?: UserRole[]) => boolean;
  getPermissionError: (permission: Permission) => string;
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export function RbacProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    if (user) {
      setUserPermissions(RoleManager.getRolePermissions(user.role));
    } else {
      setUserPermissions([]);
    }
  }, [user]);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => userPermissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.every(permission => userPermissions.includes(permission));
  };

  const canCreateRole = (targetRole: UserRole): boolean => {
    if (!user) return false;
    return RoleManager.canCreateRole(user.role, targetRole);
  };

  const canManageUser = (targetUser: User): boolean => {
    if (!user) return false;
    return RoleManager.canManageUser(user.role, targetUser.role);
  };

  const canAccessData = (dataOwnerRole: UserRole): boolean => {
    if (!user) return false;
    return RoleManager.canAccessData(user.role, dataOwnerRole);
  };

  const getCreatableRoles = (): UserRole[] => {
    if (!user) return [];
    return RoleManager.getCreatableRoles(user.role);
  };

  const isHigherRole = (targetRole: UserRole): boolean => {
    if (!user) return false;
    return RoleManager.isHigherRole(user.role, targetRole);
  };

  const isEqualOrHigherRole = (targetRole: UserRole): boolean => {
    if (!user) return false;
    return user.role === targetRole || RoleManager.isHigherRole(user.role, targetRole);
  };

  const getSubordinateUsers = (users: User[]): User[] => {
    if (!user) return [];
    return users.filter(u => canAccessData(u.role));
  };

  const shouldShowComponent = (
    requiredPermissions?: Permission[], 
    requiredRoles?: UserRole[]
  ): boolean => {
    if (!user) return false;
    
    // Check permissions if provided
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasAnyPermission(requiredPermissions)) {
        return false;
      }
    }
    
    // Check roles if provided
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        return false;
      }
    }
    
    return true;
  };

  const getPermissionError = (permission: Permission): string => {
    const permissionMessages: Record<Permission, string> = {
      [Permission.CREATE_USERS]: 'You don\'t have permission to create users.',
      [Permission.VIEW_USERS]: 'You don\'t have permission to view users.',
      [Permission.EDIT_USERS]: 'You don\'t have permission to edit users.',
      [Permission.DELETE_USERS]: 'You don\'t have permission to delete users.',
      [Permission.CREATE_TASKS]: 'You don\'t have permission to create tasks.',
      [Permission.VIEW_ALL_TASKS]: 'You don\'t have permission to view all tasks.',
      [Permission.VIEW_TEAM_TASKS]: 'You don\'t have permission to view team tasks.',
      [Permission.EDIT_ALL_TASKS]: 'You don\'t have permission to edit all tasks.',
      [Permission.EDIT_TEAM_TASKS]: 'You don\'t have permission to edit team tasks.',
      [Permission.DELETE_TASKS]: 'You don\'t have permission to delete tasks.',
      [Permission.ASSIGN_TASKS]: 'You don\'t have permission to assign tasks.',
      [Permission.CREATE_PROJECTS]: 'You don\'t have permission to create projects.',
      [Permission.VIEW_ALL_PROJECTS]: 'You don\'t have permission to view all projects.',
      [Permission.VIEW_TEAM_PROJECTS]: 'You don\'t have permission to view team projects.',
      [Permission.EDIT_PROJECTS]: 'You don\'t have permission to edit projects.',
      [Permission.DELETE_PROJECTS]: 'You don\'t have permission to delete projects.',
      [Permission.VIEW_ANALYTICS]: 'You don\'t have permission to view analytics.',
      [Permission.VIEW_TEAM_ANALYTICS]: 'You don\'t have permission to view team analytics.',
      [Permission.EXPORT_REPORTS]: 'You don\'t have permission to export reports.',
      [Permission.CREATE_MEETINGS]: 'You don\'t have permission to create meetings.',
      [Permission.MANAGE_MEETINGS]: 'You don\'t have permission to manage meetings.',
      [Permission.JOIN_MEETINGS]: 'You don\'t have permission to join meetings.',
      [Permission.MANAGE_SETTINGS]: 'You don\'t have permission to manage settings.',
      [Permission.VIEW_AUDIT_LOGS]: 'You don\'t have permission to view audit logs.',
      [Permission.MANAGE_DEPARTMENTS]: 'You don\'t have permission to manage departments.',
    };

    return permissionMessages[permission] || 'You don\'t have permission to perform this action.';
  };

  const value: RbacContextType = {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreateRole,
    canManageUser,
    canAccessData,
    getCreatableRoles,
    isHigherRole,
    isEqualOrHigherRole,
    getSubordinateUsers,
    shouldShowComponent,
    getPermissionError,
  };

  return (
    <RbacContext.Provider value={value}>
      {children}
    </RbacContext.Provider>
  );
}

export function useRbac() {
  const context = useContext(RbacContext);
  if (context === undefined) {
    throw new Error('useRbac must be used within an RbacProvider');
  }
  return context;
}

// Higher-order component for protecting components with permissions
export function withPermissions<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermissions: Permission[]
) {
  return function ProtectedComponent(props: T) {
    const { hasAnyPermission, getPermissionError } = useRbac();
    
    if (!hasAnyPermission(requiredPermissions)) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              {getPermissionError(requiredPermissions[0])}
            </p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

// Higher-order component for protecting components with roles
export function withRoles<T extends object>(
  Component: React.ComponentType<T>,
  requiredRoles: UserRole[]
) {
  return function ProtectedComponent(props: T) {
    const { user } = useAuth();
    
    if (!user || !requiredRoles.includes(user.role)) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have the required role to access this feature.
            </p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}
