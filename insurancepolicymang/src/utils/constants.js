export const API_BASE_URL = '/api';

export const ROLES = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
  AGENT: 'AGENT',
  UNDERWRITER: 'UNDERWRITER',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/',
  POLICIES: '/policies',
  POLICY_DETAIL: '/policies/:id',
  CLAIMS: '/claims',
  NEW_CLAIM: '/claims/new',
  PAYMENTS: '/payments',
  PROFILE: '/profile',
  AI_ASSISTANT: '/ai-assistant',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_POLICIES: '/admin/policies',
  ADMIN_CLAIMS: '/admin/claims',
};

export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
};

export const POLICY_TYPES = [
  { value: 'HEALTH', label: 'Health Insurance', icon: 'HeartPulse' },
  { value: 'LIFE', label: 'Life Insurance', icon: 'Shield' },
  { value: 'MOTOR', label: 'Motor Insurance', icon: 'Car' },
  { value: 'TRAVEL', label: 'Travel Insurance', icon: 'Plane' },
  { value: 'HOME', label: 'Home Insurance', icon: 'Home' },
];

export const CLAIM_STATUS = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SETTLED: 'SETTLED',
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

export const TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'auth_user';
export const THEME_KEY = 'app_theme';
