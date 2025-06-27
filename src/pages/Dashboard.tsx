
import { 
  CheckSquare, 
  Users, 
  Clock, 
  TrendingUp, 
  Calendar,
  Video,
  Bell,
  ArrowRight
} from 'lucide-react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { TaskCard } from '../components/Tasks/TaskCard';
import { useAuth } from '../context/AuthContext';
import { mockTasks, mockUsers, mockMeetings, mockNotifications } from '../data/mockData';
import { format } from 'date-fns';

export function Dashboard() {
  const { user } = useAuth();
  
  // Filter data based on user role and assignments
  const userTasks = mockTasks.filter(task => 
    task.assigneeId === user?.id || task.assignerId === user?.id
  );
  
  const recentTasks = userTasks.slice(0, 3);
  const upcomingMeetings = mockMeetings.filter(meeting => 
    meeting.participants.includes(user?.id || '')
  ).slice(0, 2);
  
  const userNotifications = mockNotifications.filter(n => 
    n.userId === user?.id && !n.read
  ).slice(0, 3);

  const completedTasks = userTasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = userTasks.filter(task => task.status === 'in_progress').length;
  const teamSize = mockUsers.filter(u => u.managerId === user?.id).length;

  return (
    <div className="px-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your tasks and team today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Tasks"
          value={userTasks.length}
          icon={CheckSquare}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="In Progress"
          value={inProgressTasks}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Completed"
          value={completedTasks}
          icon={TrendingUp}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Team Members"
          value={teamSize}
          icon={Users}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                  View all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {recentTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {recentTasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent tasks</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Video className="h-5 w-5 mr-2 text-blue-600" />
                Upcoming Meetings
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {meeting.title}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(meeting.startTime, 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
              {upcomingMeetings.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming meetings
                </p>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-yellow-600" />
                Notifications
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {userNotifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
              {userNotifications.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No new notifications
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}