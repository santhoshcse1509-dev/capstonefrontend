import api from './api';
import { normalizeApiResponse } from '../utils/helpers';

const notificationService = {
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return normalizeApiResponse(response);
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return normalizeApiResponse(response);
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return normalizeApiResponse(response);
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return normalizeApiResponse(response);
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return normalizeApiResponse(response);
  },
};

export default notificationService;
