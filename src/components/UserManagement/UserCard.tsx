import React from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Mail, 
  Building, 
  Calendar,
  MoreVertical,
  UserCheck,
  UserX 
} from 'lucide-react';
import { User, UserRole, ROLE_NAMES } from '../../types/roles';

interface UserCardProps {
  user: User;
  currentUser: User;
  canEdit: boolean;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  getRoleIcon: (role: UserRole) => React.ReactNode;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  currentUser,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  getRoleIcon
}) => {
  const [showActions, setShowActions] = React.useState(false);

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
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
            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
            <div className="flex items-center space-x-2">
              {getRoleIcon(user.role)}
              <span className="text-sm text-gray-600">{ROLE_NAMES[user.role]}</span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
              <button
                onClick={() => {
                  onView();
                  setShowActions(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
              
              {canEdit && (
                <button
                  onClick={() => {
                    onEdit();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
              
              {canEdit && (
                <button
                  onClick={() => {
                    onToggleStatus();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  {user.status === 'active' ? (
                    <>
                      <UserX className="w-4 h-4" />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Activate</span>
                    </>
                  )}
                </button>
              )}
              
              {canDelete && (
                <button
                  onClick={() => {
                    onDelete();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{user.email}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Building className="w-4 h-4" />
          <span>{user.department}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Joined {user.createdAt.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
          {user.status === 'active' ? 'Active' : 'Inactive'}
        </span>
        
        {user.lastLogin && (
          <span className="text-xs text-gray-500">
            Last seen {user.lastLogin.toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Self indicator */}
      {user.id === currentUser.id && (
        <div className="mt-2 text-xs text-blue-600 font-medium">
          This is you
        </div>
      )}
    </div>
  );
};

export default UserCard;
