import axiosClient from './axiosClient';

export const staffApi = {
  // Get all staff with search and filters
  getAll: async (params = {}) => {
    return await axiosClient.get('/staff', { params });
  },

  // Get detailed staff profile with earnings, duties, payments
  getById: async (id) => {
    return await axiosClient.get(`/staff/${id}`);
  },

  // Get complete duty history for a specific staff member
  getDutyHistory: async (id, params = {}) => {
    return await axiosClient.get(`/staff/${id}/duties`, { params });
  },

  // Add new staff
  create: async (data) => {
    return await axiosClient.post('/staff', data);
  },

  // Edit staff details
  update: async (id, data) => {
    return await axiosClient.put(`/staff/${id}`, data);
  },

  // Delete or deactivate staff (safe deletion enforcement)
  deleteOrDeactivate: async (id) => {
    return await axiosClient.delete(`/staff/${id}`);
  },

  // Toggle active / inactive status
  toggleStatus: async (id, status) => {
    return await axiosClient.patch(`/staff/${id}/status`, { status });
  },
};

export default staffApi;
