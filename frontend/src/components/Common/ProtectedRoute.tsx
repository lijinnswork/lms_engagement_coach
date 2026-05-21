import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface RouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<RouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<RouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    const isAdmin = user?.role === 'super_admin' || user?.role === 'support_staff' || (
      user?.email && (
        user.email.toLowerCase() === 'vishal.reddy@iimbx.iimb.ac.in' ||
        user.email.toLowerCase().includes('admin') ||
        user.email.toLowerCase().includes('support')
      )
    );
    return <Navigate to={isAdmin ? "/admin" : "/"} replace />;
  }

  return <>{children}</>;
};
