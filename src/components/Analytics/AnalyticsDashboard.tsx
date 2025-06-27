import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Target,
  Download
} from 'lucide-react';
import { AnalyticsService } from '../../services/analytics.service';
import type { 
  DashboardStats, 
  TeamPerformanceMetrics, 
  TaskAnalytics,
  EmployeePerformanceMetric 
} from '../../types';

interface AnalyticsDashboardProps {
  currentUserId: string;
  userRole: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  currentUserId, 
  userRole 
}) => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformanceMetrics[]>([]);
  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytics | null>(null);
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformanceMetric | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'individual' | 'tasks'>('overview');

  // Determine if user can see team/organization-wide data
  const canViewTeamData = ['DEPARTMENT_HEAD', 'MANAGER', 'ASSISTANT_MANAGER'].includes(userRole);

  useEffect(() => {
    loadDashboardData();
  }, [currentUserId, timeframe]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [stats, analytics, empPerformance] = await Promise.all([
        AnalyticsService.getDashboardStats(currentUserId),
        AnalyticsService.getTaskAnalytics(timeframe),
        AnalyticsService.getEmployeePerformance(currentUserId, timeframe)
      ]);

      setDashboardStats(stats);
      setTaskAnalytics(analytics);
      setEmployeePerformance(empPerformance);

      // Load team data only if user has permission
      if (canViewTeamData) {
        const teamData = await AnalyticsService.getTeamPerformance(timeframe);
        setTeamPerformance(teamData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    const reportData = {
      dashboardStats,
      teamPerformance: canViewTeamData ? teamPerformance : null,
      taskAnalytics,
      employeePerformance,
      timeframe,
      generatedAt: new Date().toISOString()
    };

    const pdfBlob = await AnalyticsService.exportReportAsPDF('dashboard_report', reportData);
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard_report_${timeframe}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportExcel = async () => {
    const reportData = {
      dashboardStats,
      teamPerformance: canViewTeamData ? teamPerformance : null,
      taskAnalytics,
      employeePerformance,
      timeframe
    };

    const excelBlob = await AnalyticsService.exportReportAsExcel('dashboard_report', reportData);
    if (excelBlob) {
      const url = URL.createObjectURL(excelBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard_report_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex items-center gap-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              ...(canViewTeamData ? [{ id: 'team', label: 'Team Performance', icon: Users }] : []),
              { id: 'individual', label: 'Individual Performance', icon: Target },
              { id: 'tasks', label: 'Task Analytics', icon: CheckCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboardStats && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Tasks"
              value={dashboardStats.totalTasks}
              icon={<CheckCircle className="h-8 w-8 text-blue-500" />}
              trend={`${dashboardStats.tasksCompletedThisMonth} this month`}
            />
            <MetricCard
              title="Completed Tasks"
              value={dashboardStats.completedTasks}
              icon={<CheckCircle className="h-8 w-8 text-green-500" />}
              trend={`${Math.round((dashboardStats.completedTasks / dashboardStats.totalTasks) * 100)}% completion rate`}
            />
            <MetricCard
              title="In Progress"
              value={dashboardStats.inProgressTasks}
              icon={<Clock className="h-8 w-8 text-yellow-500" />}
              trend={`${dashboardStats.averageCompletionTime}h avg completion`}
            />
            <MetricCard
              title="Overdue"
              value={dashboardStats.overdueTasks}
              icon={<AlertTriangle className="h-8 w-8 text-red-500" />}
              trend="Needs attention"
            />
          </div>

          {/* Productivity Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Score</h3>
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - dashboardStats.productivityScore / 100)}`}
                    className="text-blue-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                    {dashboardStats.productivityScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Performance Tab */}
      {activeTab === 'team' && canViewTeamData && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Overview</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="teamName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completedTasks" fill="#10B981" name="Completed Tasks" />
                <Bar dataKey="totalTasks" fill="#6B7280" name="Total Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Team Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamPerformance.map(team => (
              <div key={team.teamId} className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{team.teamName}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Members</span>
                    <span className="font-medium">{team.totalMembers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-medium">
                      {Math.round((team.completedTasks / team.totalTasks) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">On-Time Rate</span>
                    <span className="font-medium">{team.onTimeCompletionRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Performance Tab */}
      {activeTab === 'individual' && employeePerformance && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {employeePerformance.tasksCompleted}
                </div>
                <div className="text-gray-600">Tasks Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {employeePerformance.onTimeCompletionRate}%
                </div>
                <div className="text-gray-600">On-Time Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {employeePerformance.averageCompletionTime}h
                </div>
                <div className="text-gray-600">Avg Completion Time</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Analytics Tab */}
      {activeTab === 'tasks' && taskAnalytics && (
        <div className="space-y-6">
          {/* Task Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskAnalytics.tasksByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }) => `${status}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {taskAnalytics.tasksByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskAnalytics.tasksByPriority}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ priority, percentage }) => `${priority}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {taskAnalytics.tasksByPriority.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Trends</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={taskAnalytics.completionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" strokeWidth={2} />
                <Line type="monotone" dataKey="created" stroke="#6B7280" name="Created" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{trend}</p>
      </div>
      <div className="flex-shrink-0">{icon}</div>
    </div>
  </div>
);
