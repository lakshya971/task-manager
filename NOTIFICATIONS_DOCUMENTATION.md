# Notifications and Email System Documentation

## Overview

The Task Manager application now includes a comprehensive notifications and email system that provides:

- **Real-time in-app notifications** for task assignments, updates, and deadlines
- **Automated email alerts** with beautiful, responsive templates
- **SMTP integration** with popular email providers (Gmail, Mailgun, SendGrid)
- **WebSocket-based real-time updates** using Socket.IO
- **Configurable notification preferences** per user
- **Email templates** with branding and variable substitution
- **Audit logging** for all notification activities

## Features

### 🔔 Real-time Notifications
- **In-app notifications** with bell icon and dropdown
- **WebSocket integration** for instant updates
- **Notification history** with read/unread states
- **Priority levels**: Low, Medium, High, Urgent
- **Notification types**: Task assigned, Task updated, Deadline reminder, Video call invitation, etc.

### 📧 Email System
- **Multiple SMTP providers** supported
- **Responsive email templates** with modern design
- **Variable substitution** for personalized content
- **Email delivery tracking** and audit logging
- **Configurable sending preferences** per notification type

### ⚙️ User Preferences
- **Channel selection** (in-app, email, SMS) per notification type
- **Quiet hours** configuration
- **Email digest** settings (daily, weekly, never)
- **Timezone-aware** scheduling

### 📊 Analytics & Monitoring
- **Notification statistics** (sent, read, unread counts)
- **Email delivery rates** and open rates
- **Audit logging** for all notification activities
- **Export functionality** for notification data

## Architecture

### Frontend Components

#### NotificationContext
```typescript
// Provides notification state management
const { 
  notifications, 
  unreadCount, 
  sendNotification, 
  markAsRead,
  preferences,
  updatePreferences 
} = useNotifications();
```

#### NotificationBell Component
- Displays unread count badge
- Dropdown with recent notifications
- Mark as read/delete functionality
- Filtering options (all, unread, by type)

#### Notifications Page
- Complete notification management interface
- Bulk operations (mark all read, delete)
- Notification preferences configuration
- Statistics dashboard

### Backend Services

#### NotificationService
- Handles notification creation and delivery
- Manages user preferences
- Integrates with email service
- WebSocket event handling

#### EmailService
- SMTP configuration for multiple providers
- Template processing with variables
- Delivery tracking and error handling
- Email activity logging

#### WebSocketService
- Real-time notification delivery
- User room management
- Connection handling and reconnection

## Setup Instructions

### 1. Frontend Integration

The notification system is already integrated into your React application:

```typescript
// App.tsx
<AuthProvider>
  <SecurityProvider>
    <NotificationProvider>  {/* Added */}
      <Router>
        <AppRoutes />
      </Router>
    </NotificationProvider>
  </SecurityProvider>
</AuthProvider>
```

### 2. Backend Setup

Use the provided `NOTIFICATION_BACKEND_EXAMPLE.js` as a starting point:

```bash
# Install dependencies
npm install express cors nodemailer socket.io express-rate-limit helmet

# Install optional dependencies for production
npm install node-cron compression morgan winston

# For different email providers
npm install @sendgrid/mail    # SendGrid
npm install mailgun-js        # Mailgun
```

### 3. Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:5174

# Email Provider (choose one)
EMAIL_PROVIDER=gmail

# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password

# Email Settings
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Task Manager
REPLY_TO_EMAIL=support@yourdomain.com

# Database (add your database configuration)
DATABASE_URL=your-database-connection-string
```

### 4. Gmail Setup (Recommended for Development)

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use the 16-digit app password** in `GMAIL_APP_PASSWORD`

### 5. Production Email Providers

#### Mailgun
```env
EMAIL_PROVIDER=mailgun
MAILGUN_SMTP_LOGIN=your-smtp-login
MAILGUN_SMTP_PASSWORD=your-smtp-password
```

#### SendGrid
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key
```

#### Custom SMTP
```env
EMAIL_PROVIDER=custom
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Usage Examples

### Sending Notifications (Frontend)

```typescript
import { useNotifications } from '../contexts/NotificationContext';

function TaskComponent() {
  const { sendNotification } = useNotifications();

  const handleTaskAssignment = async (task, assignedUser) => {
    await sendNotification(
      assignedUser.id,
      NotificationType.TASK_ASSIGNED,
      'New Task Assigned',
      `You have been assigned: "${task.title}"`,
      { taskId: task.id, taskTitle: task.title },
      NotificationPriority.MEDIUM
    );
  };
}
```

### Backend Event Handling

```javascript
// Handle task assignment event
socket.on('task_assigned', async (data) => {
  const { taskId, taskTitle, assignedUserId, dueDate, priority } = data;
  
  await notificationService.sendNotification(
    assignedUserId,
    'task_assigned',
    'New Task Assigned',
    `You have been assigned: "${taskTitle}"`,
    { taskId, taskTitle, dueDate, priority },
    priority === 'high' ? 'high' : 'medium'
  );
});
```

### Custom Email Templates

```javascript
// Add custom email template
notificationService.templates.set('custom_notification', {
  subject: 'Custom Notification: {{title}}',
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h1>{{title}}</h1>
      <p>{{message}}</p>
      <a href="{{actionUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none;">
        Take Action
      </a>
    </div>
  `,
  text: '{{title}} - {{message}} - Action: {{actionUrl}}'
});
```

## API Endpoints

### Notifications API

```http
# Get user notifications
GET /api/notifications/:userId?limit=50&offset=0&unreadOnly=false

# Mark notification as read
PATCH /api/notifications/:notificationId/read
Body: { "userId": "user123" }

# Send test notification
POST /api/notifications/test
Body: {
  "userId": "user123",
  "type": "task_assigned",
  "title": "Test Notification",
  "message": "This is a test",
  "priority": "medium"
}
```

### Email API

```http
# Send test email
POST /api/email/test
Body: {
  "to": "user@example.com",
  "subject": "Test Email",
  "message": "This is a test email"
}

# Health check
GET /api/health
```

## Notification Types

| Type | Description | Default Channels | Priority |
|------|-------------|------------------|----------|
| `task_assigned` | New task assignment | In-app, Email | Medium |
| `task_updated` | Task changes | In-app | Medium |
| `task_completed` | Task completion | In-app | Low |
| `deadline_reminder` | Upcoming deadline | In-app, Email | Medium |
| `task_overdue` | Overdue task | In-app, Email | High |
| `video_call_invitation` | Meeting invite | In-app, Email | High |
| `video_call_starting` | Meeting starting | In-app | High |
| `security_alert` | Security events | In-app, Email | Urgent |

## Email Templates

### Available Templates

1. **Task Assigned** - Notifies user of new task assignment
2. **Task Updated** - Informs about task changes
3. **Deadline Reminder** - Warns about upcoming deadlines
4. **Task Overdue** - Alerts about overdue tasks
5. **Video Call Invitation** - Meeting invitations
6. **Email Digest** - Daily/weekly summary

### Template Variables

Common variables available in all templates:
- `{{userName}}` - Recipient's name
- `{{appUrl}}` - Application URL
- `{{taskTitle}}` - Task title
- `{{taskId}}` - Task ID for links
- `{{dueDate}}` - Formatted due date
- `{{priority}}` - Task priority

## Security Considerations

### Rate Limiting
- **100 requests per 15 minutes** per IP for notification endpoints
- **Connection throttling** for WebSocket connections

### Data Protection
- **No sensitive data** in notification payloads
- **Secure email transmission** using TLS
- **Audit logging** for all notification activities

### Authentication
- **JWT-based authentication** for WebSocket connections
- **User authorization** for notification access
- **Session management** integration

## Troubleshooting

### Common Issues

#### Email Not Sending
1. **Check SMTP credentials** in environment variables
2. **Verify email provider settings** (ports, security)
3. **Check firewall settings** for SMTP ports
4. **Review application logs** for error details

#### Notifications Not Appearing
1. **Verify WebSocket connection** in browser dev tools
2. **Check NotificationProvider** wrapping in App.tsx
3. **Ensure user is authenticated** before notifications
4. **Review browser console** for JavaScript errors

#### Template Not Found
1. **Verify template registration** in backend service
2. **Check notification type mapping** in frontend
3. **Review template key naming** consistency

### Debug Endpoints

```http
# Check service health
GET /api/health

# View notification statistics
GET /api/notifications/:userId/stats

# Test email configuration
POST /api/email/test
```

## Performance Optimization

### Frontend
- **Notification list virtualization** for large datasets
- **Debounced real-time updates** to prevent spam
- **Efficient state management** with context API

### Backend
- **Connection pooling** for database operations
- **Email queue processing** for bulk sending
- **Rate limiting** and request throttling
- **Caching** for frequently accessed data

## Future Enhancements

### Planned Features
- **Push notifications** for mobile devices
- **SMS notifications** via Twilio integration
- **Slack/Teams integration** for team notifications
- **Advanced email analytics** and tracking
- **A/B testing** for email templates
- **Multi-language support** for templates

### Scalability
- **Redis pub/sub** for multi-server WebSocket scaling
- **Message queues** (Bull, Agenda) for reliable delivery
- **Microservices architecture** for notification service
- **CDN integration** for email assets

This notification and email system provides a solid foundation for keeping users informed and engaged with real-time updates and professional email communications.
