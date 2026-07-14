import api from './api';

/**
 * Admin API service — wraps all /api/admin/* endpoints.
 */
const adminService = {

  // ─── User Management ───────────────────────────────────────────

  /** Fetch all users in the system */
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data?.data ?? res.data;
  },

  /** Fetch a single user by ID */
  getUserById: async (id) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data?.data ?? res.data;
  },

  /**
   * Update a user's account status.
   * @param {string} id  user UUID
   * @param {string} status  'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
   */
  updateUserStatus: async (id, status) => {
    const res = await api.put(`/admin/users/${id}/status`, { status });
    return res.data?.data ?? res.data;
  },

  /**
   * Trigger an admin-initiated password reset email.
   * @param {string} id  user UUID
   */
  resetPassword: async (id) => {
    const res = await api.post(`/admin/users/${id}/reset-password`);
    return res.data;
  },

  /**
   * Change a user's primary role.
   * @param {string} id    user UUID
   * @param {string} role  'CUSTOMER' | 'AGENT' | 'CLAIMS_OFFICER' | 'ADMIN'
   */
  changeRole: async (id, role) => {
    const res = await api.put(`/admin/users/${id}/role`, { role });
    return res.data?.data ?? res.data;
  },

  // ─── KYC Review ────────────────────────────────────────────────

  /** Fetch all users with pending KYC submissions + their documents */
  getPendingKyc: async () => {
    const res = await api.get('/admin/kyc/pending');
    return res.data?.data ?? res.data;
  },

  /**
   * Approve a user's KYC documents.
   * @param {string} userId  user UUID
   */
  verifyKyc: async (userId) => {
    const res = await api.put(`/admin/kyc/${userId}/verify`);
    return res.data;
  },

  /**
   * Reject a user's KYC documents.
   * @param {string} userId          user UUID
   * @param {string} rejectionReason optional reason text
   */
  rejectKyc: async (userId, rejectionReason = '') => {
    const res = await api.put(`/admin/kyc/${userId}/reject`, { rejectionReason });
    return res.data;
  },

  // ─── Dashboard Stats ───────────────────────────────────────────

  /** Fetch high-level system statistics */
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data?.data ?? res.data;
  },

  // ─── Audit Logs ────────────────────────────────────────────────

  /**
   * Fetch audit logs with optional filters.
   * @param {Object} filters  { from, to, entityType } — all optional ISO datetime strings
   */
  getAuditLogs: async (filters = {}) => {
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.entityType) params.entityType = filters.entityType;
    const res = await api.get('/admin/audit-logs', { params });
    return res.data?.data ?? res.data;
  },

  // ─── Premium Rate Configs (Phase 1) ────────────────────────────

  /** List all rate config factors across all policy types */
  getRateConfigs: async () => {
    const res = await api.get('/admin/rate-configs');
    return res.data?.data ?? res.data;
  },

  /** List rate configs for a specific policy type (LIFE, HEALTH, MOTOR, HOME) */
  getRateConfigsByType: async (policyType) => {
    const res = await api.get(`/admin/rate-configs/${policyType}`);
    return res.data?.data ?? res.data;
  },

  /** Create a new rate config factor */
  createRateConfig: async (data) => {
    const res = await api.post('/admin/rate-configs', data);
    return res.data?.data ?? res.data;
  },

  /** Update an existing rate config (factorValue, description, active) */
  updateRateConfig: async (id, data) => {
    const res = await api.put(`/admin/rate-configs/${id}`, data);
    return res.data?.data ?? res.data;
  },

  /** Toggle a rate config's active status */
  toggleRateConfig: async (id) => {
    const res = await api.patch(`/admin/rate-configs/${id}/toggle`);
    return res.data;
  },

  // ─── Rider Management (Phase 1) ────────────────────────────────

  /** List all riders (active + inactive) for admin management */
  getAllRiders: async () => {
    const res = await api.get('/admin/riders');
    return res.data?.data ?? res.data;
  },

  /** Create a new rider add-on */
  createRider: async (data) => {
    const res = await api.post('/admin/riders', data);
    return res.data?.data ?? res.data;
  },

  /** Update a rider's name, description, or rate percent */
  updateRider: async (id, data) => {
    const res = await api.put(`/admin/riders/${id}`, data);
    return res.data?.data ?? res.data;
  },

  /** Toggle a rider's active status */
  toggleRider: async (id) => {
    const res = await api.patch(`/admin/riders/${id}/toggle`);
    return res.data;
  },

  // ─── Reinstatements (Phase 2) ──────────────────────────────────

  /** List all pending reinstatement requests */
  getPendingReinstatements: async () => {
    const res = await api.get('/admin/reinstatements/pending');
    return res.data?.data ?? res.data;
  },

  /** Approve a pending reinstatement request */
  approveReinstatement: async (id) => {
    const res = await api.post(`/admin/reinstatements/${id}/approve`);
    return res.data?.data ?? res.data;
  },

  /** Reject a pending reinstatement request */
  rejectReinstatement: async (id, reason) => {
    const res = await api.post(`/admin/reinstatements/${id}/reject`, null, { params: { reason } });
    return res.data?.data ?? res.data;
  },
};

export default adminService;
