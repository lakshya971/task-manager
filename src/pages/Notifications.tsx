import { useState } from 'react';
import { 
  Bell, 
  Settings, 
  Check, 
  Trash2, 
  Filter, 
  Download,
  MessageSquare,
  AlertTriangle,
  Video,
  Mail,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationType, NotificationPriority, NotificationChannel } from '../types/notifications';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    updatePreferences,
    stats,
    isLoading,
  } = useNotifications();

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TASK_ASSIGNED:
      case NotificationType.TASK_UPDATED:
        return <MessageSquare className="w-5 h-5" />;
      case NotificationType.DEADLINE_REMINDER:
      case NotificationType.TASK_OVERDUE:
        return <AlertTriangle className="w-5 h-5" />;
      case NotificationType.VIDEO_CALL_INVITATION:
        return <Video className="w-5 h-5" />;
      case NotificationType.SECURITY_ALERT:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };


  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleBulkAction = async (action: 'read' | 'delete') => {
    for (const notificationId of selectedNotifications) {
      if (action === 'read') {
        await markAsRead(notificationId);
      } else {
        await deleteNotification(notificationId);
      }
    }
    setSelectedNotifications([]);
  };

  const handlePreferenceChange = (
    type: NotificationType,
    channels: NotificationChannel[]
  ) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      channels: {
        ...preferences.channels,
        [type]: channels,
      },
    };

    updatePreferences(updatedPreferences);
  };

  const exportNotifications = () => {
    const data = notifications.map(n => ({
      title: n.title,
      message: n.message,
      type: n.type,
      priority: n.priority,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">Stay up to date with your tasks and activities</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={exportNotifications}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-blue-600" />
                <span className="ml-2 text-sm font-medium text-gray-600">Total</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalSent}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="ml-2 text-sm font-medium text-gray-600">Read</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalRead}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="ml-2 text-sm font-medium text-gray-600">Unread</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalUnread}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-purple-600" />
                <span className="ml-2 text-sm font-medium text-gray-600">Email Rate</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.openRate.toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Preferences
          </button>
        </nav>
      </div>

      {activeTab === 'notifications' ? (
        <div className="space-y-6">
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All notifications</option>
                  <option value="unread">Unread only ({unreadCount})</option>
                  <option value={NotificationType.TASK_ASSIGNED}>Task assignments</option>
                  <option value={NotificationType.TASK_UPDATED}>Task updates</option>
                  <option value={NotificationType.DEADLINE_REMINDER}>Deadline reminders</option>
                  <option value={NotificationType.VIDEO_CALL_INVITATION}>Video calls</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {selectedNotifications.length > 0 && (
                <>
                  <button
                    onClick={() => handleBulkAction('read')}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark Read ({selectedNotifications.length})</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete ({selectedNotifications.length})</span>
                  </button>
                </>
              )}
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">
                  {filter === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />

                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.priority === NotificationPriority.URGENT
                          ? 'bg-red-100 text-red-600'
                          : notification.priority === NotificationPriority.HIGH
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-lg ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDateTime(notification.createdAt)}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              notification.priority === NotificationPriority.URGENT
                                ? 'bg-red-100 text-red-800'
                                : notification.priority === NotificationPriority.HIGH
                                ? 'bg-orange-100 text-orange-800'
                                : notification.priority === NotificationPriority.MEDIUM
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.priority}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              {notification.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        // Preferences Tab
        <div className="space-y-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
            </div>

            {preferences && (
              <div className="space-y-6">
                {/* Notification Types */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
                  <div className="space-y-4">
                    {Object.values(NotificationType).map((type) => (
                      <div key={type} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">
                            {type.replace('_', ' ')}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Choose how you want to receive these notifications
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          {Object.values(NotificationChannel).map((channel) => (
                            <label key={channel} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={preferences.channels[type]?.includes(channel) || false}
                                onChange={(e) => {
                                  const currentChannels = preferences.channels[type] || [];
                                  const newChannels = e.target.checked
                                    ? [...currentChannels, channel]
                                    : currentChannels.filter(c => c !== channel);
                                  handlePreferenceChange(type, newChannels);
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 capitalize">
                                {channel.replace('_', ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quiet Hours */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quiet Hours</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={preferences.quietHours?.enabled || false}
                        onChange={(e) => {
                          const updatedPreferences = {
                            ...preferences,
                            quietHours: {
                              ...preferences.quietHours!,
                              enabled: e.target.checked,
                            },
                          };
                          updatePreferences(updatedPreferences);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Enable quiet hours</span>
                        <p className="text-sm text-gray-500">
                          Reduce notifications during specified hours
                        </p>
                      </div>
                    </label>
                    
                    {preferences.quietHours?.enabled && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start time
                          </label>
                          <input
                            type="time"
                            value={preferences.quietHours.start}
                            onChange={(e) => {
                              const updatedPreferences = {
                                ...preferences,
                                quietHours: {
                                  ...preferences.quietHours!,
                                  start: e.target.value,
                                },
                              };
                              updatePreferences(updatedPreferences);
                            }}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End time
                          </label>
                          <input
                            type="time"
                            value={preferences.quietHours.end}
                            onChange={(e) => {
                              const updatedPreferences = {
                                ...preferences,
                                quietHours: {
                                  ...preferences.quietHours!,
                                  end: e.target.value,
                                },
                              };
                              updatePreferences(updatedPreferences);
                            }}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Digest */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Email Digest</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={preferences.emailDigest?.enabled || false}
                        onChange={(e) => {
                          const updatedPreferences = {
                            ...preferences,
                            emailDigest: {
                              ...preferences.emailDigest!,
                              enabled: e.target.checked,
                            },
                          };
                          updatePreferences(updatedPreferences);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Enable email digest</span>
                        <p className="text-sm text-gray-500">
                          Receive a summary of notifications via email
                        </p>
                      </div>
                    </label>
                    
                    {preferences.emailDigest?.enabled && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frequency
                          </label>
                          <select
                            value={preferences.emailDigest.frequency}
                            onChange={(e) => {
                              const updatedPreferences = {
                                ...preferences,
                                emailDigest: {
                                  ...preferences.emailDigest!,
                                  frequency: e.target.value as 'daily' | 'weekly' | 'never',
                                },
                              };
                              updatePreferences(updatedPreferences);
                            }}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="never">Never</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time
                          </label>
                          <input
                            type="time"
                            value={preferences.emailDigest.time}
                            onChange={(e) => {
                              const updatedPreferences = {
                                ...preferences,
                                emailDigest: {
                                  ...preferences.emailDigest!,
                                  time: e.target.value,
                                },
                              };
                              updatePreferences(updatedPreferences);
                            }}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
