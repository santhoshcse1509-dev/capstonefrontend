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
    const response = await api.post('/auth/verify-mfa', { tempToken, totpCode });
    const payload = normalizeApiResponse(response) || {};
    return persistAuth(payload);
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const payload = normalizeApiResponse(response) || {};
    const { accessToken, refreshToken, user } = payload;
    if (accessToken) authService.setToken(accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    return payload;
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
