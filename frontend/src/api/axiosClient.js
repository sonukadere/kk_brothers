import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Attach JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kk_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle session expiry / 401 / 403
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Server error occurred';

      if (status === 401) {
        // Clear expired session
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/unauthorized')) {
          localStorage.removeItem('kk_token');
          localStorage.removeItem('kk_user');
          window.location.href = '/unauthorized';
        }
      }

      return Promise.reject(new Error(message));
    }
    return Promise.reject(new Error(error.message || 'Network connection failed'));
  }
);

export default axiosClient;
