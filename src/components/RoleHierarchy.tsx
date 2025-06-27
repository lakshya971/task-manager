import React from 'react';
import { 
  Crown, 
  Shield, 
  Star, 
  UserCheck, 
  User,
  ArrowDown,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { UserRole, ROLE_NAMES, ROLE_HIERARCHY, RoleManager } from '../types/roles';
import { useAuth } from '../context/AuthContext';

const RoleHierarchy: React.FC = () => {
  const { user } = useAuth();

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.DEPARTMENT_HEAD:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case UserRole.MANAGER:
        return <Shield className="w-6 h-6 text-blue-500" />;
      case UserRole.ASSISTANT_MANAGER:
        return <Star className="w-6 h-6 text-green-500" />;
      case UserRole.TEAM_LEAD:
        return <UserCheck className="w-6 h-6 text-purple-500" />;
      default:
        return <User className="w-6 h-6 text-gray-500" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.DEPARTMENT_HEAD:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case UserRole.MANAGER:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case UserRole.ASSISTANT_MANAGER:
        return 'bg-green-50 border-green-200 text-green-800';
      case UserRole.TEAM_LEAD:
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const roles = Object.values(UserRole).sort((a, b) => ROLE_HIERARCHY[a] - ROLE_HIERARCHY[b]);
  const currentUserRole = user?.role;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Role Hierarchy</h2>
        <p className="text-gray-600">
          Understanding the organizational structure and permissions for each role.
        </p>
      </div>

      <div className="space-y-4">
        {roles.map((role, index) => {
          const isCurrentUser = currentUserRole === role;
          const canCreateThisRole = currentUserRole ? RoleManager.canCreateRole(currentUserRole, role) : false;
          const permissions = RoleManager.getRolePermissions(role);
          const creatableRoles = RoleManager.getCreatableRoles(role);

          return (
            <div key={role} className="relative">
              <div className={`p-4 rounded-lg border-2 ${getRoleColor(role)} ${
                isCurrentUser ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getRoleIcon(role)}
                    <div>
                      <h3 className="text-lg font-medium">
                        {ROLE_NAMES[role]}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Your Role
                          </span>
                        )}
                      </h3>
                      <p className="text-sm opacity-75">
                        Level {ROLE_HIERARCHY[role]} • {permissions.length} permissions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {canCreateThisRole && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Can Create
                      </span>
                    )}
                    {currentUserRole && !canCreateThisRole && currentUserRole !== role && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center">
                        <XCircle className="w-3 h-3 mr-1" />
                        Cannot Create
                      </span>
                    )}
                  </div>
                </div>

                {/* Permissions */}
                <div className="mb-3">
                  <h4 className="text-sm font-medium mb-2">Key Permissions:</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {permissions.slice(0, 6).map(permission => (
                      <div key={permission} className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{permission.replace(/_/g, ' ').toLowerCase()}</span>
                      </div>
                    ))}
                    {permissions.length > 6 && (
                      <div className="col-span-2 text-center text-gray-500">
                        +{permissions.length - 6} more permissions
                      </div>
                    )}
                  </div>
                </div>

                {/* Can Create Roles */}
                {creatableRoles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Can Create:</h4>
                    <div className="flex flex-wrap gap-1">
                      {creatableRoles.map(creatableRole => (
                        <span 
                          key={creatableRole}
                          className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full border"
                        >
                          {ROLE_NAMES[creatableRole]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Arrow to next level */}
              {index < roles.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Hierarchy Rules</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Higher roles can create and manage users at lower levels</li>
          <li>• Each role has specific permissions for system features</li>
          <li>• Department Heads have full system access</li>
          <li>• Managers can create Assistant Managers and Team Leads</li>
          <li>• Team Leads can create Employees</li>
          <li>• No role can create users above their level</li>
        </ul>
      </div>
    </div>
  );
};

export default RoleHierarchy;
