import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user & token from storage on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('kk_token');
      const storedUser = localStorage.getItem('kk_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
          // Verify with backend
          const res = await authApi.getMe();
          if (res.success && res.user) {
            if (!res.user.isActive) {
              toast.error('Your account has been deactivated by administrator.');
              logout();
              return;
            }
            setUser(res.user);
            localStorage.setItem('kk_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          localStorage.removeItem('kk_token');
          localStorage.removeItem('kk_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login with Email OR Mobile Number
  const login = async (identifier, password) => {
    try {
      const res = await authApi.login(identifier, password);
      if (res.success) {
        if (!res.user.isActive) {
          toast.error('This account is deactivated. Contact administrator.');
          return { success: false, message: 'Account is deactivated' };
        }
        localStorage.setItem('kk_token', res.token);
        localStorage.setItem('kk_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        toast.success(`Welcome back, ${res.user.name}!`);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check credentials.');
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('kk_token');
    localStorage.removeItem('kk_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully.');
  };

  // Demo switcher for testing both roles via email or mobile
  const switchDemoRole = async (targetRole, useMobile = false) => {
    let identifier;
    let password;

    if (targetRole === 'admin') {
      identifier = useMobile ? '9876543210' : 'admin@kkbrothers.com';
      password = 'Admin@123';
    } else {
      identifier = useMobile ? '9765432109' : 'staff@kkbrothers.com';
      password = 'Staff@123';
    }

    toast.loading(`Authenticating as ${targetRole.toUpperCase()} (${identifier})...`, {
      id: 'role-switch',
    });

    try {
      const res = await authApi.login(identifier, password);
      if (res.success) {
        localStorage.setItem('kk_token', res.token);
        localStorage.setItem('kk_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        toast.success(`Active as ${targetRole === 'admin' ? 'Administrator' : 'Staff Worker'}`, {
          id: 'role-switch',
        });
        return { success: true, user: res.user };
      }
    } catch (err) {
      toast.error(`Failed to switch role: ${err.message}`, { id: 'role-switch' });
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('kk_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user && user?.isActive,
    isAdmin: user?.role === 'admin' && user?.isActive,
    isUser: user?.role === 'user' && user?.isActive,
    loading,
    login,
    logout,
    switchDemoRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
