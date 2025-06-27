const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173"
}));
app.use(express.json());

// MongoDB connection
let db;
let client;

async function connectToDatabase() {
  try {
    client = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017');
    await client.connect();
    db = client.db(process.env.DB_NAME || 'taskmanager');
    console.log('✅ Connected to MongoDB');
    
    // Test the connection
    await db.admin().ping();
    console.log('📊 Database ping successful');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('📤 User disconnected:', socket.id);
  });
  
  // Join user to their personal room for notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });
});

// Utility function to broadcast notifications
function broadcastNotification(userId, notification) {
  io.to(`user_${userId}`).emit('new_notification', notification);
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await db.admin().ping();
    const collections = await db.listCollections().toArray();
    
    res.json({
      status: 'healthy',
      database: process.env.DB_NAME || 'taskmanager',
      collections: collections.map(col => col.name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== TASK ROUTES ====================

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { assigneeId, status, priority } = req.query;
    const filter = {};
    
    if (assigneeId) filter.assigneeId = assigneeId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    const tasks = await db.collection('tasks')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
      
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await db.collection('tasks').findOne({ id: req.params.id });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new task
app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = {
      ...req.body,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Validate required fields
    if (!newTask.title || !newTask.assigneeId) {
      return res.status(400).json({ 
        error: 'Missing required fields: title and assigneeId are required' 
      });
    }
    
    await db.collection('tasks').insertOne(newTask);
    
    // Create notification for assignee
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: newTask.assigneeId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${newTask.title}`,
      isRead: false,
      createdAt: new Date(),
      data: { taskId: newTask.id }
    };
    
    await db.collection('notifications').insertOne(notification);
    broadcastNotification(newTask.assigneeId, notification);
    
    console.log('✅ Task created:', newTask.id);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.createdAt;
    
    const result = await db.collection('tasks').findOneAndUpdate(
      { id: taskId },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Create notification for assignee if task was updated
    if (result.assigneeId) {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: result.assigneeId,
        type: 'task_updated',
        title: 'Task Updated',
        message: `Task "${result.title}" has been updated`,
        isRead: false,
        createdAt: new Date(),
        data: { taskId: result.id }
      };
      
      await db.collection('notifications').insertOne(notification);
      broadcastNotification(result.assigneeId, notification);
    }
    
    console.log('✅ Task updated:', taskId);
    res.json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const result = await db.collection('tasks').deleteOne({ id: taskId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('✅ Task deleted:', taskId);
    res.json({ message: 'Task deleted successfully', id: taskId });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get task statistics
app.get('/api/tasks/stats/overview', async (req, res) => {
  try {
    const now = new Date();
    
    const [total, completed, inProgress, notStarted, overdue] = await Promise.all([
      db.collection('tasks').countDocuments({}),
      db.collection('tasks').countDocuments({ status: 'completed' }),
      db.collection('tasks').countDocuments({ status: 'in_progress' }),
      db.collection('tasks').countDocuments({ status: 'not_started' }),
      db.collection('tasks').countDocuments({
        dueDate: { $lt: now },
        status: { $ne: 'completed' }
      })
    ]);

    res.json({
      total,
      completed,
      inProgress,
      notStarted,
      overdue
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== USER ROUTES ====================

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } }) // Exclude password from response
      .sort({ name: 1 })
      .toArray();
      
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { id: req.params.id },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== NOTIFICATION ROUTES ====================

// Get notifications for user
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0, unreadOnly } = req.query;
    
    const filter = { userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }
    
    const notifications = await db.collection('notifications')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .toArray();
      
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const result = await db.collection('notifications').findOneAndUpdate(
      { id: req.params.id },
      { $set: { isRead: true, readAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// REPORTING AND ANALYTICS ENDPOINTS
// ========================================

// Get dashboard statistics
app.get('/api/analytics/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const tasksCollection = db.collection('tasks');
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user's tasks or all tasks if user is manager/admin
    const userFilter = { assigneeId: userId }; // TODO: Add role-based filtering

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      tasksCompletedToday,
      tasksCompletedThisWeek,
      tasksCompletedThisMonth
    ] = await Promise.all([
      tasksCollection.countDocuments(userFilter),
      tasksCollection.countDocuments({ ...userFilter, status: 'completed' }),
      tasksCollection.countDocuments({ ...userFilter, status: 'in_progress' }),
      tasksCollection.countDocuments({ 
        ...userFilter, 
        dueDate: { $lt: now }, 
        status: { $ne: 'completed' } 
      }),
      tasksCollection.countDocuments({ 
        ...userFilter, 
        status: 'completed',
        completedAt: { $gte: todayStart }
      }),
      tasksCollection.countDocuments({ 
        ...userFilter, 
        status: 'completed',
        completedAt: { $gte: weekStart }
      }),
      tasksCollection.countDocuments({ 
        ...userFilter, 
        status: 'completed',
        completedAt: { $gte: monthStart }
      })
    ]);

    // Calculate average completion time
    const completedTasksWithTime = await tasksCollection.find({
      ...userFilter,
      status: 'completed',
      completedAt: { $exists: true },
      createdAt: { $exists: true }
    }).toArray();

    const averageCompletionTime = completedTasksWithTime.length > 0 
      ? completedTasksWithTime.reduce((sum, task) => {
          const completionTime = (new Date(task.completedAt) - new Date(task.createdAt)) / (1000 * 60 * 60);
          return sum + completionTime;
        }, 0) / completedTasksWithTime.length
      : 0;

    // Calculate productivity score (basic implementation)
    const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      tasksCompletedToday,
      tasksCompletedThisWeek,
      tasksCompletedThisMonth,
      averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
      productivityScore
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get team performance metrics
app.get('/api/analytics/team-performance', async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    const tasksCollection = db.collection('tasks');
    const usersCollection = db.collection('users');

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all users grouped by team/department
    const users = await usersCollection.find({}).toArray();
    const teamGroups = users.reduce((groups, user) => {
      const team = user.department || 'Unassigned';
      if (!groups[team]) {
        groups[team] = [];
      }
      groups[team].push(user);
      return groups;
    }, {});

    const teamMetrics = [];

    for (const [teamName, teamMembers] of Object.entries(teamGroups)) {
      const memberIds = teamMembers.map(m => m.id);
      
      const [totalTasks, completedTasks] = await Promise.all([
        tasksCollection.countDocuments({
          assigneeId: { $in: memberIds },
          createdAt: { $gte: startDate }
        }),
        tasksCollection.countDocuments({
          assigneeId: { $in: memberIds },
          status: 'completed',
          completedAt: { $gte: startDate }
        })
      ]);

      // Calculate completion times for on-time rate
      const completedTasksWithDates = await tasksCollection.find({
        assigneeId: { $in: memberIds },
        status: 'completed',
        completedAt: { $gte: startDate },
        dueDate: { $exists: true }
      }).toArray();

      const onTimeCompletions = completedTasksWithDates.filter(task => 
        new Date(task.completedAt) <= new Date(task.dueDate)
      ).length;

      const onTimeCompletionRate = completedTasksWithDates.length > 0 
        ? (onTimeCompletions / completedTasksWithDates.length) * 100 
        : 0;

      // Get top performers
      const topPerformers = await Promise.all(
        teamMembers.slice(0, 3).map(async (member) => {
          const memberTasks = await tasksCollection.countDocuments({
            assigneeId: member.id,
            createdAt: { $gte: startDate }
          });
          const memberCompleted = await tasksCollection.countDocuments({
            assigneeId: member.id,
            status: 'completed',
            completedAt: { $gte: startDate }
          });
          
          return {
            userId: member.id,
            userName: member.name,
            email: member.email,
            role: member.role,
            tasksAssigned: memberTasks,
            tasksCompleted: memberCompleted,
            tasksOverdue: 0, // TODO: Calculate overdue tasks
            averageCompletionTime: 0, // TODO: Calculate average completion time
            onTimeCompletionRate: 0, // TODO: Calculate on-time completion rate
            productivityScore: memberTasks > 0 ? Math.round((memberCompleted / memberTasks) * 100) : 0,
            lastActive: member.lastLogin || member.createdAt
          };
        })
      );

      teamMetrics.push({
        teamId: teamName.toLowerCase().replace(/\s+/g, '_'),
        teamName,
        totalMembers: teamMembers.length,
        totalTasks,
        completedTasks,
        averageTaskCompletionTime: 0, // TODO: Implement
        onTimeCompletionRate: Math.round(onTimeCompletionRate),
        productivityTrend: 0, // TODO: Implement trend calculation
        topPerformers
      });
    }

    res.json(teamMetrics);
  } catch (error) {
    console.error('Error fetching team performance:', error);
    res.status(500).json({ error: 'Failed to fetch team performance metrics' });
  }
});

// Get individual employee performance
app.get('/api/analytics/employee-performance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = 'month' } = req.query;
    const tasksCollection = db.collection('tasks');
    const usersCollection = db.collection('users');

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [tasksAssigned, tasksCompleted, tasksOverdue] = await Promise.all([
      tasksCollection.countDocuments({
        assigneeId: userId,
        createdAt: { $gte: startDate }
      }),
      tasksCollection.countDocuments({
        assigneeId: userId,
        status: 'completed',
        completedAt: { $gte: startDate }
      }),
      tasksCollection.countDocuments({
        assigneeId: userId,
        dueDate: { $lt: now },
        status: { $ne: 'completed' }
      })
    ]);

    // Calculate completion times
    const completedTasksWithTime = await tasksCollection.find({
      assigneeId: userId,
      status: 'completed',
      completedAt: { $gte: startDate, $exists: true },
      createdAt: { $exists: true }
    }).toArray();

    const averageCompletionTime = completedTasksWithTime.length > 0 
      ? completedTasksWithTime.reduce((sum, task) => {
          const completionTime = (new Date(task.completedAt) - new Date(task.createdAt)) / (1000 * 60 * 60);
          return sum + completionTime;
        }, 0) / completedTasksWithTime.length
      : 0;

    // Calculate on-time completion rate
    const tasksWithDueDate = await tasksCollection.find({
      assigneeId: userId,
      status: 'completed',
      completedAt: { $gte: startDate },
      dueDate: { $exists: true }
    }).toArray();

    const onTimeCompletions = tasksWithDueDate.filter(task => 
      new Date(task.completedAt) <= new Date(task.dueDate)
    ).length;

    const onTimeCompletionRate = tasksWithDueDate.length > 0 
      ? (onTimeCompletions / tasksWithDueDate.length) * 100 
      : 0;

    const productivityScore = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;

    res.json({
      userId: user.id,
      userName: user.name,
      email: user.email,
      role: user.role,
      tasksAssigned,
      tasksCompleted,
      tasksOverdue,
      averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
      onTimeCompletionRate: Math.round(onTimeCompletionRate),
      productivityScore,
      lastActive: user.lastLogin || user.createdAt
    });
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    res.status(500).json({ error: 'Failed to fetch employee performance metrics' });
  }
});

// Get task analytics with trends
app.get('/api/analytics/task-trends', async (req, res) => {
  try {
    const { timeframe = 'month', period = 'daily' } = req.query;
    const tasksCollection = db.collection('tasks');

    // Calculate date range
    const now = new Date();
    let startDate, groupFormat;
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupFormat = '%Y-%m-%d';
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        groupFormat = period === 'weekly' ? '%Y-%U' : '%Y-%m-%d';
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupFormat = '%Y-%m';
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupFormat = '%Y-%m-%d';
    }

    // Aggregation pipeline for completion trends
    const completionTrends = await tasksCollection.aggregate([
      {
        $match: {
          $or: [
            { createdAt: { $gte: startDate } },
            { completedAt: { $gte: startDate } }
          ]
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupFormat, date: '$createdAt' } },
            type: 'created'
          },
          count: { $sum: 1 }
        }
      },
      {
        $unionWith: {
          coll: 'tasks',
          pipeline: [
            {
              $match: {
                status: 'completed',
                completedAt: { $gte: startDate }
              }
            },
            {
              $group: {
                _id: {
                  date: { $dateToString: { format: groupFormat, date: '$completedAt' } },
                  type: 'completed'
                },
                count: { $sum: 1 }
              }
            }
          ]
        }
      },
      {
        $group: {
          _id: '$_id.date',
          created: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'created'] }, '$count', 0]
            }
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'completed'] }, '$count', 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    // Tasks by status
    const tasksByStatus = await tasksCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const totalTasks = tasksByStatus.reduce((sum, item) => sum + item.count, 0);
    const statusWithPercentage = tasksByStatus.map(item => ({
      status: item._id,
      count: item.count,
      percentage: Math.round((item.count / totalTasks) * 100)
    }));

    // Tasks by priority
    const tasksByPriority = await tasksCollection.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const priorityWithPercentage = tasksByPriority.map(item => ({
      priority: item._id,
      count: item.count,
      percentage: Math.round((item.count / totalTasks) * 100)
    }));

    res.json({
      timeframe: {
        period: timeframe,
        startDate: startDate,
        endDate: now
      },
      tasksByStatus: statusWithPercentage,
      tasksByPriority: priorityWithPercentage,
      completionTrends: completionTrends.map(trend => ({
        date: trend._id,
        completed: trend.completed,
        created: trend.created
      }))
    });
  } catch (error) {
    console.error('Error fetching task trends:', error);
    res.status(500).json({ error: 'Failed to fetch task analytics' });
  }
});

// ========================================
// USER MANAGEMENT ENDPOINTS
// ========================================

// Get user directory with filters and pagination
app.get('/api/users/directory', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      department, 
      status = 'active',
      search 
    } = req.query;

    const usersCollection = db.collection('users');
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, totalCount] = await Promise.all([
      usersCollection.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ name: 1 })
        .toArray(),
      usersCollection.countDocuments(filter)
    ]);

    // Get unique values for filters
    const [roles, departments, statuses] = await Promise.all([
      usersCollection.distinct('role'),
      usersCollection.distinct('department'),
      usersCollection.distinct('status')
    ]);

    res.json({
      users: users.map(user => ({
        ...user,
        password: undefined // Remove password from response
      })),
      totalCount,
      filters: {
        roles,
        departments,
        statuses
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user directory:', error);
    res.status(500).json({ error: 'Failed to fetch user directory' });
  }
});

// Send user invitation
app.post('/api/users/invite', async (req, res) => {
  try {
    const { email, role, invitedBy } = req.body;
    
    if (!email || !role || !invitedBy) {
      return res.status(400).json({ error: 'Email, role, and invitedBy are required' });
    }

    const usersCollection = db.collection('users');
    const invitationsCollection = db.collection('invitations');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if invitation already exists
    const existingInvitation = await invitationsCollection.findOne({ 
      email, 
      status: 'pending' 
    });
    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Generate invitation token
    const invitationToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = {
      id: `invitation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      role,
      invitedBy,
      invitedAt: new Date(),
      expiresAt,
      status: 'pending',
      invitationToken
    };

    await invitationsCollection.insertOne(invitation);

    // TODO: Send email invitation here
    console.log(`Invitation sent to ${email} with token: ${invitationToken}`);

    res.json({
      message: 'Invitation sent successfully',
      invitation: {
        ...invitation,
        invitationToken: undefined // Don't send token in response
      }
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Deactivate/reactivate user
app.patch('/api/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, updatedBy } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either active or inactive' });
    }

    const usersCollection = db.collection('users');
    const result = await usersCollection.findOneAndUpdate(
      { id: userId },
      { 
        $set: { 
          status,
          isActive: status === 'active',
          updatedAt: new Date(),
          updatedBy 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      user: {
        ...result,
        password: undefined
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update user role
app.patch('/api/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, updatedBy } = req.body;

    const usersCollection = db.collection('users');
    const result = await usersCollection.findOneAndUpdate(
      { id: userId },
      { 
        $set: { 
          role,
          updatedAt: new Date(),
          updatedBy 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user: {
        ...result,
        password: undefined
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  await connectToDatabase();
  
  server.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📡 Socket.IO server ready`);
    console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  if (client) {
    await client.close();
    console.log('📊 MongoDB connection closed');
  }
  process.exit(0);
});

startServer().catch(console.error);
