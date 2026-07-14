import { useState } from 'react';
import aiService from '../services/aiService';
import { normalizeApiResponse } from '../utils/helpers';

export const useAI = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const sendMessage = async (text) => {
    setLoading(true);
    // Append user message
    const userMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = normalizeApiResponse(await aiService.sendMessage(text, sessionId));
      const aiMessage = { role: 'assistant', content: response?.response || response?.message || 'I’m here to help with your policy questions.', timestamp: new Date() };
      setMessages((prev) => [...prev, aiMessage]);
      if (!sessionId && response?.sessionId) {
        setSessionId(response.sessionId);
      }
    } catch (error) {
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an issue connecting to my core brain.', timestamp: new Date() };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendation = async (profileData) => {
    setLoading(true);
    try {
      const res = normalizeApiResponse(await aiService.getRecommendations(profileData));
      return res?.data ?? res ?? [];
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, getRecommendation, loading };
};
