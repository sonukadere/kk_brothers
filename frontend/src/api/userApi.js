import axiosClient from './axiosClient';

export const userApi = {
  // View all users (Admin only)
  getAll: async (params = {}) => {
    return await axiosClient.get('/users', { params });
  },

  // Get user by ID (Admin only)
  getById: async (id) => {
    return await axiosClient.get(`/users/${id}`);
  },

  // Create new user (Admin only)
  create: async (userData) => {
    return await axiosClient.post('/users', userData);
  },

  // Edit user details (Admin only)
  update: async (id, userData) => {
    return await axiosClient.put(`/users/${id}`, userData);
  },

  // Activate / Deactivate user (Admin only)
  toggleStatus: async (id, isActive) => {
    return await axiosClient.patch(`/users/${id}/status`, { isActive });
  },

  // Reset user password (Admin only)
  resetPassword: async (id, newPassword) => {
    return await axiosClient.patch(`/users/${id}/reset-password`, { newPassword });
  },
};

export default userApi;
