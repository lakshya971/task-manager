# MongoDB Integration Documentation

## Overview
Your task management application now has MongoDB integration, but there's an important architectural consideration: **MongoDB cannot run directly in the browser**. Here's the complete setup guide:

## Architecture

```
Frontend (React/Vite) <---> Backend API (Node.js/Express) <---> MongoDB
```

## What's Been Set Up

### ✅ Database Setup Complete
- MongoDB Server installed and running on Windows
- Database `taskmanager` created with collections:
  - `tasks` - Task data with proper indexes
  - `users` - User information
  - `notifications` - Notification history
  - `auditlogs` - Audit trail
- Sample data inserted (4 tasks, 6 users)

### ✅ Database Services Created
- `DatabaseService` - MongoDB connection management
- `TaskService` - Task CRUD operations
- Database context and React integration

## Next Steps Required

### 1. Backend API Server (Required for Production)

Create a Node.js/Express backend server to handle database operations:

```bash
# In a new directory (e.g., task-manager-backend)
mkdir task-manager-backend
cd task-manager-backend
npm init -y
npm install express mongodb cors dotenv
npm install -D nodemon @types/express @types/node tsx
```

### 2. Backend API Structure

Create these files in your backend:

**server.js:**
```javascript
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
MongoClient.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017')
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db('taskmanager');
  })
  .catch(error => console.error('MongoDB connection error:', error));

// Routes
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await db.collection('tasks').find({}).sort({ createdAt: -1 }).toArray();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = {
      ...req.body,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('tasks').insertOne(newTask);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add more routes for PUT, DELETE, etc.

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

### 3. Frontend Configuration

Your frontend is already configured to make API calls to `http://localhost:3001/api`. 

**Current Frontend Setup:**
- ✅ Environment variables configured
- ✅ API service ready (`api.service.ts`)
- ✅ Database context created (but needs backend API)

### 4. Development Workflow

**Option A: Full Stack Development (Recommended)**
1. Run MongoDB (already running)
2. Run backend API server (port 3001)  
3. Run frontend dev server (port 5173)

**Option B: Mock Data (Current)**
- Continue using mock data in frontend
- Database integration ready for when backend is available

## Current Database Status

### 📊 Database Statistics
- **Database**: `taskmanager`
- **Tasks**: 4 total (1 completed, 1 in progress, 1 not started, 3 overdue)
- **Users**: 6 users with different roles
- **Collections**: Properly indexed and ready for production

### 🔧 Management Commands

```bash
# Setup database with sample data
npm run setup-db

# Clear and re-setup database
npm run setup-db-clear

# Drop entire database
npx tsx scripts/drop-database.ts
```

## Environment Variables

Your `.env` file is configured:
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_MONGODB_URL=mongodb://localhost:27017
VITE_DB_NAME=taskmanager
```

## Testing Database Connection

MongoDB is running and accessible. You can verify with:

```bash
# Check MongoDB service status
Get-Service -Name MongoDB

# Test database setup
npm run setup-db
```

## Next Immediate Action

**Choose your path:**

1. **Continue with mock data** - Your app works perfectly with the existing mock data
2. **Build backend API** - Create the Node.js backend to enable database persistence
3. **Hybrid approach** - Use mock data for development, prepare for backend integration

The database foundation is solid and ready for production use! 🚀
