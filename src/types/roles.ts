// User roles in hierarchical order (highest to lowest authority)
export enum UserRole {
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  MANAGER = 'MANAGER', 
  ASSISTANT_MANAGER = 'ASSISTANT_MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  EMPLOYEE = 'EMPLOYEE'
}

// Role hierarchy levels (lower number = higher authority)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.DEPARTMENT_HEAD]: 1,
  [UserRole.MANAGER]: 2,
  [UserRole.ASSISTANT_MANAGER]: 3,
  [UserRole.TEAM_LEAD]: 4,
  [UserRole.EMPLOYEE]: 5
};

// Role display names
export const ROLE_NAMES: Record<UserRole, string> = {
  [UserRole.DEPARTMENT_HEAD]: 'Department Head',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.ASSISTANT_MANAGER]: 'Assistant Manager', 
  [UserRole.TEAM_LEAD]: 'Team Lead',
  [UserRole.EMPLOYEE]: 'Employee'
};

// Permissions for each role
export enum Permission {
  // User management
  CREATE_USERS = 'CREATE_USERS',
  VIEW_USERS = 'VIEW_USERS',
  EDIT_USERS = 'EDIT_USERS',
  DELETE_USERS = 'DELETE_USERS',
  
  // Task management
  CREATE_TASKS = 'CREATE_TASKS',
  VIEW_ALL_TASKS = 'VIEW_ALL_TASKS',
  VIEW_TEAM_TASKS = 'VIEW_TEAM_TASKS',
  EDIT_ALL_TASKS = 'EDIT_ALL_TASKS',
  EDIT_TEAM_TASKS = 'EDIT_TEAM_TASKS',
  DELETE_TASKS = 'DELETE_TASKS',
  ASSIGN_TASKS = 'ASSIGN_TASKS',
  
  // Project management
  CREATE_PROJECTS = 'CREATE_PROJECTS',
  VIEW_ALL_PROJECTS = 'VIEW_ALL_PROJECTS',
  VIEW_TEAM_PROJECTS = 'VIEW_TEAM_PROJECTS',
  EDIT_PROJECTS = 'EDIT_PROJECTS',
  DELETE_PROJECTS = 'DELETE_PROJECTS',
  
  // Reports and analytics
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  VIEW_TEAM_ANALYTICS = 'VIEW_TEAM_ANALYTICS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  
  // Meeting management
  CREATE_MEETINGS = 'CREATE_MEETINGS',
  MANAGE_MEETINGS = 'MANAGE_MEETINGS',
  JOIN_MEETINGS = 'JOIN_MEETINGS',
  
  // System administration
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  MANAGE_DEPARTMENTS = 'MANAGE_DEPARTMENTS'
}

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.DEPARTMENT_HEAD]: [
    // User management - full access
    Permission.CREATE_USERS,
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    
    // Task management - full access
    Permission.CREATE_TASKS,
    Permission.VIEW_ALL_TASKS,
    Permission.EDIT_ALL_TASKS,
    Permission.DELETE_TASKS,
    Permission.ASSIGN_TASKS,
    
    // Project management - full access
    Permission.CREATE_PROJECTS,
    Permission.VIEW_ALL_PROJECTS,
    Permission.EDIT_PROJECTS,
    Permission.DELETE_PROJECTS,
    
    // Analytics and reports - full access
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_REPORTS,
    
    // Meeting management
    Permission.CREATE_MEETINGS,
    Permission.MANAGE_MEETINGS,
    Permission.JOIN_MEETINGS,
    
    // System administration
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_DEPARTMENTS
  ],
  
  [UserRole.MANAGER]: [
    // User management - can create Assistant Managers and Team Leads
    Permission.CREATE_USERS,
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    
    // Task management - team focused
    Permission.CREATE_TASKS,
    Permission.VIEW_ALL_TASKS,
    Permission.VIEW_TEAM_TASKS,
    Permission.EDIT_TEAM_TASKS,
    Permission.ASSIGN_TASKS,
    
    // Project management - team focused
    Permission.CREATE_PROJECTS,
    Permission.VIEW_ALL_PROJECTS,
    Permission.VIEW_TEAM_PROJECTS,
    Permission.EDIT_PROJECTS,
    
    // Analytics
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_TEAM_ANALYTICS,
    Permission.EXPORT_REPORTS,
    
    // Meeting management
    Permission.CREATE_MEETINGS,
    Permission.MANAGE_MEETINGS,
    Permission.JOIN_MEETINGS
  ],
  
  [UserRole.ASSISTANT_MANAGER]: [
    // User management - limited
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    
    // Task management - team focused
    Permission.CREATE_TASKS,
    Permission.VIEW_TEAM_TASKS,
    Permission.EDIT_TEAM_TASKS,
    Permission.ASSIGN_TASKS,
    
    // Project management - team focused
    Permission.VIEW_TEAM_PROJECTS,
    Permission.EDIT_PROJECTS,
    
    // Analytics - team focused
    Permission.VIEW_TEAM_ANALYTICS,
    
    // Meeting management
    Permission.CREATE_MEETINGS,
    Permission.JOIN_MEETINGS
  ],
  
  [UserRole.TEAM_LEAD]: [
    // User management - can create Employees
    Permission.CREATE_USERS,
    Permission.VIEW_USERS,
    
    // Task management - team focused
    Permission.CREATE_TASKS,
    Permission.VIEW_TEAM_TASKS,
    Permission.EDIT_TEAM_TASKS,
    Permission.ASSIGN_TASKS,
    
    // Project management - limited
    Permission.VIEW_TEAM_PROJECTS,
    
    // Analytics - team focused
    Permission.VIEW_TEAM_ANALYTICS,
    
    // Meeting management
    Permission.CREATE_MEETINGS,
    Permission.JOIN_MEETINGS
  ],
  
  [UserRole.EMPLOYEE]: [
    // Basic permissions
    Permission.VIEW_USERS,
    Permission.CREATE_TASKS,
    Permission.JOIN_MEETINGS
  ]
};

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  managerId?: string; // ID of the user's manager
  createdBy: string; // ID of the user who created this user
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  avatar?: string;
  status: 'active' | 'inactive';
  permissions?: Permission[]; // Cached permissions for efficiency
  
  // Security-related fields
  password?: string; // Hashed password (not stored in frontend in production)
  passwordChangedAt?: Date;
  failedLoginAttempts?: number;
  accountLockedUntil?: Date;
  lastPasswordChange?: Date;
  mustChangePassword?: boolean;
  twoFactorEnabled?: boolean;
  sessionId?: string;
  securityQuestions?: Array<{
    question: string;
    answer: string; // Hashed answer
  }>;
}

// Helper functions for role management
export class RoleManager {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[userRole].includes(permission);
  }
  
  /**
   * Check if a user can create another user with the specified role
   */
  static canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
    const creatorLevel = ROLE_HIERARCHY[creatorRole];
    const targetLevel = ROLE_HIERARCHY[targetRole];
    
    // Can only create users at lower levels
    return creatorLevel < targetLevel;
  }
  
  /**
   * Get roles that a user can create
   */
  static getCreatableRoles(creatorRole: UserRole): UserRole[] {
    const creatorLevel = ROLE_HIERARCHY[creatorRole];
    
    return Object.entries(ROLE_HIERARCHY)
      .filter(([, level]) => level > creatorLevel)
      .map(([role]) => role as UserRole);
  }
  
  /**
   * Check if user A can manage user B (edit, delete, etc.)
   */
  static canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
    const managerLevel = ROLE_HIERARCHY[managerRole];
    const targetLevel = ROLE_HIERARCHY[targetRole];
    
    // Can only manage users at same or lower levels (but not themselves for certain actions)
    return managerLevel <= targetLevel;
  }
  
  /**
   * Get the highest role in the hierarchy
   */
  static getHighestRole(): UserRole {
    return UserRole.DEPARTMENT_HEAD;
  }
  
  /**
   * Get the lowest role in the hierarchy
   */
  static getLowestRole(): UserRole {
    return UserRole.EMPLOYEE;
  }
  
  /**
   * Check if a role is higher than another role
   */
  static isHigherRole(role1: UserRole, role2: UserRole): boolean {
    return ROLE_HIERARCHY[role1] < ROLE_HIERARCHY[role2];
  }
  
  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role];
  }
  
  /**
   * Check if user can view/access specific data based on hierarchy
   */
  static canAccessData(userRole: UserRole, dataOwnerRole: UserRole): boolean {
    const userLevel = ROLE_HIERARCHY[userRole];
    const dataOwnerLevel = ROLE_HIERARCHY[dataOwnerRole];
    
    // Higher roles can access data of lower roles
    return userLevel <= dataOwnerLevel;
  }
}
