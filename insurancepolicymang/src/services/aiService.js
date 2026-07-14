import api from './api';
import { normalizeApiResponse } from '../utils/helpers';

const aiService = {
  sendMessage: async (message, conversationId = null) => {
    const payload = { message };
    if (conversationId) payload.conversationId = conversationId;
    const response = await api.post('/ai/chat', payload);
    return normalizeApiResponse(response);
  },

  getConversations: async () => {
    const response = await api.get('/ai/conversations');
    return normalizeApiResponse(response);
  },

  getConversationMessages: async (conversationId) => {
    const response = await api.get(`/ai/conversations/${conversationId}`);
    return normalizeApiResponse(response);
  },

  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/ai/conversations/${conversationId}`);
    return normalizeApiResponse(response);
  },

  getRecommendations: async () => {
    const response = await api.get('/ai/recommendations');
    return normalizeApiResponse(response);
  },

  summarizePolicy: async (policyId) => {
    const response = await api.post('/ai/summarize-policy', { policyId });
    return normalizeApiResponse(response);
  },

  getSuggestedPrompts: async () => {
    const response = await api.get('/ai/suggested-prompts');
    return normalizeApiResponse(response);
  },
};

export default aiService;
