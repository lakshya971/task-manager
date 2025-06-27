import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Download, 
  Filter, 
  Calendar, 
  User, 
  Activity,
  Eye,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../contexts/SecurityContext';
import { AuditLog, AuditAction } from '../services/audit.service';
import { Permission } from '../types/roles';
import { format } from 'date-fns';

const AuditLogsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { 
    securityStats, 
    exportAuditLogs, 
    getAuditLogs 
  } = useSecurity();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: 'all' as AuditAction | 'all',
    userId: '',
    dateFrom: '',
    dateTo: '',
  });

  const canViewAuditLogs = hasPermission(Permission.VIEW_AUDIT_LOGS);

  useEffect(() => {
    if (canViewAuditLogs) {
      loadAuditLogs();
    }
  }, [canViewAuditLogs, filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const filterOptions: any = {};
      
      if (filters.action !== 'all') filterOptions.action = filters.action;
      if (filters.userId) filterOptions.userId = filters.userId;
      if (filters.dateFrom) filterOptions.dateFrom = new Date(filters.dateFrom);
      if (filters.dateTo) filterOptions.dateTo = new Date(filters.dateTo);

      const auditLogs = await getAuditLogs(filterOptions);
      setLogs(auditLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const csvData = await exportAuditLogs(filters);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'LOGIN_FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'LOGOUT':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'ACCOUNT_LOCKED':
        return <Lock className="h-4 w-4 text-red-500" />;
      case 'ACCOUNT_UNLOCKED':
        return <Unlock className="h-4 w-4 text-green-500" />;
      case 'PERMISSION_DENIED':
      case 'UNAUTHORIZED_ACCESS':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'USER_CREATED':
      case 'USER_UPDATED':
      case 'USER_DELETED':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'TASK_CREATED':
      case 'TASK_UPDATED':
      case 'TASK_DELETED':
        return <Activity className="h-4 w-4 text-purple-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: AuditAction) => {
    if (action.includes('FAILED') || action.includes('DENIED') || action.includes('LOCKED')) {
      return 'text-red-700 bg-red-50';
    }
    if (action.includes('SUCCESS') || action.includes('CREATED') || action.includes('UNLOCKED')) {
      return 'text-green-700 bg-green-50';
    }
    if (action.includes('UPDATED') || action.includes('CHANGED')) {
      return 'text-blue-700 bg-blue-50';
    }
    if (action.includes('DELETED')) {
      return 'text-red-700 bg-red-50';
    }
    return 'text-gray-700 bg-gray-50';
  };

  if (!canViewAuditLogs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to view audit logs.
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
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security & Audit Logs</h1>
            <p className="text-gray-600">Monitor system activity and security events</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </button>
      </div>

      {/* Security Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500">Total Users</dt>
              <dd className="text-2xl font-semibold text-gray-900">{securityStats.totalUsers}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500">Active Users</dt>
              <dd className="text-2xl font-semibold text-gray-900">{securityStats.activeUsers}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500">Recent Logins</dt>
              <dd className="text-2xl font-semibold text-gray-900">{securityStats.recentLoginAttempts}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500">Failed Logins</dt>
              <dd className="text-2xl font-semibold text-gray-900">{securityStats.failedLoginAttempts}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value as AuditAction | 'all' })}
              className="pl-10 w-full rounded-md p-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              <option value="LOGIN_SUCCESS">Login Success</option>
              <option value="LOGIN_FAILED">Login Failed</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_UPDATED">User Updated</option>
              <option value="TASK_CREATED">Task Created</option>
              <option value="TASK_UPDATED">Task Updated</option>
              <option value="PERMISSION_DENIED">Permission Denied</option>
            </select>
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="User ID"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="pl-10 w-full rounded-md p-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="pl-10 w-full rounded-md p-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="pl-10 w-full rounded-md p-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading audit logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getActionIcon(log.action)}
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.userId === 'anonymous' ? 'Anonymous' : log.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
