import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Trash2, MessageSquare, AlertTriangle, Video } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType, NotificationPriority } from '../../types/notifications';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayedNotifications = showUnreadOnly 
    ? notifications.filter(n => !n.read)
    : notifications.slice(0, 10);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TASK_ASSIGNED:
      case NotificationType.TASK_UPDATED:
        return <MessageSquare className="w-4 h-4" />;
      case NotificationType.DEADLINE_REMINDER:
      case NotificationType.TASK_OVERDUE:
        return <AlertTriangle className="w-4 h-4" />;
      case NotificationType.VIDEO_CALL_INVITATION:
        return <Video className="w-4 h-4" />;
      case NotificationType.SECURITY_ALERT:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };


  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle notification action based on type
    if (notification.data?.taskId) {
      // Navigate to task
      window.location.href = `/tasks/${notification.data.taskId}`;
    } else if (notification.data?.meetingId) {
      // Navigate to meeting
      window.location.href = `/meeting-room/${notification.data.meetingId}`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`text-sm px-3 py-1 rounded-full transition-colors ${
                    showUnreadOnly
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {showUnreadOnly ? 'All' : 'Unread'}
                </button>
                <span className="text-sm text-gray-500">
                  {unreadCount} unread
                </span>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
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
                            <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-600 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
              <a
                href="/notifications"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
