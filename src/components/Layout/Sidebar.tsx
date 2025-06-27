
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BarChart3, 
  Video, 
  Bell, 
  Settings,
  Building2,
  LogOut,
  UserCog,
  Shield,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, ROLE_NAMES, Permission } from '../../types/roles';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles?: UserRole[];
  permission?: Permission;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [UserRole.DEPARTMENT_HEAD, UserRole.MANAGER, UserRole.ASSISTANT_MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE] },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, roles: [UserRole.DEPARTMENT_HEAD, UserRole.MANAGER, UserRole.ASSISTANT_MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE] },
  { name: 'Team', href: '/team', icon: Users, roles: [UserRole.DEPARTMENT_HEAD, UserRole.MANAGER, UserRole.ASSISTANT_MANAGER, UserRole.TEAM_LEAD] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: [UserRole.DEPARTMENT_HEAD, UserRole.MANAGER, UserRole.ASSISTANT_MANAGER] },
  { name: 'Meetings', href: '/meetings', icon: Video, roles: [UserRole.DEPARTMENT_HEAD, UserRole.MANAGER, UserRole.ASSISTANT_MANAGER, UserRole.TEAM_LEAD] },
  { name: 'User Management', href: '/users', icon: UserCog, permission: Permission.VIEW_USERS },
  { name: 'Security & Audit', href: '/audit-logs', icon: Shield, permission: Permission.VIEW_AUDIT_LOGS },
  { name: 'Notifications', href: '/notifications', icon: Bell, roles: [UserRole.DEPARTMENT_HEAD, UserRole.MANAGER, UserRole.ASSISTANT_MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: [UserRole.DEPARTMENT_HEAD, UserRole.MANAGER, UserRole.ASSISTANT_MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE] },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  if (!user) return null;

  const filteredItems = navigationItems.filter(item => {
    // Check if item has permission requirement
    if (item.permission) {
      return hasPermission(item.permission);
    }
    // Check if item has role requirement
    if (item.roles) {
      return item.roles.includes(user.role);
    }
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-25"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        flex h-full w-64 flex-col fixed inset-y-0 z-50 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <div className="lg:hidden absolute top-0 right-0 -mr-12 pt-2">
          <button
            type="button"
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
          <Building2 className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">WorkFlow Pro</span>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{ROLE_NAMES[user.role]}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => onClose()} // Close sidebar on mobile when clicking a link
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="group flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}