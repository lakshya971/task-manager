const { MongoClient } = require('mongodb');
require('dotenv').config();

// Mock data
const mockUsers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'DEPARTMENT_HEAD',
    department: 'Engineering',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date('2024-01-15'),
    createdBy: '1',
    isActive: true,
    passwordChangedAt: new Date('2024-01-01'),
    failedLoginAttempts: 0,
    twoFactorEnabled: true,
    lastPasswordChange: new Date('2024-01-01'),
    mustChangePassword: false,
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    role: 'MANAGER',
    department: 'Engineering',
    status: 'active',
    createdAt: new Date('2024-01-05'),
    lastLogin: new Date('2024-01-14'),
    createdBy: '1',
    isActive: true,
    passwordChangedAt: new Date('2024-01-05'),
    failedLoginAttempts: 0,
    twoFactorEnabled: false,
    lastPasswordChange: new Date('2024-01-05'),
    mustChangePassword: false,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@company.com',
    role: 'TEAM_LEAD',
    department: 'Engineering',
    status: 'active',
    createdAt: new Date('2024-01-10'),
    lastLogin: new Date('2024-01-15'),
    createdBy: '2',
    isActive: true,
    managerId: '2',
    passwordChangedAt: new Date('2024-01-10'),
    failedLoginAttempts: 0,
    twoFactorEnabled: true,
    lastPasswordChange: new Date('2024-01-10'),
    mustChangePassword: false,
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    role: 'EMPLOYEE',
    department: 'Engineering',
    status: 'active',
    createdAt: new Date('2024-01-12'),
    lastLogin: new Date('2024-01-14'),
    createdBy: '3',
    isActive: true,
    managerId: '3',
    passwordChangedAt: new Date('2024-01-12'),
    failedLoginAttempts: 0,
    twoFactorEnabled: false,
    lastPasswordChange: new Date('2024-01-12'),
    mustChangePassword: false,
  },
  {
    id: '5',
    name: 'Lisa Wang',
    email: 'lisa.wang@company.com',
    role: 'EMPLOYEE',
    department: 'Engineering',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2024-01-15'),
    createdBy: '3',
    isActive: true,
    managerId: '3',
    passwordChangedAt: new Date('2024-01-15'),
    failedLoginAttempts: 0,
    twoFactorEnabled: true,
    lastPasswordChange: new Date('2024-01-15'),
    mustChangePassword: false,
  },
  {
    id: '6',
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    role: 'EMPLOYEE',
    department: 'Engineering',
    status: 'inactive',
    createdAt: new Date('2024-01-08'),
    lastLogin: new Date('2024-01-12'),
    createdBy: '2',
    isActive: false,
    managerId: '2',
    passwordChangedAt: new Date('2024-01-08'),
    failedLoginAttempts: 2,
    twoFactorEnabled: false,
    lastPasswordChange: new Date('2024-01-08'),
    mustChangePassword: true,
  }
];

const mockTasks = [
  {
    id: 'task_1',
    title: 'Implement User Authentication',
    description: 'Create login and registration functionality with JWT tokens',
    status: 'completed',
    priority: 'high',
    assigneeId: '4',
    assignerId: '3',
    dueDate: new Date('2024-01-20'),
    completedAt: new Date('2024-01-18'),
    attachments: [],
    comments: [],
    tags: ['authentication', 'security', 'backend'],
    estimatedHours: 16,
    actualHours: 14,
  },
  {
    id: 'task_2',
    title: 'Design Dashboard UI',
    description: 'Create responsive dashboard with analytics and task overview',
    status: 'in_progress',
    priority: 'medium',
    assigneeId: '5',
    assignerId: '3',
    dueDate: new Date('2024-01-25'),
    attachments: [],
    comments: [],
    tags: ['ui', 'dashboard', 'frontend'],
    estimatedHours: 20,
    actualHours: 12,
  },
  {
    id: 'task_3',
    title: 'Setup Database Schema',
    description: 'Design and implement MongoDB collections for tasks, users, and notifications',
    status: 'not_started',
    priority: 'high',
    assigneeId: '4',
    assignerId: '2',
    dueDate: new Date('2024-01-22'),
    attachments: [],
    comments: [],
    tags: ['database', 'mongodb', 'backend'],
    estimatedHours: 12,
  },
  {
    id: 'task_4',
    title: 'Set up Video Conferencing',
    description: 'Integrate WebRTC or Jitsi Meet for video calling functionality',
    status: 'not_started',
    priority: 'low',
    assigneeId: '5',
    assignerId: '2',
    dueDate: new Date('2024-01-12'), // Overdue
    attachments: [],
    comments: [],
    tags: ['video', 'webrtc', 'communication'],
    estimatedHours: 24,
  }
];

async function setupDatabase() {
  let client;
  
  try {
    console.log('🚀 Starting backend database setup...');
    
    // Connect to MongoDB
    client = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017');
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'taskmanager');
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data if requested
    const clearData = process.argv.includes('--clear');
    if (clearData) {
      console.log('🧹 Clearing existing data...');
      const collections = ['tasks', 'users', 'notifications', 'auditlogs'];
      
      for (const collectionName of collections) {
        await db.collection(collectionName).deleteMany({});
        console.log(`Cleared collection: ${collectionName}`);
      }
    }
    
    // Insert users
    console.log('👥 Inserting users...');
    const usersCollection = db.collection('users');
    const existingUsersCount = await usersCollection.countDocuments();
    
    if (existingUsersCount === 0 || clearData) {
      if (clearData) {
        await usersCollection.insertMany(mockUsers);
      } else {
        // Insert only if they don't exist
        for (const user of mockUsers) {
          const existing = await usersCollection.findOne({ id: user.id });
          if (!existing) {
            await usersCollection.insertOne(user);
          }
        }
      }
      console.log(`✅ Inserted ${mockUsers.length} users`);
    } else {
      console.log(`ℹ️  ${existingUsersCount} users already exist`);
    }
    
    // Insert tasks
    console.log('📝 Inserting tasks...');
    const tasksCollection = db.collection('tasks');
    let tasksInserted = 0;
    
    for (const task of mockTasks) {
      const taskWithDates = {
        ...task,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const existing = await tasksCollection.findOne({ id: task.id });
      if (!existing || clearData) {
        if (clearData || !existing) {
          if (existing && clearData) {
            await tasksCollection.replaceOne({ id: task.id }, taskWithDates);
          } else {
            await tasksCollection.insertOne(taskWithDates);
          }
          tasksInserted++;
        }
      }
    }
    
    console.log(`✅ Inserted ${tasksInserted} tasks`);
    
    // Create indexes
    console.log('📊 Creating indexes...');
    
    // Tasks indexes
    await tasksCollection.createIndex({ id: 1 }, { unique: true });
    await tasksCollection.createIndex({ assigneeId: 1 });
    await tasksCollection.createIndex({ status: 1 });
    await tasksCollection.createIndex({ priority: 1 });
    await tasksCollection.createIndex({ dueDate: 1 });
    await tasksCollection.createIndex({ createdAt: -1 });
    
    // Users indexes
    await usersCollection.createIndex({ id: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    
    // Notifications indexes
    const notificationsCollection = db.collection('notifications');
    await notificationsCollection.createIndex({ id: 1 }, { unique: true });
    await notificationsCollection.createIndex({ userId: 1 });
    await notificationsCollection.createIndex({ createdAt: -1 });
    await notificationsCollection.createIndex({ isRead: 1 });
    
    // Audit logs indexes
    const auditLogsCollection = db.collection('auditlogs');
    await auditLogsCollection.createIndex({ id: 1 }, { unique: true });
    await auditLogsCollection.createIndex({ userId: 1 });
    await auditLogsCollection.createIndex({ timestamp: -1 });
    await auditLogsCollection.createIndex({ action: 1 });
    
    console.log('✅ Indexes created successfully');
    
    // Get final statistics
    const stats = await Promise.all([
      tasksCollection.countDocuments({}),
      usersCollection.countDocuments({}),
      notificationsCollection.countDocuments({}),
      auditLogsCollection.countDocuments({})
    ]);
    
    console.log('📈 Final database statistics:', {
      tasks: stats[0],
      users: stats[1], 
      notifications: stats[2],
      auditLogs: stats[3]
    });
    
    console.log('🎉 Backend database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📊 MongoDB connection closed');
    }
  }
}

// Run the setup
setupDatabase();
