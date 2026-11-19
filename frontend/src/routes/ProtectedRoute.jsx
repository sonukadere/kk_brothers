import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const ProtectedRoute = ({ requiredRole, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Authenticating KK Brothers session..." />
      </div>
    );
  }

  // Not signed in -> Redirect to Unauthorized screen
  if (!isAuthenticated) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Account deactivated check
  if (user && !user.isActive) {
    return <Navigate to="/login?deactivated=true" replace />;
  }

  // Role check: Administrator has superuser access to all routes.
  // Non-admin workers attempting to access admin routes are restricted to Forbidden screen.
  if (requiredRole && user?.role !== 'admin' && user?.role !== requiredRole) {
    return <Navigate to="/forbidden" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
