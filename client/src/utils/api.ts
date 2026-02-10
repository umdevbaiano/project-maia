import axios from 'axios';
import type { ChatHistoryResponse, QuickChatRequest, QuickChatResponse } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatApi = {
  getHistory: async (): Promise<ChatHistoryResponse> => {
    const response = await api.get<ChatHistoryResponse>('/chat/history');
    return response.data;
  },

  sendQuickMessage: async (request: QuickChatRequest): Promise<QuickChatResponse> => {
    const response = await api.post<QuickChatResponse>('/chat/quick', request);
    return response.data;
  },

  clearHistory: async (): Promise<void> => {
    await api.delete('/chat/clear');
  },
};

export default api;
