import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import LecturerDashboard from './pages/lecturer/DashboardPage';
import LecturerCoursesPage from './pages/lecturer/CoursesPage';
import StartSessionPage from './pages/lecturer/StartSessionPage';
import AttendanceReportPage from './pages/attendance/ReportPage';
import ScanPage from './pages/student/ScanPage';
import AutoAttendPage from './pages/student/AutoAttendPage';
import AttendanceHistoryPage from './pages/student/HistoryPage';
import AdminAnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import CourseManagement from './pages/admin/CourseManagement';
import AdminStudentsPage from './pages/admin/StudentsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import StudentDashboard from './pages/student/DashboardPage';
import ScheduleSessionPage from './pages/lecturer/ScheduleSessionPage';
import { useAuth } from './context/AuthContext';
import type { UserRole } from './types';
import { getHomeRouteByRole } from './utils/roleRouting';

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getHomeRouteByRole(user.role)} replace />;
}

function RequireRole({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: ReactElement;
}) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRouteByRole(user.role)} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* QR deep-link — accessible before login (page handles auth itself) */}
          <Route path="/attend" element={<AutoAttendPage />} />

          {/* Protected — shared layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<RoleRedirect />} />

            {/* Lecturer */}
            <Route
              path="/dashboard"
              element={
                <RequireRole allowedRoles={['lecturer']}>
                  <LecturerDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/courses"
              element={
                <RequireRole allowedRoles={['lecturer']}>
                  <LecturerCoursesPage />
                </RequireRole>
              }
            />
            <Route
              path="/session/start"
              element={
                <RequireRole allowedRoles={['lecturer']}>
                  <StartSessionPage />
                </RequireRole>
              }
            />
            <Route
              path="/reports"
              element={
                <RequireRole allowedRoles={['lecturer']}>
                  <AttendanceReportPage />
                </RequireRole>
              }
            />
            <Route
              path="/session/schedule"
              element={
                <RequireRole allowedRoles={['lecturer']}>
                  <ScheduleSessionPage />
                </RequireRole>
              }
            />

            {/* Student */}
            <Route
              path="/student"
              element={
                <RequireRole allowedRoles={['student']}>
                  <StudentDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/scan"
              element={
                <RequireRole allowedRoles={['student']}>
                  <ScanPage />
                </RequireRole>
              }
            />
            <Route
              path="/history"
              element={
                <RequireRole allowedRoles={['student']}>
                  <AttendanceHistoryPage />
                </RequireRole>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <RequireRole allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </RequireRole>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <RequireRole allowedRoles={['admin']}>
                  <AdminAnalyticsDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <RequireRole allowedRoles={['admin']}>
                  <CourseManagement />
                </RequireRole>
              }
            />
            <Route
              path="/admin/students"
              element={
                <RequireRole allowedRoles={['admin']}>
                  <AdminStudentsPage />
                </RequireRole>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
