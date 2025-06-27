import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Users, 
  UserCheck,
  UserX,
  Shield,
  Crown,
  Star,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole, Permission, RoleManager, ROLE_NAMES } from '../types/roles';
import { mockUsers } from '../data/mockData';
import UserCard from '../components/UserManagement/UserCard';
import CreateUserModal from '../components/UserManagement/CreateUserModal';
import EditUserModal from '../components/UserManagement/EditUserModal';
import UserDetailsModal from '../components/UserManagement/UserDetailsModal';
import RoleHierarchy from '../components/RoleHierarchy';

const UserManagement: React.FC = () => {
  const { user: currentUser, hasPermission, canManageUser } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleHierarchy] = useState(false);

  // Check permissions
  const canViewUsers = hasPermission(Permission.VIEW_USERS);
  const canCreateUsers = hasPermission(Permission.CREATE_USERS);
  const canEditUsers = hasPermission(Permission.EDIT_USERS);
  const canDeleteUsers = hasPermission(Permission.DELETE_USERS);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterRole, filterDepartment, filterStatus, users]);

  const filterUsers = () => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Apply department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(user => user.department === filterDepartment);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    // Apply hierarchy filter - users can only see users they can manage
    if (currentUser) {
      filtered = filtered.filter(user => 
        user.id === currentUser.id || // Can always see self
        RoleManager.canAccessData(currentUser.role, user.role)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = (userData: Omit<User, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) return;

    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
      createdBy: currentUser.id,
    };

    setUsers([...users, newUser]);
    setShowCreateModal(false);
  };

  const handleEditUser = (updatedUser: User) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active', isActive: user.status !== 'active' }
        : user
    ));
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.DEPARTMENT_HEAD:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case UserRole.MANAGER:
        return <Shield className="w-4 h-4 text-blue-500" />;
      case UserRole.ASSISTANT_MANAGER:
        return <Star className="w-4 h-4 text-green-500" />;
      case UserRole.TEAM_LEAD:
        return <UserCheck className="w-4 h-4 text-purple-500" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const uniqueDepartments = Array.from(new Set(users.map(user => user.department)));
  const creatableRoles = currentUser ? RoleManager.getCreatableRoles(currentUser.role) : [];

  if (!canViewUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <UserX className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to view users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users and their roles within your organization</p>
          </div>
        </div>
        {canCreateUsers && creatableRoles.length > 0 && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        )}
      </div>

      {/* Role Hierarchy */}
      {showRoleHierarchy && (
        <RoleHierarchy />
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md p-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
              className="w-full rounded-md p-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              {Object.values(UserRole).map(role => (
                <option key={role} value={role}>
                  {ROLE_NAMES[role]}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full rounded-md p-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full rounded-md p-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <UserCard
            key={user.id}
            user={user}
            currentUser={currentUser!}
            canEdit={canEditUsers && canManageUser(user)}
            canDelete={canDeleteUsers && canManageUser(user) && user.id !== currentUser?.id}
            onView={() => {
              setSelectedUser(user);
              setShowDetailsModal(true);
            }}
            onEdit={() => {
              setSelectedUser(user);
              setShowEditModal(true);
            }}
            onDelete={() => handleDeleteUser(user.id)}
            onToggleStatus={() => handleToggleUserStatus(user.id)}
            getRoleIcon={getRoleIcon}
          />
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          creatableRoles={creatableRoles}
          departments={uniqueDepartments}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSubmit={handleEditUser}
          canChangeRole={canManageUser(selectedUser)}
          creatableRoles={creatableRoles}
          departments={uniqueDepartments}
        />
      )}

      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          getRoleIcon={getRoleIcon}
        />
      )}
    </div>
  );
};

export default UserManagement;
