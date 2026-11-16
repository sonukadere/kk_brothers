import axiosClient from './axiosClient';

export const reportApi = {
  // 1. Staff-wise duty report
  getStaffDutyReport: async (params = {}) => {
    return await axiosClient.get('/reports/staff-duties', { params });
  },

  // 2. Hotel-wise duty report
  getHotelDutyReport: async (params = {}) => {
    return await axiosClient.get('/reports/hotel-duties', { params });
  },

  // 3. Catering-wise duty report
  getCateringDutyReport: async (params = {}) => {
    return await axiosClient.get('/reports/catering-duties', { params });
  },

  // 4. Date-wise duty report
  getDateWiseDutyReport: async (params = {}) => {
    return await axiosClient.get('/reports/date-duties', { params });
  },

  // 5. Staff payment report
  getStaffPaymentReport: async (params = {}) => {
    return await axiosClient.get('/reports/staff-payments', { params });
  },

  // 6. Client payment report
  getClientPaymentReport: async (params = {}) => {
    return await axiosClient.get('/reports/client-payments', { params });
  },

  // 7. Pending payment report
  getPendingPaymentReport: async () => {
    return await axiosClient.get('/reports/pending-payments');
  },

  // 8. Monthly business report
  getMonthlyBusinessReport: async (params = {}) => {
    return await axiosClient.get('/reports/monthly-business', { params });
  },
};

export default reportApi;
