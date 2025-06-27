# User Roles & Hierarchy System

## Overview

The Task Manager application implements a comprehensive role-based access control (RBAC) system with a hierarchical structure. This system ensures that users can only access features and data appropriate to their organizational level and responsibilities.

## Role Hierarchy

The system supports 5 user roles in descending order of authority:

1. **Department Head** - Highest level with full system access
2. **Manager** - Department management with team oversight
3. **Assistant Manager** - Supporting management role
4. **Team Lead** - Direct team leadership
5. **Employee** - Individual contributor level

### Role Creation Rules

Each role has specific privileges for creating and managing users:

- **Department Heads** can create: Managers
- **Managers** can create: Assistant Managers, Team Leads
- **Assistant Managers** can create: None (no user creation rights)
- **Team Leads** can create: Employees
- **Employees** can create: None

**Important**: No role can create users above their level in the hierarchy.

## Permissions System

### Core Permissions

The system defines granular permissions across different functional areas:

#### User Management
- `CREATE_USERS` - Create new user accounts
- `VIEW_USERS` - View user profiles and information
- `EDIT_USERS` - Modify user profiles and settings
- `DELETE_USERS` - Remove user accounts

#### Task Management
- `CREATE_TASKS` - Create new tasks
- `VIEW_ALL_TASKS` - View all tasks in the system
- `VIEW_TEAM_TASKS` - View tasks assigned to team members
- `EDIT_ALL_TASKS` - Edit any task in the system
- `EDIT_TEAM_TASKS` - Edit tasks within managed teams
- `DELETE_TASKS` - Delete tasks
- `ASSIGN_TASKS` - Assign tasks to users

#### Project Management
- `CREATE_PROJECTS` - Create new projects
- `VIEW_ALL_PROJECTS` - View all projects
- `VIEW_TEAM_PROJECTS` - View team-specific projects
- `EDIT_PROJECTS` - Modify project details
- `DELETE_PROJECTS` - Remove projects

#### Analytics & Reporting
- `VIEW_ANALYTICS` - Access system-wide analytics
- `VIEW_TEAM_ANALYTICS` - Access team-specific analytics
- `EXPORT_REPORTS` - Export data and reports

#### Meeting Management
- `CREATE_MEETINGS` - Schedule meetings
- `MANAGE_MEETINGS` - Manage meeting settings and participants
- `JOIN_MEETINGS` - Participate in meetings

#### System Administration
- `MANAGE_SETTINGS` - Configure system settings
- `VIEW_AUDIT_LOGS` - Access system audit logs
- `MANAGE_DEPARTMENTS` - Manage department structure

### Role-Permission Matrix

| Permission | Department Head | Manager | Assistant Manager | Team Lead | Employee |
|------------|----------------|---------|-------------------|-----------|----------|
| CREATE_USERS | ✓ | ✓ | ✗ | ✓ | ✗ |
| VIEW_USERS | ✓ | ✓ | ✓ | ✓ | ✓ |
| EDIT_USERS | ✓ | ✓ | ✓ | ✗ | ✗ |
| DELETE_USERS | ✓ | ✗ | ✗ | ✗ | ✗ |
| CREATE_TASKS | ✓ | ✓ | ✓ | ✓ | ✓ |
| VIEW_ALL_TASKS | ✓ | ✓ | ✗ | ✗ | ✗ |
| EDIT_ALL_TASKS | ✓ | ✗ | ✗ | ✗ | ✗ |
| ASSIGN_TASKS | ✓ | ✓ | ✓ | ✓ | ✗ |
| VIEW_ANALYTICS | ✓ | ✓ | ✗ | ✗ | ✗ |
| MANAGE_SETTINGS | ✓ | ✗ | ✗ | ✗ | ✗ |

## Implementation Details

### Core Components

#### 1. Role Types (`src/types/roles.ts`)
- Defines `UserRole` enum with all available roles
- Contains `Permission` enum with all system permissions
- Includes `ROLE_HIERARCHY` mapping for authority levels
- Provides `RoleManager` class with utility methods

#### 2. Authentication Context (`src/context/AuthContext.tsx`)
- Integrates with role system for authentication
- Provides permission checking methods
- Includes role-based navigation filtering

#### 3. RBAC Context (`src/contexts/RbacContext.tsx`)
- Advanced role-based access control
- Permission checking utilities
- Higher-order components for protection
- UI helper methods

#### 4. User Management System (`src/pages/UserManagement.tsx`)
- Complete user management interface
- Role-based user creation and editing
- Hierarchical user filtering
- Permission-based UI elements

### Key Features

#### 1. User Management Interface
- **Create Users**: Role-based user creation with appropriate role options
- **Edit Users**: Modify user information with permission checks
- **View Users**: Detailed user profiles with permission and role information
- **User Filtering**: Filter users by role, department, and status
- **Hierarchical Display**: Shows users based on management hierarchy

#### 2. Permission-Based Navigation
- Dynamic sidebar based on user permissions
- Role-specific menu items
- Access control for sensitive features

#### 3. Role Hierarchy Visualization
- Interactive hierarchy display (`src/components/RoleHierarchy.tsx`)
- Permission mapping for each role
- Creation capabilities overview

#### 4. Security Features
- **Data Access Control**: Users can only access data from their level or below
- **Action Restrictions**: Operations limited by role permissions
- **UI Protection**: Interface elements hidden based on permissions
- **Route Protection**: Pages protected by role requirements

### Usage Examples

#### Checking Permissions
```typescript
import { useAuth } from '../context/AuthContext';
import { Permission } from '../types/roles';

function MyComponent() {
  const { hasPermission } = useAuth();
  
  const canCreateUsers = hasPermission(Permission.CREATE_USERS);
  
  return (
    <div>
      {canCreateUsers && (
        <button>Create User</button>
      )}
    </div>
  );
}
```

#### Using RBAC Context
```typescript
import { useRbac } from '../contexts/RbacContext';
import { UserRole } from '../types/roles';

function AdminPanel() {
  const { shouldShowComponent } = useRbac();
  
  return (
    <div>
      {shouldShowComponent(
        [Permission.MANAGE_SETTINGS],
        [UserRole.DEPARTMENT_HEAD]
      ) && (
        <AdminSettings />
      )}
    </div>
  );
}
```

#### Protected Components
```typescript
import { withPermissions } from '../contexts/RbacContext';
import { Permission } from '../types/roles';

const UserManagement = withPermissions(
  UserManagementComponent,
  [Permission.VIEW_USERS]
);
```

## Navigation Integration

The system integrates with the application navigation:

- **Sidebar**: Dynamically shows/hides menu items based on permissions
- **Routes**: Protected routes based on role requirements
- **Breadcrumbs**: Context-aware navigation based on user access level

## Best Practices

### 1. Permission Checking
- Always check permissions before performing actions
- Use permission-based UI rendering
- Implement server-side validation (in production)

### 2. Role Design
- Keep roles aligned with organizational structure
- Assign minimum necessary permissions
- Regularly review and update permissions

### 3. User Experience
- Provide clear feedback for access denied scenarios
- Show appropriate error messages
- Guide users to allowed actions

### 4. Security
- Validate permissions on both client and server
- Log access attempts for audit purposes
- Implement session timeout for inactive users

## API Integration

For production deployment, integrate with backend APIs:

```typescript
// Example API calls with role validation
const createUser = async (userData: CreateUserRequest) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    throw new Error('Permission denied or invalid request');
  }
  
  return response.json();
};
```

## Testing

Test the role system with different user scenarios:

1. **Department Head**: Full access to all features
2. **Manager**: Team management and user creation
3. **Assistant Manager**: Limited management capabilities
4. **Team Lead**: Employee management and team tasks
5. **Employee**: Basic task management only

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check user role and required permissions
2. **Navigation Issues**: Verify role-based menu filtering
3. **User Creation Fails**: Ensure creator has appropriate role level
4. **UI Elements Missing**: Check permission-based rendering logic

### Debug Tools

- Use browser dev tools to inspect user context
- Check console for permission validation errors
- Verify role hierarchy with RoleManager methods

## Future Enhancements

1. **Dynamic Permissions**: Allow runtime permission assignment
2. **Department-Based Access**: Implement department-level restrictions
3. **Temporary Roles**: Support time-limited role assignments
4. **Role Templates**: Pre-configured role sets for common scenarios
5. **Audit Trail**: Comprehensive logging of role-based actions

This comprehensive role system provides a solid foundation for enterprise-level access control while maintaining flexibility and user-friendliness.
