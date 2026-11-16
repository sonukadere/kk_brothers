import axiosClient from './axiosClient';

export const overviewApi = {
  getAdminOverview: async (params = {}) => {
    return await axiosClient.get('/overview/admin', { params });
  },

  getUserOverview: async () => {
    return await axiosClient.get('/overview/user');
  },
};
