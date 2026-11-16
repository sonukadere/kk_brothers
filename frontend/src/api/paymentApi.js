import axiosClient from './axiosClient';

export const paymentApi = {
  // Staff Payments (Wages)
  getStaffPayments: async (params = {}) => {
    return await axiosClient.get('/payments/staff', { params });
  },

  getStaffPaymentById: async (id) => {
    return await axiosClient.get(`/payments/staff/${id}`);
  },

  createStaffPayment: async (data) => {
    return await axiosClient.post('/payments/staff', data);
  },

  updateStaffPayment: async (id, data) => {
    return await axiosClient.put(`/payments/staff/${id}`, data);
  },

  getStaffBalance: async (staffId) => {
    return await axiosClient.get(`/payments/staff/balance/${staffId}`);
  },

  getStaffLiability: async () => {
    return await axiosClient.get('/payments/staff-liability');
  },

  // Client Payments (Hotel / Catering Receivables)
  getClientPayments: async (params = {}) => {
    return await axiosClient.get('/payments/clients', { params });
  },

  getClientPaymentById: async (id) => {
    return await axiosClient.get(`/payments/clients/${id}`);
  },

  createClientPayment: async (data) => {
    return await axiosClient.post('/payments/clients', data);
  },

  // Client Billing & Invoicing (Generated from completed duties)
  getClientBills: async (params = {}) => {
    return await axiosClient.get('/payments/client-bills', { params });
  },

  getClientBillById: async (id) => {
    return await axiosClient.get(`/payments/client-bills/${id}`);
  },

  createClientBill: async (data) => {
    return await axiosClient.post('/payments/client-bills', data);
  },

  getUnbilledDuties: async (clientId) => {
    return await axiosClient.get(`/payments/client-unbilled-duties/${clientId}`);
  },

  getClientReport: async () => {
    return await axiosClient.get('/payments/client-report');
  },
};

export default paymentApi;
