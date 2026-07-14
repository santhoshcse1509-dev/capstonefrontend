import api from './api';
import { normalizeApiResponse } from '../utils/helpers';

const claimService = {
  // ── Core CRUD ────────────────────────────────────────────────────────────────

  submitClaim: async (claimData) => {
    const response = await api.post('/claims', claimData);
    return normalizeApiResponse(response);
  },

  getMyClaims: async (params = {}) => {
    const response = await api.get('/claims/my-claims', { params });
    return normalizeApiResponse(response);
  },

  getAllClaims: async (params = {}) => {
    const response = await api.get('/claims', { params });
    return normalizeApiResponse(response);
  },

  getClaimById: async (id) => {
    const response = await api.get(`/claims/${id}`);
    return normalizeApiResponse(response);
  },

  getClaimHistory: async (id) => {
    const response = await api.get(`/claims/${id}/history`);
    return normalizeApiResponse(response);
  },

  updateClaimStatus: async (id, statusData) => {
    const response = await api.put(`/claims/${id}/status`, statusData);
    return normalizeApiResponse(response);
  },

  // ── Documents ────────────────────────────────────────────────────────────────

  uploadClaimDocument: async (claimId, formData) => {
    const response = await api.post(`/claims/${claimId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalizeApiResponse(response);
  },

  getClaimDocuments: async (claimId) => {
    const response = await api.get(`/claims/${claimId}/documents`);
    return normalizeApiResponse(response);
  },

  // ── Appeals & Fraud ──────────────────────────────────────────────────────────

  submitAppeal: async (claimId, data) => {
    const response = await api.post(`/claims/${claimId}/appeal`, data);
    return normalizeApiResponse(response);
  },

  flagFraud: async (claimId, data) => {
    const response = await api.post(`/claims/${claimId}/flag`, data);
    return normalizeApiResponse(response);
  },

  // ── Adjuster Assignment ───────────────────────────────────────────────────────

  assignAdjuster: async (claimId, adjusterId) => {
    const response = await api.put(`/claims/${claimId}/assign`, { adjusterId });
    return normalizeApiResponse(response);
  },

  // ── Timeline ─────────────────────────────────────────────────────────────────

  getClaimTimeline: async (claimId) => {
    const response = await api.get(`/claims/${claimId}/timeline`);
    return normalizeApiResponse(response);
  },
};

export default claimService;
