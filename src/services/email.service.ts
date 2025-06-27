import { EmailTemplate, EmailConfiguration } from '../types/notifications';
import { Task } from '../types';
import { User } from '../types/roles';
import { mockUsers } from '../data/mockData';

export class EmailService {
  private static configuration: EmailConfiguration = {
    provider: 'gmail', // Default to Gmail SMTP
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: import.meta.env?.VITE_EMAIL_USER || '',
        pass: import.meta.env?.VITE_EMAIL_PASS || '',
      },
    },
    fromEmail: import.meta.env?.VITE_FROM_EMAIL || 'noreply@taskmanager.com',
    fromName: import.meta.env?.VITE_FROM_NAME || 'Task Manager',
    replyTo: import.meta.env?.VITE_REPLY_TO_EMAIL || '',
  };

  private static templates: Map<string, EmailTemplate> = new Map();

  /**
   * Initialize email service
   */
  static initialize() {
    this.loadEmailTemplates();
  }

  /**
   * Configure email provider
   */
  static configure(config: Partial<EmailConfiguration>) {
    this.configuration = { ...this.configuration, ...config };
  }

  /**
   * Send task assigned email
   */
  static async sendTaskAssignedEmail(task: Task, assignedUser: User, assignedBy: User): Promise<boolean> {
    const template = this.templates.get('task_assigned');
    if (!template) {
      console.warn('Task assigned email template not found');
      return false;
    }

    const variables = {
      assignedUserName: assignedUser.name,
      taskTitle: task.title,
      taskDescription: task.description,
      assignedByName: assignedBy.name,
      dueDate: this.formatDate(task.dueDate),
      priority: task.priority.toUpperCase(),
      taskUrl: `${window.location.origin}/tasks/${task.id}`,
    };

    const emailContent = this.processTemplate(template, variables);

    return this.sendEmail({
      to: assignedUser.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
  }

  /**
   * Send task updated email
   */
  static async sendTaskUpdatedEmail(
    task: Task,
    userId: string,
    updatedBy: User,
    changes: string[]
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return false;

    const template = this.templates.get('task_updated');
    if (!template) {
      console.warn('Task updated email template not found');
      return false;
    }

    const variables = {
      userName: user.name,
      taskTitle: task.title,
      updatedByName: updatedBy.name,
      changes: changes.join(', '),
      changesList: changes.map(change => `<li>${change}</li>`).join(''),
      taskUrl: `${window.location.origin}/tasks/${task.id}`,
      updateDate: this.formatDate(new Date()),
    };

    const emailContent = this.processTemplate(template, variables);

    return this.sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
  }

  /**
   * Send deadline reminder email
   */
  static async sendDeadlineReminderEmail(
    task: Task,
    userId: string,
    reminderType: 'upcoming' | 'overdue'
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return false;

    const templateKey = reminderType === 'upcoming' ? 'deadline_reminder' : 'task_overdue';
    const template = this.templates.get(templateKey);
    if (!template) {
      console.warn(`${templateKey} email template not found`);
      return false;
    }

    const variables = {
      userName: user.name,
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: this.formatDate(task.dueDate),
      priority: task.priority.toUpperCase(),
      taskUrl: `${window.location.origin}/tasks/${task.id}`,
      isOverdue: reminderType === 'overdue',
      urgencyClass: reminderType === 'overdue' ? 'urgent' : 'warning',
    };

    const emailContent = this.processTemplate(template, variables);

    return this.sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
  }

  /**
   * Send video call invitation email
   */
  static async sendVideoCallInvitationEmail(
    meetingId: string,
    title: string,
    scheduledTime: Date,
    userId: string,
    organizer: User
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return false;

    const template = this.templates.get('video_call_invitation');
    if (!template) {
      console.warn('Video call invitation email template not found');
      return false;
    }

    const variables = {
      userName: user.name,
      meetingTitle: title,
      organizerName: organizer.name,
      scheduledDate: this.formatDate(scheduledTime),
      scheduledTime: this.formatTime(scheduledTime),
      meetingUrl: `${window.location.origin}/meeting-room/${meetingId}`,
      joinUrl: `${window.location.origin}/meeting-room/${meetingId}`,
    };

    const emailContent = this.processTemplate(template, variables);

    return this.sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
  }

  /**
   * Send email digest
   */
  static async sendEmailDigest(userId: string, notifications: any[]): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return false;

    const template = this.templates.get('email_digest');
    if (!template) {
      console.warn('Email digest template not found');
      return false;
    }

    const variables = {
      userName: user.name,
      notificationCount: notifications.length,
      notifications: notifications.map(n => ({
        title: n.title,
        message: n.message,
        type: n.type,
        createdAt: this.formatDate(n.createdAt),
      })),
      digestDate: this.formatDate(new Date()),
      unsubscribeUrl: `${window.location.origin}/settings?section=notifications`,
    };

    const emailContent = this.processTemplate(template, variables);

    return this.sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
  }

  /**
   * Send email (mock implementation for frontend)
   */
  private static async sendEmail(emailData: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<boolean> {
    // In a real application, this would send the email via the backend API
    console.log('📧 Email would be sent:', {
      provider: this.configuration.provider,
      to: emailData.to,
      subject: emailData.subject,
      from: `${this.configuration.fromName} <${this.configuration.fromEmail}>`,
      replyTo: this.configuration.replyTo,
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would return the actual success status
    return true;
  }

  /**
   * Process email template with variables
   */
  private static processTemplate(template: EmailTemplate, variables: Record<string, any>): {
    subject: string;
    html: string;
    text: string;
  } {
    let subject = template.subject;
    let html = template.htmlContent;
    let text = template.textContent;

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const stringValue = Array.isArray(value) ? value.join(', ') : String(value);
      
      subject = subject.replace(regex, stringValue);
      html = html.replace(regex, stringValue);
      text = text.replace(regex, stringValue);
    });

    return { subject, html, text };
  }

  /**
   * Format date for email templates
   */
  private static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Format time for email templates
   */
  private static formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  }

  /**
   * Load default email templates
   */
  private static loadEmailTemplates() {
    // Task Assigned Template
    this.templates.set('task_assigned', {
      id: 'task_assigned',
      name: 'Task Assigned',
      subject: 'New Task Assigned: {{taskTitle}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Task Assigned</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <p>Hi {{assignedUserName}},</p>
            <p>You have been assigned a new task by {{assignedByName}}:</p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">{{taskTitle}}</h3>
              <p style="margin: 0 0 15px 0; color: #666;">{{taskDescription}}</p>
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div><strong>Priority:</strong> <span style="color: #dc3545;">{{priority}}</span></div>
                <div><strong>Due Date:</strong> {{dueDate}}</div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{taskUrl}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Task</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Need help? Reply to this email or contact your team lead.
            </p>
          </div>
        </div>
      `,
      textContent: `
Hi {{assignedUserName}},

You have been assigned a new task by {{assignedByName}}:

Task: {{taskTitle}}
Description: {{taskDescription}}
Priority: {{priority}}
Due Date: {{dueDate}}

View the task at: {{taskUrl}}

Need help? Reply to this email or contact your team lead.
      `,
      variables: ['assignedUserName', 'taskTitle', 'taskDescription', 'assignedByName', 'dueDate', 'priority', 'taskUrl'],
      type: 'task_assigned' as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Task Updated Template
    this.templates.set('task_updated', {
      id: 'task_updated',
      name: 'Task Updated',
      subject: 'Task Updated: {{taskTitle}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Task Updated</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <p>Hi {{userName}},</p>
            <p>Your task "{{taskTitle}}" has been updated by {{updatedByName}} on {{updateDate}}.</p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
              <h4 style="margin: 0 0 15px 0; color: #333;">Changes Made:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                {{changesList}}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{taskUrl}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Task</a>
            </div>
          </div>
        </div>
      `,
      textContent: `
Hi {{userName}},

Your task "{{taskTitle}}" has been updated by {{updatedByName}} on {{updateDate}}.

Changes Made: {{changes}}

View the task at: {{taskUrl}}
      `,
      variables: ['userName', 'taskTitle', 'updatedByName', 'changes', 'changesList', 'taskUrl', 'updateDate'],
      type: 'task_updated' as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Deadline Reminder Template
    this.templates.set('deadline_reminder', {
      id: 'deadline_reminder',
      name: 'Deadline Reminder',
      subject: 'Deadline Approaching: {{taskTitle}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 30px; text-align: center;">
            <h1 style="color: #d63384; margin: 0; font-size: 24px;">⏰ Deadline Approaching</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <p>Hi {{userName}},</p>
            <p>This is a friendly reminder that your task deadline is approaching:</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #856404;">{{taskTitle}}</h3>
              <p style="margin: 0 0 15px 0; color: #856404;">{{taskDescription}}</p>
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div><strong>Priority:</strong> <span style="color: #dc3545;">{{priority}}</span></div>
                <div><strong>Due Date:</strong> <span style="color: #dc3545;">{{dueDate}}</span></div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{taskUrl}}" style="background: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Task</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Don't let deadlines sneak up on you! Plan ahead and stay organized.
            </p>
          </div>
        </div>
      `,
      textContent: `
Hi {{userName}},

This is a friendly reminder that your task deadline is approaching:

Task: {{taskTitle}}
Description: {{taskDescription}}
Priority: {{priority}}
Due Date: {{dueDate}}

View the task at: {{taskUrl}}

Don't let deadlines sneak up on you! Plan ahead and stay organized.
      `,
      variables: ['userName', 'taskTitle', 'taskDescription', 'priority', 'dueDate', 'taskUrl'],
      type: 'deadline_reminder' as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Task Overdue Template
    this.templates.set('task_overdue', {
      id: 'task_overdue',
      name: 'Task Overdue',
      subject: 'URGENT: Task Overdue - {{taskTitle}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚨 TASK OVERDUE</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <p>Hi {{userName}},</p>
            <p><strong>URGENT:</strong> Your task is now overdue and requires immediate attention:</p>
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #721c24;">{{taskTitle}}</h3>
              <p style="margin: 0 0 15px 0; color: #721c24;">{{taskDescription}}</p>
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div><strong>Priority:</strong> <span style="color: #dc3545;">{{priority}}</span></div>
                <div><strong>Was Due:</strong> <span style="color: #dc3545;">{{dueDate}}</span></div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{taskUrl}}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Complete Task Now</a>
            </div>
            
            <p style="color: #721c24; font-size: 14px; font-weight: bold;">
              Please complete this task as soon as possible or contact your manager if you need assistance.
            </p>
          </div>
        </div>
      `,
      textContent: `
Hi {{userName}},

URGENT: Your task is now overdue and requires immediate attention:

Task: {{taskTitle}}
Description: {{taskDescription}}
Priority: {{priority}}
Was Due: {{dueDate}}

Complete the task at: {{taskUrl}}

Please complete this task as soon as possible or contact your manager if you need assistance.
      `,
      variables: ['userName', 'taskTitle', 'taskDescription', 'priority', 'dueDate', 'taskUrl'],
      type: 'task_overdue' as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Video Call Invitation Template
    this.templates.set('video_call_invitation', {
      id: 'video_call_invitation',
      name: 'Video Call Invitation',
      subject: 'Video Call Invitation: {{meetingTitle}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📹 Video Call Invitation</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <p>Hi {{userName}},</p>
            <p>{{organizerName}} has invited you to a video call:</p>
            
            <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1976d2;">{{meetingTitle}}</h3>
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div><strong>Date:</strong> {{scheduledDate}}</div>
                <div><strong>Time:</strong> {{scheduledTime}}</div>
                <div><strong>Organizer:</strong> {{organizerName}}</div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{joinUrl}}" style="background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Join Meeting</a>
            </div>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Meeting Link:</p>
              <a href="{{meetingUrl}}" style="color: #2196f3; word-break: break-all;">{{meetingUrl}}</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Make sure to test your camera and microphone before the meeting starts.
            </p>
          </div>
        </div>
      `,
      textContent: `
Hi {{userName}},

{{organizerName}} has invited you to a video call:

Meeting: {{meetingTitle}}
Date: {{scheduledDate}}
Time: {{scheduledTime}}
Organizer: {{organizerName}}

Join the meeting at: {{joinUrl}}

Make sure to test your camera and microphone before the meeting starts.
      `,
      variables: ['userName', 'meetingTitle', 'organizerName', 'scheduledDate', 'scheduledTime', 'joinUrl', 'meetingUrl'],
      type: 'video_call_invitation' as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
