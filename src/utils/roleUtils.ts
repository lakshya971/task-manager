import { UserRole } from '../types';

export const roleLabels: Record<UserRole, string> = {
  department_head: 'Department Head',
  manager: 'Manager',
  assistant_manager: 'Assistant Manager',
  team_lead: 'Team Lead',
  employee: 'Employee',
};

export const roleColors: Record<UserRole, string> = {
  department_head: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  assistant_manager: 'bg-indigo-100 text-indigo-800',
  team_lead: 'bg-green-100 text-green-800',
  employee: 'bg-gray-100 text-gray-800',
};

export const canCreateRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  const hierarchy: Record<UserRole, UserRole[]> = {
    department_head: ['manager'],
    manager: ['assistant_manager', 'team_lead'],
    assistant_manager: ['team_lead'],
    team_lead: ['employee'],
    employee: [],
  };

  return hierarchy[userRole]?.includes(targetRole) || false;
};

export const getSubordinateRoles = (userRole: UserRole): UserRole[] => {
  const hierarchy: Record<UserRole, UserRole[]> = {
    department_head: ['manager', 'assistant_manager', 'team_lead', 'employee'],
    manager: ['assistant_manager', 'team_lead', 'employee'],
    assistant_manager: ['team_lead', 'employee'],
    team_lead: ['employee'],
    employee: [],
  };

  return hierarchy[userRole] || [];
};