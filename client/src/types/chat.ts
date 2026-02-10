export interface ChatMessage {
  id?: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string | Date;
}

export interface QuickChatRequest {
  currentMessage: string;
  history?: ChatMessage[];
}

export interface QuickChatResponse {
  reply: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
}
