import axiosClient from './axiosClient';

export const clientApi = {
  // Get all hotels & catering partners with search and filters
  getAll: async (params = {}) => {
    return await axiosClient.get('/clients', { params });
  },

  // Get detailed business profile with financial summary, duties, payments, staff sent
  getById: async (id) => {
    return await axiosClient.get(`/clients/${id}`);
  },

  // Get all duty records for a specific business
  getDuties: async (id, params = {}) => {
    return await axiosClient.get(`/clients/${id}/duties`, { params });
  },

  // Get distinct staff workers sent to this business
  getStaffSent: async (id) => {
    return await axiosClient.get(`/clients/${id}/staff`);
  },

  // Add hotel or catering company (Admin only)
  create: async (data) => {
    return await axiosClient.post('/clients', data);
  },

  // Edit business details (Admin only)
  update: async (id, data) => {
    return await axiosClient.put(`/clients/${id}`, data);
  },

  // Deactivate or delete business (Admin only, safe retention)
  deleteOrDeactivate: async (id) => {
    return await axiosClient.delete(`/clients/${id}`);
  },

  // Toggle active / inactive status (Admin only)
  toggleStatus: async (id, status) => {
    return await axiosClient.patch(`/clients/${id}/status`, { status });
  },
};

export default clientApi;
