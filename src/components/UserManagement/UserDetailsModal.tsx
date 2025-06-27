import React from 'react';
import { 
  X, 
  Mail, 
  Building, 
  Calendar, 
  User as UserIcon, 
  Clock,
  Shield,
  UserCheck,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { User, UserRole, ROLE_NAMES, RoleManager } from '../../types/roles';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  getRoleIcon: (role: UserRole) => React.ReactNode;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
  getRoleIcon
}) => {
  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const permissions = RoleManager.getRolePermissions(user.role);
  const creatableRoles = RoleManager.getCreatableRoles(user.role);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {getAvatarInitials(user.name)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <div className="flex items-center space-x-2">
                {getRoleIcon(user.role)}
                <span className="text-sm text-gray-600">{ROLE_NAMES[user.role]}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2 text-gray-900">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm">
                <Building className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-500">Department:</span>
                  <span className="ml-2 text-gray-900">{user.department}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm">
                <Shield className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-500">Role:</span>
                  <span className="ml-2 text-gray-900">{ROLE_NAMES[user.role]}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm">
                <UserCheck className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'active' 
                      ? 'text-green-800 bg-green-100' 
                      : 'text-red-800 bg-red-100'
                  }`}>
                    {user.status === 'active' ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Activity</h3>
              
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-500">Joined:</span>
                  <span className="ml-2 text-gray-900">{user.createdAt.toLocaleDateString()}</span>
                </div>
              </div>

              {user.lastLogin && (
                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Last Login:</span>
                    <span className="ml-2 text-gray-900">{user.lastLogin.toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {user.managerId && (
                <div className="flex items-center space-x-3 text-sm">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Manager ID:</span>
                    <span className="ml-2 text-gray-900">{user.managerId}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {permissions.map(permission => (
                <div key={permission} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">{permission.replace(/_/g, ' ').toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Can Create Roles */}
          {creatableRoles.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Can Create Roles</h3>
              <div className="flex flex-wrap gap-2">
                {creatableRoles.map(role => (
                  <span 
                    key={role}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {getRoleIcon(role)}
                    <span className="ml-2">{ROLE_NAMES[role]}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ID Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">User ID:</span>
                <span className="ml-2 text-gray-900 font-mono">{user.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Created By:</span>
                <span className="ml-2 text-gray-900">{user.createdBy}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
