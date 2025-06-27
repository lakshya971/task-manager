# Frontend Architecture - Clean API-Based Design

## Overview
The frontend has been cleaned up to follow a proper separation of concerns with the backend API. All direct database operations have been removed from the frontend.

## What Was Removed
- `src/services/database.service.ts` - Direct MongoDB access (now handled by backend)
- `src/contexts/DatabaseContext.tsx` - Database context (no longer needed)
- `scripts/` directory - Database setup scripts (now handled by backend)
- All MongoDB dependencies from package.json

## Current Architecture

### Frontend Responsibilities
- User interface and user experience
- State management for UI components
- HTTP requests to backend API
- Real-time WebSocket communication
- Client-side routing and navigation

### Backend Responsibilities (task-manager-backend)
- All database operations (MongoDB)
- Business logic and data validation
- API endpoints for CRUD operations
- Real-time notifications via Socket.IO
- Authentication and authorization

## Services Structure

### `task.service.ts`
- Uses fetch API to communicate with backend
- All CRUD operations go through HTTP requests
- No direct database access
- Base URL configured via environment variables

### API Integration
- Base URL: `http://localhost:3001/api` (configurable via VITE_API_BASE_URL)
- RESTful endpoints for all operations
- Proper error handling for HTTP responses
- TypeScript interfaces maintained for type safety

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WEBSOCKET_URL=http://localhost:3001
```

### Backend (.env)
```
MONGODB_URL=mongodb://localhost:27017
DB_NAME=taskmanager
PORT=3001
```

## Running the Application

### Development
1. Start the backend: `cd task-manager-backend && npm run dev`
2. Start the frontend: `npm run dev`

### Production Build
1. Build frontend: `npm run build`
2. Preview: `npm run preview`

## Benefits of This Architecture
1. **Separation of Concerns**: Frontend focuses on UI, backend handles data
2. **Scalability**: Easy to scale frontend and backend independently
3. **Security**: No direct database access from client
4. **Maintainability**: Clear boundaries between layers
5. **API-First**: Backend API can be used by multiple clients
6. **Type Safety**: TypeScript interfaces ensure consistency

## Next Steps
- Consider adding authentication middleware
- Add API rate limiting
- Implement response caching
- Add comprehensive error boundaries
- Consider implementing state management (Redux/Zustand) for complex state
