import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';

// Auth & Security Pages
import Login from '../pages/auth/Login';
import Unauthorized from '../pages/auth/Unauthorized';
import Forbidden from '../pages/auth/Forbidden';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import StaffManagement from '../pages/admin/StaffManagement';
import StaffProfile from '../pages/admin/StaffProfile';
import UserManagement from '../pages/admin/UserManagement';
import HotelsCatering from '../pages/admin/HotelsCatering';
import BusinessDetails from '../pages/admin/BusinessDetails';
import DutyManagement from '../pages/admin/DutyManagement';
import StaffPayments from '../pages/admin/StaffPayments';
import ClientPayments from '../pages/admin/ClientPayments';
import Reports from '../pages/admin/Reports';
import Settings from '../pages/admin/Settings';

// User (Staff Worker) Pages
import UserDashboard from '../pages/user/UserDashboard';
import AddDuty from '../pages/user/AddDuty';
import MyDuties from '../pages/user/MyDuties';
import MyPayments from '../pages/user/MyPayments';
import MyProfile from '../pages/user/MyProfile';

// Not Found
import NotFound from '../pages/NotFound';

export const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  // Root redirect logic
  const getRootRedirect = () => {
    if (!isAuthenticated) return '/login';
    return user?.role === 'admin' ? '/dashboard' : '/user/dashboard';
  };

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'admin' ? '/dashboard' : '/user/dashboard'} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/forbidden" element={<Forbidden />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to={getRootRedirect()} replace />} />

      {/* Admin Module Routes (Guarded: role='admin') */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/staff" element={<StaffManagement />} />
          <Route path="/staff/:id" element={<StaffProfile />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/clients" element={<HotelsCatering />} />
          <Route path="/clients/:id" element={<BusinessDetails />} />
          <Route path="/duties" element={<DutyManagement />} />
          <Route path="/staff-payments" element={<StaffPayments />} />
          <Route path="/client-payments" element={<ClientPayments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* User (Staff Worker) Module Routes (Guarded: role='user') */}
      <Route element={<ProtectedRoute requiredRole="user" />}>
        <Route element={<AppLayout />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/add-duty" element={<AddDuty />} />
          <Route path="/user/my-duties" element={<MyDuties />} />
          <Route path="/user/my-payments" element={<MyPayments />} />
          <Route path="/user/profile" element={<MyProfile />} />
        </Route>
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
