import api from './api';
import { normalizeApiResponse } from '../utils/helpers';

const policyService = {
  // ── Core CRUD ────────────────────────────────────────────────────────────────

  getAllPolicies: async (params = {}) => {
    const response = await api.get('/policies', { params });
    return normalizeApiResponse(response);
  },

  getPolicyById: async (id) => {
    const response = await api.get(`/policies/${id}`);
    return normalizeApiResponse(response);
  },

  getPolicyTypes: async () => {
    const response = await api.get('/policies/types');
    return normalizeApiResponse(response);
  },

  purchasePolicy: async (policyData) => {
    const response = await api.post('/policies/purchase', policyData);
    return normalizeApiResponse(response);
  },

  getMyPolicies: async (params = {}) => {
    const response = await api.get('/policies/my-policies', { params });
    return normalizeApiResponse(response);
  },

  renewPolicy: async (policyId) => {
    const response = await api.post(`/policies/${policyId}/renew`);
    return normalizeApiResponse(response);
  },

  cancelPolicy: async (policyId, reason = 'Customer request') => {
    const response = await api.post(`/policies/${policyId}/cancel`, null, { params: { reason } });
    return normalizeApiResponse(response);
  },

  getSurrenderValue: async (policyId) => {
    const response = await api.get(`/policies/${policyId}/surrender-value`);
    return normalizeApiResponse(response);
  },

  getStatusHistory: async (policyId) => {
    const response = await api.get(`/policies/${policyId}/status-history`);
    return normalizeApiResponse(response);
  },

  quoteEndorsement: async (policyId, data) => {
    const response = await api.post(`/policies/${policyId}/endorsement/quote`, data);
    return normalizeApiResponse(response);
  },

  applyEndorsement: async (policyId, data) => {
    const response = await api.post(`/policies/${policyId}/endorsement/apply`, data);
    return normalizeApiResponse(response);
  },

  getEndorsements: async (policyId) => {
    const response = await api.get(`/policies/${policyId}/endorsements`);
    return normalizeApiResponse(response);
  },

  requestReinstatement: async (policyId, overdueAmount) => {
    const response = await api.post(`/policies/${policyId}/reinstatement/request`, null, { params: { overdueAmount } });
    return normalizeApiResponse(response);
  },

  searchPolicies: async (query) => {
    const response = await api.get('/policies/search', { params: { q: query } });
    return normalizeApiResponse(response);
  },

  // ── Document Download ────────────────────────────────────────────────────────

  downloadPolicyDocument: async (policyId) => {
    const response = await api.get(`/policies/${policyId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ── Premium Calculator (real API) ──────────────────────────────────────────

  /**
   * POST /api/policies/quote
   * Returns a full premium breakdown including base, riders, annual/monthly/quarterly totals.
   *
   * @param {Object} data - { policyId, age, sumAssured, termYears, smoker, bmiCategory,
   *                          vehicleAge, vehicleType, propertyZone, constructionType,
   *                          selectedRiderIds }
   */
  getQuote: async (data) => {
    const response = await api.post('/policies/quote', data);
    return normalizeApiResponse(response);
  },

  /** GET /api/policies/riders — returns all active riders for the purchase form */
  getRiders: async () => {
    const response = await api.get('/policies/riders');
    return normalizeApiResponse(response);
  },

  // ── Portability ──────────────────────────────────────────────────────────────

  portPolicy: async (policyId, targetPolicyId) => {
    const response = await api.post(`/policies/${policyId}/port`, null, { params: { targetPolicyId } });
    return normalizeApiResponse(response);
  },

  // ── Nominee Management ───────────────────────────────────────────────────────

  updateNominee: async (policyId, data) => {
    const response = await api.put(`/policies/${policyId}/nominee`, data);
    return response.data;
  },

  // ── Payment Integration (Razorpay) ───────────────────────────────────────────

  createRazorpayOrder: async (customerPolicyId, amount) => {
    const response = await api.post('/payments/razorpay/create-order', null, {
      params: { customerPolicyId, amount }
    });
    return normalizeApiResponse(response);
  },

  verifyRazorpayPayment: async (payload) => {
    const response = await api.post('/payments/razorpay/verify', payload);
    return normalizeApiResponse(response);
  }
};

export default policyService;
