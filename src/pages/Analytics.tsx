
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
  Line
} from 'recharts';
import { TrendingUp, Users, CheckSquare, Clock } from 'lucide-react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { useAuth } from '../context/AuthContext';
import { mockTasks, mockUsers } from '../data/mockData';

const taskStatusData = [
  { name: 'Not Started', value: 12, color: '#6B7280' },
  { name: 'In Progress', value: 25, color: '#3B82F6' },
  { name: 'In Review', value: 8, color: '#F59E0B' },
  { name: 'Completed', value: 35, color: '#10B981' },
];

const teamPerformanceData = [
  { name: 'Week 1', completed: 12, assigned: 18 },
  { name: 'Week 2', completed: 15, assigned: 20 },
  { name: 'Week 3', completed: 18, assigned: 22 },
  { name: 'Week 4', completed: 22, assigned: 25 },
];

const priorityDistribution = [
  { name: 'Low', tasks: 15, percentage: 25 },
  { name: 'Medium', tasks: 20, percentage: 33 },
  { name: 'High', tasks: 18, percentage: 30 },
  { name: 'Urgent', tasks: 7, percentage: 12 },
];

export function Analytics() {
  useAuth();
  
  const totalTasks = mockTasks.length;
  const completedTasks = mockTasks.filter(task => task.status === 'completed').length;
  const activeTasks = mockTasks.filter(task => task.status === 'in_progress').length;
  const teamSize = mockUsers.filter(u => u.status === 'active').length;

  return (
    <div className="px-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-1">
          Track team performance and project insights
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Tasks"
          value={totalTasks}
          icon={CheckSquare}
          color="blue"
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Completed Tasks"
          value={completedTasks}
          icon={TrendingUp}
          color="green"
          trend={{ value: 23, isPositive: true }}
        />
        <StatsCard
          title="Active Tasks"
          value={activeTasks}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Team Members"
          value={teamSize}
          icon={Users}
          color="purple"
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Team Performance Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={teamPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="assigned" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tasks" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Task Completion Rate</span>
              <span className="text-sm font-bold text-green-600">87%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">On-Time Delivery</span>
              <span className="text-sm font-bold text-blue-600">92%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Team Productivity</span>
              <span className="text-sm font-bold text-purple-600">95%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '95%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Quality Score</span>
              <span className="text-sm font-bold text-yellow-600">89%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '89%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}