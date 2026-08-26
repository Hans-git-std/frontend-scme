import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ToastProvider, useToast } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { startKeepAliveWorker } from './lib/api';
import { useAuthStore } from './lib/authStore';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { StudentLayout } from './components/layout/StudentLayout';
import { TeacherLayout } from './components/layout/TeacherLayout';
import { CompanyLayout } from './components/layout/CompanyLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Route Guards
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGuard } from './components/auth/RoleGuard';

// Public & Auth Pages
import { LandingPage } from './pages/public/LandingPage';
import { CompaniesDirectoryPage } from './pages/public/CompaniesDirectoryPage';
import { CompanyDetailPage } from './pages/public/CompanyDetailPage';
import { LoginPage } from './pages/auth/LoginPage';
import { StudentRegisterPage } from './pages/auth/StudentRegisterPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { TeacherRegisterPage } from './pages/auth/TeacherRegisterPage';
import { CompanyRegisterPage } from './pages/auth/CompanyRegisterPage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentMatchesPage } from './pages/student/StudentMatchesPage';
import { StudentAcademicsPage } from './pages/student/StudentAcademicsPage';
import { StudentSkillsPage } from './pages/student/StudentSkillsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Teacher Pages
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage';
import { TeacherVerifyPage } from './pages/teacher/TeacherVerifyPage';
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage';

// Company Pages
import { CompanyDashboardPage } from './pages/company/CompanyDashboardPage';
import { CompanyCriteriaPage } from './pages/company/CompanyCriteriaPage';
import { CompanyProfilePage } from './pages/company/CompanyProfilePage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminTeachersPage } from './pages/admin/AdminTeachersPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminCompaniesPage } from './pages/admin/AdminCompaniesPage';
import { AdminDiagnosticsPage } from './pages/admin/AdminDiagnosticsPage';

const AppContent: React.FC = () => {
  const { logout, initializeFromStorage } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    // 1. Initialize auth session from storage
    initializeFromStorage();

    // 2. Start cold-start micro-ping background worker (every 4 minutes)
    startKeepAliveWorker();

    // 3. Listen for token expiration events
    const handleSessionExpired = () => {
      logout();
      toast.warning('Session Expired', 'Your login session has expired. Please sign in again.');
    };

    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, [logout, initializeFromStorage, toast]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing & Directory Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/companies" element={<CompaniesDirectoryPage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
        </Route>

        {/* Authentication & Registration Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/student" element={<StudentRegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/register/teacher" element={<TeacherRegisterPage />} />
          <Route path="/register/company" element={<CompanyRegisterPage />} />
        </Route>

        {/* Student Portal Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ROLE_STUDENT']}>
                <StudentLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="matches" element={<StudentMatchesPage />} />
          <Route path="academics" element={<StudentAcademicsPage />} />
          <Route path="skills" element={<StudentSkillsPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
        </Route>

        {/* Teacher / Faculty Portal Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ROLE_TEACHER']}>
                <TeacherLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboardPage />} />
          <Route path="verify" element={<TeacherVerifyPage />} />
          <Route path="profile" element={<TeacherProfilePage />} />
        </Route>

        {/* Company Portal Routes */}
        <Route
          path="/company"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ROLE_COMPANY']}>
                <CompanyLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/company/dashboard" replace />} />
          <Route path="dashboard" element={<CompanyDashboardPage />} />
          <Route path="criteria" element={<CompanyCriteriaPage />} />
          <Route path="profile" element={<CompanyProfilePage />} />
        </Route>

        {/* Master Admin Console Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ROLE_ADMIN']}>
                <AdminLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="teachers" element={<AdminTeachersPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="companies" element={<AdminCompaniesPage />} />
          <Route path="diagnostics" element={<AdminDiagnosticsPage />} />
        </Route>

        {/* Fallback 404 Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="Application Encountered an Error">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
