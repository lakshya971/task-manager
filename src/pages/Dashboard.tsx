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
    <div className="space-y-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Here's what's happening with your tasks and team today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Tasks"
          value={userTasks.length}
          icon={CheckSquare}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatsCard
          title="Completed"
          value={completedTasks}
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
          color="green"
        />
        <StatsCard
          title="In Progress"
          value={inProgressTasks}
          icon={Clock}
          trend={{ value: 3, isPositive: false }}
          color="yellow"
        />
        <StatsCard
          title="Team Size"
          value={teamSize}
          icon={Users}
          trend={{ value: 2, isPositive: true }}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent tasks</p>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Video className="mr-2 h-5 w-5 text-blue-600" />
                  Upcoming Meetings
                </h3>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {upcomingMeetings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {meeting.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(meeting.startTime), 'MMM d, h:mm a')}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {meeting.participants.length} participants
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No upcoming meetings</p>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="mr-2 h-5 w-5 text-blue-600" />
                Recent Notifications
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              {userNotifications.length > 0 ? (
                <div className="space-y-4">
                  {userNotifications.map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-blue-600 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No recent notifications</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
