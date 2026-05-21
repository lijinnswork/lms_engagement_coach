import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';

import { Goals } from './pages/Goals';
import { CoachChat } from './pages/CoachChat';
import { CourseDetail } from './pages/CourseDetail';
import { Reminders } from './pages/Reminders';
import { Settings } from './pages/Settings';
import { FloatingCoachBot } from './components/FloatingCoachBot';
import { NotificationToast } from './components/Notifications/NotificationToast';

import { ProtectedAdminRoute } from './components/Admin/ProtectedAdminRoute';
import { ProtectedRoute, PublicRoute } from './components/Common/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { RoleManagement } from './pages/admin/RoleManagement';
import { CoachMonitor } from './pages/admin/CoachMonitor';
import { AgentControls } from './pages/admin/AgentControls';
import { AgentLogs } from './pages/admin/AgentLogs';
import { CoachStudio } from './pages/admin/CoachStudio';
import { SystemSettings } from './pages/admin/SystemSettings';
import { AnnouncementsManager } from './pages/admin/AnnouncementsManager';

function App() {
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  // In a real app, this would poll or listen to websockets
  React.useEffect(() => {
    // Example: setToastMsg("Time for your calculus study session!");
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container min-h-screen bg-[var(--bg-primary)] transition-colors duration-400">
        <NotificationToast message={toastMsg} onClose={() => setToastMsg(null)} />
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedAdminRoute allowedRoles={['support_staff', 'super_admin']}>
              <AdminLayout />
            </ProtectedAdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="roles" element={
              <ProtectedAdminRoute allowedRoles={['super_admin']}>
                <RoleManagement />
              </ProtectedAdminRoute>
            } />
            <Route path="coach" element={
              <ProtectedAdminRoute allowedRoles={['super_admin']}>
                <CoachMonitor />
              </ProtectedAdminRoute>
            } />
            <Route path="agents" element={
              <ProtectedAdminRoute allowedRoles={['super_admin']}>
                <AgentControls />
              </ProtectedAdminRoute>
            } />
            <Route path="coach-studio" element={
              <ProtectedAdminRoute allowedRoles={['super_admin']}>
                <CoachStudio />
              </ProtectedAdminRoute>
            } />
            <Route path="announcements" element={
              <ProtectedAdminRoute allowedRoles={['super_admin']}>
                <AnnouncementsManager />
              </ProtectedAdminRoute>
            } />
            <Route path="logs" element={
              <ProtectedAdminRoute allowedRoles={['super_admin']}>
                <AgentLogs />
              </ProtectedAdminRoute>
            } />
            <Route path="system" element={
              <ProtectedAdminRoute allowedRoles={['super_admin']}>
                <SystemSettings />
              </ProtectedAdminRoute>
            } />
          </Route>

          {/* Student Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />

          <Route path="/goals" element={
            <ProtectedRoute>
              <Goals />
            </ProtectedRoute>
          } />
          <Route path="/coach" element={
            <ProtectedRoute>
              <CoachChat />
            </ProtectedRoute>
          } />
          <Route path="/course/:course_id" element={
            <ProtectedRoute>
              <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/reminders" element={
            <ProtectedRoute>
              <Reminders />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
        </Routes>
        <FloatingCoachBot />
      </div>
    </BrowserRouter>
  );
}

export default App;
