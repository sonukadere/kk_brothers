import axiosClient from './axiosClient';

export const authApi = {
  // Login accepts email OR mobile number
  login: async (identifier, password) => {
    return await axiosClient.post('/auth/login', { identifier, password });
  },

  verifyResetIdentifier: async (identifier) => {
    return await axiosClient.post('/auth/forgot-password-verify', { identifier });
  },

  resetPasswordWithIdentifier: async (identifier, newPassword) => {
    return await axiosClient.post('/auth/reset-password', { identifier, newPassword });
  },

  registerStaff: async (staffData) => {
    return await axiosClient.post('/auth/register', staffData);
  },

  getMe: async () => {
    return await axiosClient.get('/auth/me');
  },

  updateProfile: async (profileData) => {
    return await axiosClient.put('/auth/profile', profileData);
  },

  updatePassword: async (passwords) => {
    return await axiosClient.put('/auth/password', passwords);
  },
};

export default authApi;
