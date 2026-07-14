export const formatCurrency = (amount, currency = 'USD') => {
  if (amount == null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  try {
    return new Date(dateString).toLocaleDateString('en-US', defaultOptions);
  } catch {
    return 'Invalid Date';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const getStatusColor = (status) => {
  const colors = {
    ACTIVE: 'success',
    APPROVED: 'success',
    COMPLETED: 'success',
    SETTLED: 'success',
    PENDING: 'warning',
    UNDER_REVIEW: 'warning',
    SUBMITTED: 'info',
    REJECTED: 'error',
    FAILED: 'error',
    EXPIRED: 'neutral',
    CANCELLED: 'neutral',
    REFUNDED: 'info',
    INACTIVE: 'neutral',
  };
  return colors[status?.toUpperCase()] || 'neutral';
};

export const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || '??';
};

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const normalizeApiResponse = (response) => {
  if (!response) return null;

  if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    if ('data' in response.data && response.data.data !== undefined) {
      return response.data.data;
    }

    if ('success' in response.data || 'message' in response.data || 'error' in response.data) {
      return response.data;
    }
  }

  return response.data ?? response;
};

export const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 11);
};

export const debounce = (func, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
