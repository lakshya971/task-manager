// Backend Node.js/Express server for Notifications and Email System
// This file demonstrates how to set up a production-ready notification and email service

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Server } = require('socket.io');
const http = require('http');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);

// CORS configuration for notification system
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5174",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting for notification endpoints
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 notification requests per windowMs
  message: 'Too many notification requests from this IP, please try again later.'
});

// Email Service Configuration
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    // Gmail SMTP Configuration
    if (process.env.EMAIL_PROVIDER === 'gmail') {
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD // Use App Password, not regular password
        }
      });
    }
    // Mailgun Configuration
    else if (process.env.EMAIL_PROVIDER === 'mailgun') {
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAILGUN_SMTP_LOGIN,
          pass: process.env.MAILGUN_SMTP_PASSWORD
        }
      });
    }
    // SendGrid Configuration
    else if (process.env.EMAIL_PROVIDER === 'sendgrid') {
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    }
    // Custom SMTP Configuration
    else {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }

    // Verify transporter configuration
    try {
      await this.transporter.verify();
      console.log('✅ Email service configured successfully');
    } catch (error) {
      console.error('❌ Email service configuration failed:', error);
    }
  }

  async sendEmail({ to, subject, html, text, attachments = [] }) {
    try {
      const mailOptions = {
        from: `${process.env.FROM_NAME || 'Task Manager'} <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html,
        text,
        attachments,
        replyTo: process.env.REPLY_TO_EMAIL
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', result.messageId);
      
      // Log email activity
      await this.logEmailActivity({
        to,
        subject,
        messageId: result.messageId,
        status: 'sent',
        timestamp: new Date()
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      
      // Log failed email
      await this.logEmailActivity({
        to,
        subject,
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      });

      return { success: false, error: error.message };
    }
  }

  async logEmailActivity(activity) {
    // Store email activity in database for audit purposes
    // This would typically save to your database
    console.log('📝 Email activity logged:', activity);
  }
}

// Notification Service
class NotificationService {
  constructor(io, emailService) {
    this.io = io;
    this.emailService = emailService;
    this.notifications = new Map(); // In production, use a database
    this.templates = new Map();
    this.loadEmailTemplates();
  }

  async sendNotification(userId, type, title, message, data = {}, priority = 'medium') {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      data,
      priority,
      read: false,
      createdAt: new Date(),
      channels: await this.getUserNotificationChannels(userId, type)
    };

    // Store notification
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId).unshift(notification);

    // Send real-time notification via WebSocket
    this.io.to(`user_${userId}`).emit('notification', { notification });

    // Send email notification if enabled
    if (notification.channels.includes('email')) {
      await this.sendEmailNotification(notification);
    }

    // Log notification activity
    console.log(`📲 Notification sent: ${type} to user ${userId}`);

    return notification;
  }

  async sendEmailNotification(notification) {
    try {
      const user = await this.getUserById(notification.userId);
      if (!user || !user.email) return;

      const template = this.templates.get(notification.type);
      if (!template) {
        console.warn(`No email template found for notification type: ${notification.type}`);
        return;
      }

      const emailContent = this.processEmailTemplate(template, {
        userName: user.name,
        ...notification.data,
        appUrl: process.env.FRONTEND_URL || 'http://localhost:5174'
      });

      await this.emailService.sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });

    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  async getUserNotificationChannels(userId, type) {
    // Get user's notification preferences from database
    // For demo, return default channels
    const defaultChannels = ['in_app'];
    
    // Add email for important notifications
    if (['task_assigned', 'deadline_reminder', 'task_overdue', 'video_call_invitation'].includes(type)) {
      defaultChannels.push('email');
    }

    return defaultChannels;
  }

  async getUserById(userId) {
    // In production, fetch from database
    // For demo, return mock user
    return {
      id: userId,
      name: 'Demo User',
      email: 'demo@example.com'
    };
  }

  processEmailTemplate(template, variables) {
    let subject = template.subject;
    let html = template.html;
    let text = template.text;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const stringValue = String(value);
      
      subject = subject.replace(regex, stringValue);
      html = html.replace(regex, stringValue);
      text = text.replace(regex, stringValue);
    });

    return { subject, html, text };
  }

  loadEmailTemplates() {
    // Task Assigned Template
    this.templates.set('task_assigned', {
      subject: 'New Task Assigned: {{taskTitle}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Task Assigned</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <p>Hi {{userName}},</p>
            <p>You have been assigned a new task:</p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">{{taskTitle}}</h3>
              <p style="margin: 0 0 15px 0; color: #666;">{{taskDescription}}</p>
              <div><strong>Due Date:</strong> {{dueDate}}</div>
              <div><strong>Priority:</strong> {{priority}}</div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{appUrl}}/tasks/{{taskId}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Task</a>
            </div>
          </div>
        </div>
      `,
      text: `Hi {{userName}}, You have been assigned a new task: {{taskTitle}}. Due: {{dueDate}}. Priority: {{priority}}. View at: {{appUrl}}/tasks/{{taskId}}`
    });

    // Add more templates...
    console.log('📧 Email templates loaded');
  }
}

// Initialize services
const emailService = new EmailService();
const notificationService = new NotificationService(io, emailService);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join user-specific room
  socket.on('join_user_room', ({ userId }) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their notification room`);
  });

  // Handle task-related events
  socket.on('task_assigned', async (data) => {
    const { taskId, taskTitle, assignedUserId, assignedByUserId, dueDate, priority } = data;
    
    await notificationService.sendNotification(
      assignedUserId,
      'task_assigned',
      'New Task Assigned',
      `You have been assigned: "${taskTitle}"`,
      { taskId, taskTitle, dueDate, priority },
      priority === 'high' ? 'high' : 'medium'
    );
  });

  socket.on('task_updated', async (data) => {
    const { taskId, taskTitle, assignedUserId, updatedBy, changes } = data;
    
    await notificationService.sendNotification(
      assignedUserId,
      'task_updated',
      'Task Updated',
      `Task "${taskTitle}" has been updated`,
      { taskId, taskTitle, changes, updatedBy }
    );
  });

  socket.on('deadline_reminder', async (data) => {
    const { taskId, taskTitle, assignedUserId, dueDate, reminderType } = data;
    
    await notificationService.sendNotification(
      assignedUserId,
      reminderType === 'overdue' ? 'task_overdue' : 'deadline_reminder',
      reminderType === 'overdue' ? 'Task Overdue' : 'Deadline Approaching',
      reminderType === 'overdue' 
        ? `Task "${taskTitle}" is overdue`
        : `Task "${taskTitle}" is due soon`,
      { taskId, taskTitle, dueDate },
      reminderType === 'overdue' ? 'high' : 'medium'
    );
  });

  socket.on('video_call_invite', async (data) => {
    const { meetingId, title, invitedUserIds, organizerId, scheduledTime } = data;
    
    for (const userId of invitedUserIds) {
      await notificationService.sendNotification(
        userId,
        'video_call_invitation',
        'Video Call Invitation',
        `You've been invited to "${title}"`,
        { meetingId, title, organizerId, scheduledTime },
        'high'
      );
    }
  });

  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// REST API Endpoints
app.use('/api/notifications', notificationLimiter);

// Get user notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    const userNotifications = notificationService.notifications.get(userId) || [];
    let filteredNotifications = unreadOnly === 'true' 
      ? userNotifications.filter(n => !n.read)
      : userNotifications;
    
    const paginatedNotifications = filteredNotifications.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: paginatedNotifications,
      total: filteredNotifications.length,
      unreadCount: userNotifications.filter(n => !n.read).length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
app.patch('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    
    const userNotifications = notificationService.notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send test notification
app.post('/api/notifications/test', async (req, res) => {
  try {
    const { userId, type, title, message, data, priority } = req.body;
    
    const notification = await notificationService.sendNotification(
      userId, type, title, message, data, priority
    );
    
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send test email
app.post('/api/email/test', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    const result = await emailService.sendEmail({
      to,
      subject: subject || 'Test Email from Task Manager',
      html: `<h1>Test Email</h1><p>${message || 'This is a test email from your task management system.'}</p>`,
      text: message || 'This is a test email from your task management system.'
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      email: emailService.transporter ? 'connected' : 'disconnected',
      websocket: io.sockets.sockets.size + ' clients connected'
    }
  });
});

// Scheduled tasks (using node-cron in production)
function setupScheduledTasks() {
  // Example: Send deadline reminders every hour
  setInterval(async () => {
    console.log('🔔 Checking for deadline reminders...');
    // In production, query database for tasks with upcoming deadlines
    // and send reminder notifications
  }, 60 * 60 * 1000); // Every hour

  // Example: Send daily email digest
  setInterval(async () => {
    console.log('📧 Sending daily email digests...');
    // In production, send email digests to users who have enabled them
  }, 24 * 60 * 60 * 1000); // Every 24 hours
}

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message 
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Notification server running on port ${PORT}`);
  console.log(`📧 Email provider: ${process.env.EMAIL_PROVIDER || 'default SMTP'}`);
  setupScheduledTasks();
});

// Environment variables needed:
/*
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:5174

# Email Configuration (choose one)
EMAIL_PROVIDER=gmail|mailgun|sendgrid|custom

# Gmail SMTP
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Mailgun SMTP
MAILGUN_SMTP_LOGIN=your-smtp-login
MAILGUN_SMTP_PASSWORD=your-smtp-password

# SendGrid
SENDGRID_API_KEY=your-api-key

# Custom SMTP
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password

# Email settings
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Task Manager
REPLY_TO_EMAIL=support@yourdomain.com

# Database connection (add your database config)
DATABASE_URL=your-database-connection-string
*/
