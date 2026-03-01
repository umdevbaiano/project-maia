import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Trash2, ArrowLeft } from 'lucide-react';
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

      // Read stream
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last partial line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmedLine.slice(6));

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
                  msg.id === streamingId ? { ...msg, id: undefined, content: data.reply } : msg
                )
              );
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            // Skip malformed SSE lines silently
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
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500/30">
                <img src="/maia-avatar.png" alt="Maia" className="w-full h-full object-cover" />
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
                <img src="/maia-avatar.png" alt="Maia" className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-white dark:border-zinc-800 shadow-xl object-cover drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
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
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-sm flex-shrink-0">
                        <img src="/maia-avatar.png" alt="Maia" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-6 py-4 ${message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-100 border border-gray-200 dark:border-zinc-800'
                      }`}
                  >
                    {message.id && message.id.toString().startsWith('streaming-') && message.content === '' ? (
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-zinc-600 animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-zinc-600 animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-zinc-600 animate-bounce"></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-zinc-500 font-medium">Maia está analisando...</span>
                      </div>
                    ) : (
                      <div className="prose dark:prose-invert prose-sm max-w-none leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    )}
                    <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo'
                      })}
                    </span>
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
