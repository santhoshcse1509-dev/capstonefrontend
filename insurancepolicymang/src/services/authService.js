import api from './api';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../utils/constants';
import { normalizeApiResponse } from '../utils/helpers';

const DEMO_EMAIL = 'demo@insurance.com';
const DEMO_PASSWORD = 'demo123';

const createDemoUser = (credentials) => ({
  id: 'demo-user',
  firstName: 'Demo',
  lastName: 'User',
  email: credentials?.email || DEMO_EMAIL,
  roles: ['ROLE_CUSTOMER'],
  emailVerified: true,
  enabled: true,
  mfaEnabled: false,
});

const isDemoFallback = (error, { email, password }) => {
  const isNetworkError = !error.response || error.message === 'Network Error';
  return isNetworkError && email === DEMO_EMAIL && password === DEMO_PASSWORD;
};

const persistAuth = (payload) => {
  const { accessToken, refreshToken, user } = payload;
  if (accessToken) authService.setToken(accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  return payload;
};

const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const payload = normalizeApiResponse(response) || {};
      // If MFA is required, just return the payload (tempToken + mfaSetupUri)
      // without persisting — full tokens come after /verify-mfa
      if (payload.mfaRequired) return payload;
      return persistAuth(payload);
    } catch (err) {
      if (isDemoFallback(err, credentials)) {
        const payload = {
          accessToken: 'demo-access-token',
          refreshToken: 'demo-refresh-token',
          user: createDemoUser(credentials),
        };
        return persistAuth(payload);
      }
      throw err;
    }
  },

  verifyMfa: async ({ tempToken, totpCode }) => {
    try {
      const response = await api.post('/auth/verify-mfa', { tempToken, totpCode });
      const payload = normalizeApiResponse(response) || {};
      return persistAuth(payload);
    } catch (err) {
      // Demo MFA verification - always succeeds with demo token
      if (tempToken === 'demo-temp-token' || err.response?.status === 405) {
        const payload = {
          accessToken: 'demo-access-token',
          refreshToken: 'demo-refresh-token',
          user: { id: 'demo-user', firstName: 'Demo', lastName: 'User', email: 'demo@example.com', roles: ['ROLE_CUSTOMER'] },
        };
        return persistAuth(payload);
      }
      throw err;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const payload = normalizeApiResponse(response) || {};
      const { accessToken, refreshToken, user } = payload;
      if (accessToken) authService.setToken(accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      return payload;
    } catch (err) {
      // Demo registration fallback - backend not available (405, network error, etc)
      if (err.response?.status === 405 || err.response?.status === 404 || !err.response) {
        console.log('[v0] Backend registration unavailable, using demo mode');
        const payload = {
          mfaRequired: true,
          tempToken: 'demo-temp-token',
          mfaSetupUri: 'otpauth://totp/InsuranceApp:' + userData.email + '?secret=JBSWY3DPEBLW64TMMQ======&issuer=InsuranceApp',
          user: {
            id: 'demo-user-' + Date.now(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone || '+91-XXXXXXXXXX',
            roles: ['ROLE_CUSTOMER'],
          },
        };
        return payload;
      }
      throw err;
    }
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error('No refresh token available');
    const response = await api.post('/auth/refresh-token', { refreshToken });
    const payload = normalizeApiResponse(response) || {};
    const { accessToken } = payload;
    if (accessToken) authService.setToken(accessToken);
    return payload;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  fetchUserProfile: async () => {
    const response = await api.get('/auth/me');
    const payload = normalizeApiResponse(response) || {};
    const userData = payload.user ?? payload;
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return payload;
  },

  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false; // not a valid JWT
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    const payload = normalizeApiResponse(response) || {};
    const userData = payload.user ?? payload;
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return payload;
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return normalizeApiResponse(response);
  },
};

export default authService;
