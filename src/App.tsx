
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RbacProvider } from './contexts/RbacContext';
import { SecurityProvider } from './contexts/SecurityContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Team } from './pages/Team';
import { Analytics } from './pages/Analytics';
import { Meetings } from './pages/Meetings';
import { VideoRoom } from './components/VideoCall/VideoRoom';
import { MeetingRoom } from './components/VideoCall/MeetingRoom';
import UserManagement from './pages/UserManagement';
import AuditLogsPage from './pages/AuditLogs';
import NotificationsPage from './pages/Notifications';


function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <Layout>
      <RbacProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/team" element={<Team />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/meeting-room/:roomId" element={<MeetingRoom />} />
          <Route path="/video-call/:roomId" element={<VideoRoom />} />
          <Route path="/notifications" element={<div className="px-6"><h1 className="text-2xl font-bold">Notifications (Coming Soon)</h1></div>} />
          <Route path="/settings" element={<div className="px-6"><h1 className="text-2xl font-bold">Settings (Coming Soon)</h1></div>} />
          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </RbacProvider>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <SecurityProvider>
        <NotificationProvider>
          <Router>
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </SecurityProvider>
    </AuthProvider>
  );
}

export default App;