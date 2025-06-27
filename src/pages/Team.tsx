import { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Mail, Phone, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockUsers } from '../data/mockData';
import { roleLabels, roleColors, canCreateRole } from '../utils/roleUtils';
import { UserRole } from '../types';

export function Team() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // Filter team members based on user's role and hierarchy
  const teamMembers = mockUsers.filter(member => {
    // Show direct reports and subordinates
    if (member.managerId === user?.id) return true;
    
    // For higher roles, show more team members
    if (user && user.role === ('department_head' as UserRole)) return true;
    if (user && user.role === ('manager' as UserRole) && ['assistant_manager', 'team_lead', 'employee'].includes(member.role)) return true;
    if (user && user.role === ('assistant_manager' as UserRole) && ['team_lead', 'employee'].includes(member.role)) return true;
    
    return false;
  });

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const creatableRoles = user ? ['manager', 'assistant_manager', 'team_lead', 'employee'].filter(role => 
    canCreateRole(user.role, role as UserRole)
  ) as UserRole[] : [];

  return (
    <div className="px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your team members and their roles
          </p>
        </div>
        {creatableRoles.length > 0 && (
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Team Member
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="manager">Manager</option>
              <option value="assistant_manager">Assistant Manager</option>
              <option value="team_lead">Team Lead</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{member.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[member.role]}`}>
                    {roleLabels[member.role]}
                  </span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {member.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">📍</span>
                {member.department}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Status: <span className={`font-medium ${member.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {member.status}
                </span>
              </span>
              <span>
                Joined: {member.createdAt.toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Profile
                </button>
                <button className="text-gray-500 hover:text-gray-600 text-sm font-medium">
                  Message
                </button>
              </div>
              <div className="flex items-center space-x-1">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Mail className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Phone className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Plus className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || roleFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Start building your team by adding new members.'}
          </p>
          {creatableRoles.length > 0 && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <UserPlus className="h-4 w-4 mr-2" />
              Add First Team Member
            </button>
          )}
        </div>
      )}
    </div>
  );
}