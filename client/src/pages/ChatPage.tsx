import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, Trash2, Scale, Upload, FileText, CheckCircle2, XCircle, Paperclip, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { chatApi } from '../utils/api';
import type { ChatMessage } from '../types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VoiceInput from '../components/VoiceInput';
import { useTheme } from '../contexts/ThemeContext';

interface UploadedDoc {
  id: string;
  filename: string;
  chunk_count: number;
  status: 'uploading' | 'completed' | 'error';
  message?: string;
}

const THINKING_STEPS = [
  '🔍 Lendo sua pergunta...',
  '📚 Consultando legislação...',
  '⚖️ Analisando contexto jurídico...',
  '✍️ Formulando resposta...',
  '🔎 Verificando fundamentação...',
];

const ThinkingIndicator: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % THINKING_STEPS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative w-5 h-5 flex-shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 dark:border-blue-400/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
      </div>
      <span 
        className="text-sm text-gray-500 dark:text-zinc-400 font-medium transition-all duration-500"
        key={stepIndex}
        style={{ animation: 'fadeInUp 0.4s ease-out' }}
      >
        {THINKING_STEPS[stepIndex]}
      </span>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useTheme();

  useEffect(() => {
    loadHistory();
    loadDocuments();
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
      console.log('Starting fresh chat session');
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('maia_token');
      const res = await fetch(`${apiUrl}/documents/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedDocs(
          (data.documents || []).map((d: any) => ({
            id: d.id,
            filename: d.filename,
            chunk_count: d.chunk_count,
            status: 'completed' as const,
          }))
        );
      }
    } catch {
      // silently fail — demo mode may start fresh
    }
  };

  const handleAttachFiles = (files: FileList | File[]) => {
    const allowedExts = ['pdf', 'txt', 'docx'];
    const validFiles = Array.from(files).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return allowedExts.includes(ext);
    });
    if (validFiles.length > 0) {
      setPendingFile(validFiles[0]);
      if (!inputValue.trim()) {
        setInputValue('Analise este documento e identifique pontos de melhoria.');
      }
    }
  };

  const handleUploadAndIndex = async (file: File) => {
    setIsUploading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('maia_token');
    const tempId = `uploading-${Date.now()}-${file.name}`;
    setUploadedDocs((prev) => [
      ...prev,
      { id: tempId, filename: file.name, chunk_count: 0, status: 'uploading' },
    ]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiUrl}/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setUploadedDocs((prev) =>
        prev.map((d) =>
          d.id === tempId
            ? { id: data.id, filename: data.filename, chunk_count: data.chunk_count, status: 'completed', message: data.message }
            : d
        )
      );
    } catch {
      setUploadedDocs((prev) =>
        prev.map((d) => (d.id === tempId ? { ...d, status: 'error', message: 'Falha' } : d))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeDocumentWithInstruction = async (file: File, instruction: string) => {
    setIsLoading(true);
    setPendingFile(null);

    // Show user message with file indicator
    const userMsg: ChatMessage = {
      role: 'user',
      content: `📄 [${file.name}] ${instruction}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Start streaming placeholder
    const streamingId = 'streaming-' + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: streamingId, role: 'ai', content: '', timestamp: new Date().toISOString() },
    ]);

    // Background: index for future RAG queries
    handleUploadAndIndex(file);

    // Foreground: analyze with instruction via streaming
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('maia_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('instruction', instruction);

      const response = await fetch(`${apiUrl}/chat/analyze`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) throw new Error('Analyze request failed');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.chunk) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingId ? { ...msg, content: msg.content + data.chunk } : msg
                )
              );
            }
            if (data.done) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingId ? { ...msg, id: undefined, content: data.reply } : msg
                )
              );
            }
            if (data.error) throw new Error(data.error);
          } catch {}
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingId
            ? { ...msg, content: 'Erro ao analisar o documento. Tente novamente.', id: undefined }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleAttachFiles(e.dataTransfer.files);
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const messageText = inputValue;
    setInputValue('');

    // If there's a pending file, use the analyze flow
    if (pendingFile) {
      await analyzeDocumentWithInstruction(pendingFile, messageText);
    } else {
      await sendMessage(messageText);
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



  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

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
        body: JSON.stringify({ currentMessage: messageText }),
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
        const lines = buffer.split('\n');
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

  const completedDocs = uploadedDocs.filter((d) => d.status === 'completed');

  return (
    <div
      className="h-screen flex flex-col bg-gray-50 dark:bg-zinc-950 relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-600/10 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-blue-500 rounded-xl m-4 pointer-events-none">
          <div className="text-center">
            <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-bounce" />
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">Solte o documento aqui</p>
            <p className="text-sm text-blue-500/70 mt-2">PDF, TXT ou DOCX • Máx 10MB</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.docx"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleAttachFiles(e.target.files)}
      />

      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-3 group"
            >
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tighter text-gray-900 dark:text-white hidden sm:block">MAIA</span>
            </Link>
            <div className="h-8 w-px bg-gray-200 dark:bg-zinc-700" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500/30">
                <img src="/maia-avatar.png" alt="Maia" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Maia — Assistente Jurídica</h1>
                <p className="text-xs text-gray-500 dark:text-zinc-400">IA com Grounding em Doutrina • Anti-Alucinação</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Document counter badge */}
            {completedDocs.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold">
                <FileText className="w-3 h-3" />
                {completedDocs.length} doc{completedDocs.length !== 1 ? 's' : ''} na base
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RAG Ativo
            </span>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-white rounded-lg transition-colors"
              aria-label="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Limpar</span>
            </button>
          </div>
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
              <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 max-w-lg shadow-2xl">
                <img src="/maia-avatar.png" alt="Maia" className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-white dark:border-zinc-800 shadow-xl object-cover drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <h2 className="text-2xl tracking-tight font-medium text-gray-900 dark:text-white mb-3">
                  Olá! Eu sou a Maia ⚖️
                </h2>
                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-4 font-light">
                  Sua assistente jurídica com base em <strong>legislação real</strong> — CLT, Código Penal, CPC, Constituição Federal e mais 10 leis federais indexadas. Pode me perguntar qualquer coisa ou enviar um documento para análise.
                </p>

                {/* Upload CTA */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mb-6 flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 group"
                >
                  <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">Enviar Documento Jurídico</span>
                </button>

                <p className="text-xs text-gray-400 dark:text-zinc-500 mb-6">
                  ou arraste e solte um arquivo em qualquer lugar da tela
                </p>

                <div className="grid grid-cols-1 gap-3 text-left">
                  {[
                    { emoji: '📄', text: 'Envie um contrato e peça para identificar cláusulas abusivas' },
                    { emoji: '⚖️', text: 'Envie uma petição e peça uma análise dos fundamentos' },
                    { emoji: '📋', text: 'Envie um acórdão e peça um resumo executivo' },
                  ].map((suggestion, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200/50 dark:border-zinc-700/30 p-4 rounded-2xl"
                    >
                      <p className="text-sm text-gray-500 dark:text-zinc-400 font-light">
                        {suggestion.emoji} <span className="ml-1">{suggestion.text}</span>
                      </p>
                    </div>
                  ))}
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
                      <ThinkingIndicator />
                    ) : message.id && message.id.toString().startsWith('streaming-') && message.content.length < 30 ? (
                      <div>
                        <div className="prose dark:prose-invert prose-sm max-w-none leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                          <span className="text-xs text-gray-400 dark:text-zinc-500 italic">digitando...</span>
                        </div>
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

      {/* Uploaded Documents Bar */}
      {uploadedDocs.length > 0 && (
        <div className="border-t border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-6 py-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-zinc-500 tracking-wider whitespace-nowrap">Base RAG:</span>
              {uploadedDocs.map((doc) => (
                <span
                  key={doc.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    doc.status === 'completed'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : doc.status === 'uploading'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {doc.status === 'completed' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : doc.status === 'uploading' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {doc.filename.length > 25 ? doc.filename.slice(0, 22) + '...' : doc.filename}
                  {doc.status === 'completed' && doc.chunk_count > 0 && (
                    <span className="text-[10px] opacity-60">({doc.chunk_count})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area - Floating Command Bar */}
      <div className="pb-8">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleAttachFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            {/* Pending file indicator bar */}
            {pendingFile && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">{pendingFile.name}</span>
                    <span className="text-xs text-blue-500 dark:text-blue-400">
                      ({(pendingFile.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => { setPendingFile(null); setInputValue(''); }}
                    className="p-1 text-blue-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: '🔍 Analise erros', value: 'Analise este documento e identifique erros formais e materiais, sugerindo correções.' },
                    { label: '📋 Resuma', value: 'Faça um resumo executivo deste documento, destacando os pontos mais importantes.' },
                    { label: '⚠️ Cláusulas abusivas', value: 'Identifique cláusulas potencialmente abusivas ou desfavoráveis neste documento.' },
                    { label: '💡 Melhore', value: 'Analise este documento e sugira melhorias na argumentação e fundamentação jurídica.' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => setInputValue(action.value)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 items-center">
              <VoiceInput 
                onTranscript={(text) => setInputValue(prev => prev + ' ' + text)} 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`p-3 rounded-xl border transition-colors disabled:opacity-50 ${
                  pendingFile
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                title="Enviar documento (PDF, TXT, DOCX)"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={pendingFile ? `O que deseja que eu faça com "${pendingFile.name}"?` : completedDocs.length > 0 ? "Pergunte sobre seus documentos..." : "Envie um documento ou digite sua pergunta..."}
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
                    <span className="hidden sm:inline">Analisando...</span>
                  </>
                ) : (
                  <>
                    {pendingFile ? <Sparkles className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                    <span className="hidden sm:inline">{pendingFile ? 'Analisar' : 'Enviar'}</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3 text-center">
              Enter para enviar • Arraste PDFs para análise inteligente • Respostas fundamentadas em documentos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
