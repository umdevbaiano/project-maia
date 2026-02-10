import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../utils/api';
import type { ChatMessage } from '../types/chat';
import ReactMarkdown from 'react-markdown';

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

    const typingMessage: ChatMessage = {
      id: 'typing',
      role: 'ai',
      content: 'Digitando...',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const response = await chatApi.sendQuickMessage({
        currentMessage: userMessage.content,
      });

      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== 'typing');
        return [
          ...filtered,
          {
            role: 'ai',
            content: response.reply,
            timestamp: new Date().toISOString(),
          },
        ];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== 'typing');
        return [
          ...filtered,
          {
            role: 'ai',
            content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
            timestamp: new Date().toISOString(),
          },
        ];
      });
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
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Maia - Assistente Jurídica</h1>
                <p className="text-sm text-zinc-400">Especializada em Direito Brasileiro</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors"
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
              <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 max-w-md">
                <Bot className="w-16 h-16 mx-auto mb-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-white mb-3">
                  Olá! Sou a Maia
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-6">
                  Sua assistente jurídica especializada em direito brasileiro.
                  Posso ajudá-lo com pesquisa jurídica, redação de peças,
                  análise de casos e muito mais.
                </p>
                <div className="grid grid-cols-1 gap-3 text-left">
                  <div className="bg-zinc-800 p-3 rounded-lg">
                    <p className="text-sm text-zinc-300">
                      💡 "Qual o prazo para contestação em ação trabalhista?"
                    </p>
                  </div>
                  <div className="bg-zinc-800 p-3 rounded-lg">
                    <p className="text-sm text-zinc-300">
                      📝 "Me ajude a redigir uma petição inicial"
                    </p>
                  </div>
                  <div className="bg-zinc-800 p-3 rounded-lg">
                    <p className="text-sm text-zinc-300">
                      ⚖️ "Explique o artigo 927 do Código Civil"
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
                    className={`max-w-[80%] rounded-lg px-6 py-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                    }`}
                  >
                    {message.id === 'typing' ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{message.content}</span>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                    <div className="mt-2 text-xs opacity-60">
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta jurídica..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-5 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
            <p className="text-xs text-zinc-500 mt-3 text-center">
              Pressione Enter para enviar • Shift+Enter para nova linha
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
