import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../utils/api';
import type { ChatMessage } from '../types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await chatApi.getHistory();
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add streaming AI message placeholder
    const streamingId = 'streaming-' + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: streamingId, role: 'ai', content: '', timestamp: new Date().toISOString() },
    ]);

    try {
      const token = localStorage.getItem('maia_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentMessage: userMessage.content }),
      });

      if (!response.ok) throw new Error('Stream request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingId
                    ? { ...msg, content: msg.content + data.chunk }
                    : msg
                )
              );
            }
            if (data.done) {
              // Remove the streaming ID so it becomes a normal message
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingId ? { ...msg, id: undefined } : msg
                )
              );
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingId
            ? { ...msg, content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.', id: undefined }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de conversas?')) {
      try {
        await chatApi.clearHistory();
        setMessages([]);
      } catch (error) {
        console.error('Error clearing history:', error);
        alert('Erro ao limpar histórico. Tente novamente.');
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Maia - Assistente Jurídica</h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Especializada em Direito Brasileiro</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-white rounded-lg transition-colors"
            aria-label="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">Limpar Histórico</span>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 max-w-md shadow-2xl">
                <Bot className="w-16 h-16 mx-auto mb-6 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <h2 className="text-2xl tracking-tight font-medium text-gray-900 dark:text-white mb-3">
                  Olá! Como posso ajudar na sua pesquisa jurídica hoje?
                </h2>
                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-6 font-light">
                  Sou a Maia, sua inteligência artificial focada em direito brasileiro.
                  Você pode me pedir estatísticas, formatação de peças ou dúvidas processuais.
                </p>
                <div className="grid grid-cols-1 gap-3 text-left">
                  <div className="bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-gray-200/50 dark:border-zinc-700/30 p-4 rounded-2xl">
                    <p className="text-sm text-gray-700 dark:text-zinc-300 font-light">
                      💡 <span className="ml-1 tracking-wide">Qual o prazo atual para contestação em ação trabalhista?</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-gray-200/50 dark:border-zinc-700/30 p-4 rounded-2xl">
                    <p className="text-sm text-gray-700 dark:text-zinc-300 font-light">
                      📝 <span className="ml-1 tracking-wide">Você pode me ajudar a redigir uma petição inicial?</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-gray-200/50 dark:border-zinc-700/30 p-4 rounded-2xl">
                    <p className="text-sm text-gray-700 dark:text-zinc-300 font-light">
                      ⚖️ <span className="ml-1 tracking-wide">Me explique os requisitos da Lei Maria da Penha</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'ai' && (
                    <div className="mr-3 mt-1">
                      <div className="bg-blue-600 p-2 rounded-lg">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-6 py-4 ${message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-100 border border-gray-200 dark:border-zinc-800'
                      }`}
                  >
                    {message.id === 'typing' ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{message.content}</span>
                      </div>
                    ) : (
                      <div className="prose dark:prose-invert prose-sm max-w-none leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 opacity-80">
                      {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Floating Command Bar */}
      <div className="pb-8">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta jurídica..."
                className="flex-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-5 py-3 text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                aria-label="Send message"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Enviar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3 text-center">
              Pressione Enter para enviar • Shift+Enter para nova linha
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
