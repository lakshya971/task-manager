import type { User, UserDirectory, UserInvitation } from '../types';

export class UserManagementService {
  private static baseURL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

  /**
   * Get user directory with filters and pagination
   */
  static async getUserDirectory(params: {
    page?: number;
    limit?: number;
    role?: string;
    department?: string;
    status?: string;
    search?: string;
  }): Promise<UserDirectory> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.role) queryParams.append('role', params.role);
      if (params.department) queryParams.append('department', params.department);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);

      const response = await fetch(`${this.baseURL}/users/directory?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user directory:', error);
      return {
        users: [],
        totalCount: 0,
        filters: {
          roles: [],
          departments: [],
          statuses: []
        },
        pagination: {
          page: 1,
          limit: 20,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Send user invitation
   */
  static async sendInvitation(invitation: {
    email: string;
    role: string;
    invitedBy: string;
  }): Promise<{ success: boolean; message: string; invitation?: UserInvitation }> {
    try {
      const response = await fetch(`${this.baseURL}/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitation),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: data.message,
        invitation: data.invitation
      };
    } catch (error) {
      console.error('Error sending invitation:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send invitation'
      };
    }
  }

  /**
   * Update user status (activate/deactivate)
   */
  static async updateUserStatus(
    userId: string, 
    status: 'active' | 'inactive', 
    updatedBy: string
  ): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, updatedBy }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: data.message,
        user: data.user
      };
    } catch (error) {
      console.error('Error updating user status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user status'
      };
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(
    userId: string, 
    role: string, 
    updatedBy: string
  ): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, updatedBy }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: data.message,
        user: data.user
      };
    } catch (error) {
      console.error('Error updating user role:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user role'
      };
    }
  }

  /**
   * Activate user account
   */
  static async activateUser(userId: string, updatedBy: string): Promise<{ success: boolean; message: string }> {
    return this.updateUserStatus(userId, 'active', updatedBy);
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(userId: string, updatedBy: string): Promise<{ success: boolean; message: string }> {
    return this.updateUserStatus(userId, 'inactive', updatedBy);
  }

  /**
   * Bulk invite users from CSV or array
   */
  static async bulkInviteUsers(invitations: Array<{
    email: string;
    role: string;
    department?: string;
  }>, invitedBy: string): Promise<{
    success: boolean;
    results: Array<{
      email: string;
      success: boolean;
      message: string;
    }>;
  }> {
    const results = [];

    for (const invitation of invitations) {
      const result = await this.sendInvitation({
        ...invitation,
        invitedBy
      });

      results.push({
        email: invitation.email,
        success: result.success,
        message: result.message
      });

      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount > 0,
      results
    };
  }

  /**
   * Generate invitation link (for sharing)
   */
  static generateInvitationLink(invitationToken: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth/accept-invitation?token=${invitationToken}`;
  }

  /**
   * Search users with advanced filters
   */
  static async searchUsers(query: string, filters?: {
    roles?: string[];
    departments?: string[];
    statuses?: string[];
  }): Promise<User[]> {
    try {
      const params = {
        search: query,
        role: filters?.roles?.join(','),
        department: filters?.departments?.join(','),
        status: filters?.statuses?.join(','),
        limit: 50 // Higher limit for search results
      };

      const directory = await this.getUserDirectory(params);
      return directory.users;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByRole: Array<{ role: string; count: number }>;
    usersByDepartment: Array<{ department: string; count: number }>;
  }> {
    try {
      // This would typically be a dedicated endpoint, but for now we'll calculate from directory
      const directory = await this.getUserDirectory({ limit: 1000 }); // Get all users
      
      const totalUsers = directory.totalCount;
      const activeUsers = directory.users.filter(u => u.status === 'active').length;
      const inactiveUsers = totalUsers - activeUsers;

      // Group by role
      const roleGroups = directory.users.reduce((groups, user) => {
        const role = user.role;
        groups[role] = (groups[role] || 0) + 1;
        return groups;
      }, {} as Record<string, number>);

      const usersByRole = Object.entries(roleGroups).map(([role, count]) => ({ role, count }));

      // Group by department
      const deptGroups = directory.users.reduce((groups, user) => {
        const dept = user.department || 'Unassigned';
        groups[dept] = (groups[dept] || 0) + 1;
        return groups;
      }, {} as Record<string, number>);

      const usersByDepartment = Object.entries(deptGroups).map(([department, count]) => ({ department, count }));

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        usersByDepartment
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        usersByRole: [],
        usersByDepartment: []
      };
    }
  }
}
