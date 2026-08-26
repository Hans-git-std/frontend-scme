import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/authStore';
import { UserRole } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { role, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    // If authenticated but role mismatch, route to role's dashboard
    if (role === 'ROLE_STUDENT') return <Navigate to="/student/dashboard" replace />;
    if (role === 'ROLE_TEACHER') return <Navigate to="/teacher/dashboard" replace />;
    if (role === 'ROLE_COMPANY') return <Navigate to="/company/dashboard" replace />;
    if (role === 'ROLE_ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
