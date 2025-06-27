# Task Manager Backend

This is the backend server for the Task Manager application, built with Node.js, Express, and MongoDB.

## Features

- RESTful API endpoints for task management
- Real-time WebSocket connections for notifications
- MongoDB integration with proper schema
- User authentication and authorization
- Role-based access control (RBAC)
- Analytics and reporting endpoints
- Audit logging system

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lakshya971/task-manager.git
cd task-manager
git checkout backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=http://localhost:5176
NODE_ENV=development
```

4. Start MongoDB (if running locally)

5. Run the database setup script:
```bash
node scripts/setup-database.js
```

6. Start the server:
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Analytics
- `GET /api/analytics/dashboard/:userId` - Get dashboard analytics
- `GET /api/analytics/tasks` - Get task analytics
- `GET /api/analytics/users` - Get user analytics

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

## WebSocket Events

The server supports real-time communication through WebSocket connections:

- `task_created` - New task created
- `task_updated` - Task updated
- `task_deleted` - Task deleted
- `user_notification` - User-specific notifications
- `system_notification` - System-wide notifications

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/taskmanager |
| `JWT_SECRET` | JWT signing secret | (required) |
| `CORS_ORIGIN` | Frontend URL for CORS | http://localhost:5176 |
| `NODE_ENV` | Environment mode | development |

## Development

### Running in Development Mode
```bash
npm run dev
```

### Testing the API
You can test the API endpoints using curl or any REST client:

```bash
# Health check
curl http://localhost:3001/api/health

# Get tasks
curl http://localhost:3001/api/tasks

# Get analytics
curl http://localhost:3001/api/analytics/dashboard/user1
```

## Database Schema

The application uses MongoDB with the following main collections:

- `tasks` - Task documents
- `users` - User documents
- `notifications` - Notification documents
- `auditlogs` - Audit trail documents
- `meetings` - Meeting/video call documents

## Security Features

- JWT-based authentication
- CORS protection
- Input validation and sanitization
- Rate limiting
- Audit logging for sensitive operations

## Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Set secure JWT secret
4. Configure proper CORS origins
5. Use process manager like PM2
6. Set up proper logging and monitoring

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is licensed under the MIT License.
