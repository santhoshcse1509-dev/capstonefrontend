import api from './api';
import { normalizeApiResponse } from '../utils/helpers';

const paymentService = {
  makePayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return normalizeApiResponse(response);
  },

  createRazorpayOrder: async (customerPolicyId, amount) => {
    const response = await api.post('/payments/razorpay/create-order', null, {
      params: { customerPolicyId, amount }
    });
    return normalizeApiResponse(response);
  },

  verifyRazorpayPayment: async (verifyData) => {
    const response = await api.post('/payments/razorpay/verify', verifyData);
    return normalizeApiResponse(response);
  },

  getPaymentHistory: async (params = {}) => {
    const response = await api.get('/payments/my-payments', { params });
    return normalizeApiResponse(response);
  },

  getAllPayments: async () => {
    const response = await api.get('/payments');
    return normalizeApiResponse(response);
  },

  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return normalizeApiResponse(response);
  },

  getPaymentSummary: async () => {
    const response = await api.get('/payments/summary');
    return normalizeApiResponse(response);
  },

  downloadInvoice: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/invoice`, {
      responseType: 'blob',
    });
    return normalizeApiResponse(response);
  },

  retryPayment: async (paymentId) => {
    const response = await api.post(`/payments/${paymentId}/retry`);
    return normalizeApiResponse(response);
  },
};

export default paymentService;
