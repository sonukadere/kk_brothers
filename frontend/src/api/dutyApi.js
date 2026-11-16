import axiosClient from './axiosClient';

export const dutyApi = {
  getAll: async (params = {}) => {
    return await axiosClient.get('/duties', { params });
  },

  getById: async (id) => {
    return await axiosClient.get(`/duties/${id}`);
  },

  create: async (data) => {
    return await axiosClient.post('/duties', data);
  },

  update: async (id, data) => {
    return await axiosClient.put(`/duties/${id}`, data);
  },

  cancel: async (id) => {
    return await axiosClient.patch(`/duties/${id}/cancel`);
  },

  verify: async (id, data) => {
    return await axiosClient.put(`/duties/${id}/verify`, data);
  },

  getStaffHistory: async (staffId) => {
    return await axiosClient.get(`/duties/staff/${staffId}`);
  },

  getClientHistory: async (clientId) => {
    return await axiosClient.get(`/duties/client/${clientId}`);
  },
};

export default dutyApi;
