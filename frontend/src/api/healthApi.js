import axiosClient from './axiosClient';

export const healthApi = {
  checkHealth: async () => {
    return await axiosClient.get('/health');
  },
};
