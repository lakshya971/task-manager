import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  UserX,
  UserCheck,
  Upload
} from 'lucide-react';
import { UserManagementService } from '../../services/user-management.service';
import type { User, UserDirectory } from '../../types';

interface UserManagementProps {
  currentUserId: string;
  currentUserRole: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUserId,
  currentUserRole
}) => {
  const [userDirectory, setUserDirectory] = useState<UserDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    status: 'active'
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);

  // Check if current user can manage other users
  const canManageUsers = ['DEPARTMENT_HEAD', 'MANAGER'].includes(currentUserRole);

  useEffect(() => {
    loadUsers();
  }, [page, filters, searchQuery]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const directory = await UserManagementService.getUserDirectory({
        page,
        limit: 20,
        search: searchQuery || undefined,
        ...filters
      });
      setUserDirectory(directory);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (invitation: {
    email: string;
    role: string;
    department?: string;
  }) => {
    try {
      const result = await UserManagementService.sendInvitation({
        ...invitation,
        invitedBy: currentUserId
      });

      if (result.success) {
        alert('Invitation sent successfully!');
        setShowInviteModal(false);
        loadUsers(); // Refresh the list
      } else {
        alert(`Failed to send invitation: ${result.message}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    try {
      const result = await UserManagementService.updateUserStatus(
        user.id, 
        newStatus, 
        currentUserId
      );

      if (result.success) {
        alert(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
        loadUsers(); // Refresh the list
      } else {
        alert(`Failed to update user status: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleUpdateUserRole = async (user: User, newRole: string) => {
    try {
      const result = await UserManagementService.updateUserRole(
        user.id, 
        newRole, 
        currentUserId
      );

      if (result.success) {
        alert('User role updated successfully!');
        loadUsers(); // Refresh the list
        setSelectedUser(null);
      } else {
        alert(`Failed to update user role: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleBulkInvite = async (invitations: Array<{ 
    email: string; 
    role: string; 
    department?: string; 
  }>) => {
    try {
      const result = await UserManagementService.bulkInviteUsers(invitations, currentUserId);
      
      const successCount = result.results.filter(r => r.success).length;
      const failureCount = result.results.length - successCount;
      
      alert(`Bulk invite completed: ${successCount} successful, ${failureCount} failed`);
      setShowBulkInviteModal(false);
      loadUsers();
    } catch (error) {
      console.error('Error with bulk invite:', error);
      alert('Bulk invite failed');
    }
  };

  if (loading && !userDirectory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">
              Manage team members, roles, and permissions
            </p>
          </div>
          {canManageUsers && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Bulk Invite
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Invite User
              </button>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            {userDirectory?.filters.roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {userDirectory?.filters.departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Statistics */}
        {userDirectory && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{userDirectory.totalCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userDirectory.users.filter(u => u.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Inactive Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userDirectory.users.filter(u => u.status === 'inactive').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Managers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userDirectory.users.filter(u => 
                      ['MANAGER', 'DEPARTMENT_HEAD'].includes(u.role)
                    ).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                {canManageUsers && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userDirectory?.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.department || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  {canManageUsers && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className={`p-2 rounded-full ${
                            user.status === 'active'
                              ? 'text-red-600 hover:bg-red-100'
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 rounded-full text-blue-600 hover:bg-blue-100"
                          title="Edit user"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {userDirectory && userDirectory.pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(userDirectory.pagination.totalPages, page + 1))}
                disabled={page === userDirectory.pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(page - 1) * userDirectory.pagination.limit + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(page * userDirectory.pagination.limit, userDirectory.totalCount)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{userDirectory.totalCount}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {Array.from({ length: userDirectory.pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteUser}
          availableRoles={userDirectory?.filters.roles || []}
          availableDepartments={userDirectory?.filters.departments || []}
        />
      )}

      {/* Bulk Invite Modal */}
      {showBulkInviteModal && (
        <BulkInviteModal
          onClose={() => setShowBulkInviteModal(false)}
          onBulkInvite={handleBulkInvite}
          availableRoles={userDirectory?.filters.roles || []}
          availableDepartments={userDirectory?.filters.departments || []}
        />
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateRole={handleUpdateUserRole}
          availableRoles={userDirectory?.filters.roles || []}
        />
      )}
    </div>
  );
};

// Invite User Modal Component
interface InviteUserModalProps {
  onClose: () => void;
  onInvite: (invitation: { email: string; role: string; department?: string }) => void;
  availableRoles: string[];
  availableDepartments: string[];
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  onClose,
  onInvite,
  availableRoles,
  availableDepartments
}) => {
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    department: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email && formData.role) {
      onInvite(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite New User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a role</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department (Optional)
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a department</option>
              {availableDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Bulk Invite Modal Component (simplified)
interface BulkInviteModalProps {
  onClose: () => void;
  onBulkInvite: (invitations: Array<{ email: string; role: string; department?: string }>) => void;
  availableRoles: string[];
  availableDepartments: string[];
}

const BulkInviteModal: React.FC<BulkInviteModalProps> = ({ onClose, onBulkInvite }) => {
  const [csvData, setCsvData] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Parse CSV data (simplified - in production, use a proper CSV parser)
    const lines = csvData.trim().split('\n');
    const invitations = lines.map(line => {
      const [email, role, department] = line.split(',').map(s => s.trim());
      return { email, role, department };
    }).filter(inv => inv.email && inv.role);

    if (invitations.length > 0) {
      onBulkInvite(invitations);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Invite Users</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV Data (email, role, department)
            </label>
            <textarea
              required
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
              placeholder="user1@example.com, EMPLOYEE, Engineering&#10;user2@example.com, MANAGER, Sales"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send Invitations
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onUpdateRole: (user: User, newRole: string) => void;
  availableRoles: string[];
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,  
  onUpdateRole,
  availableRoles
}) => {
  const [selectedRole, setSelectedRole] = useState(user.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole !== user.role) {
      onUpdateRole(user, selectedRole as string);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User
            </label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              required
              value={selectedRole as string}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
