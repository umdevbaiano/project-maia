import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../utils/api';

interface Message {
    id: string;
    role: string;
    content: string;
    timestamp: string;
}

interface CaseChatPanelProps {
    casoId: string;
    casoTitulo: string;
    onClose: () => void;
}

export default function CaseChatPanel({ casoId, casoTitulo, onClose }: CaseChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchHistory();
    }, [casoId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/chat/history?caso_id=${casoId}`);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error fetching case chat history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        const userMsg = input.trim();
        setInput('');
        setSending(true);

        // Optimistic UI
        const tempUserMsg: Message = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: userMsg,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMsg]);

        // Add streaming AI message placeholder
        const streamingId = `streaming-${Date.now()}`;
        setMessages(prev => [
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
                body: JSON.stringify({ currentMessage: userMsg, caso_id: casoId }),
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
                            setMessages(prev =>
                                prev.map(msg =>
                                    msg.id === streamingId
                                        ? { ...msg, content: msg.content + data.chunk }
                                        : msg
                                )
                            );
                        }
                        if (data.done) {
                            setMessages(prev =>
                                prev.map(msg =>
                                    msg.id === streamingId ? { ...msg, id: `ai-${Date.now()}`, content: data.reply } : msg
                                )
                            );
                        }
                        if (data.error) throw new Error(data.error);
                    } catch (parseErr) {
                        // Skip malformed SSE lines silently
                    }
                }
            }
        } catch (error: any) {
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === streamingId
                        ? { ...msg, content: '⚠️ Erro ao processar sua mensagem. Tente novamente.', id: `err-${Date.now()}` }
                        : msg
                )
            );
        } finally {
            setSending(false);
        }
    };


    const handleClear = async () => {
        if (!confirm('Limpar histórico de chat deste processo?')) return;
        try {
            await api.delete(`/chat/clear?caso_id=${casoId}`);
            setMessages([]);
        } catch (error) {
            console.error('Error clearing chat:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950/40 rounded-2xl border border-violet-500/20 overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex flex-col border-b border-gray-200 dark:border-white/5 bg-violet-500/5 dark:bg-violet-500/10">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-[18px] h-[18px] text-violet-600 dark:text-violet-400" />
                        <div>
                            <span className="text-[0.8rem] font-bold text-violet-600 dark:text-violet-400">Chat do Processo</span>
                            <p className="m-0 text-[0.7rem] opacity-70 dark:opacity-60 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-gray-700 dark:text-white">
                                {casoTitulo}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={handleClear} className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white transition-colors rounded-md" title="Limpar histórico">
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white transition-colors rounded-md">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {/* Context Indicator Badge */}
                <div className="px-4 pb-2">
                    <div className="inline-flex items-center gap-1.5 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-[0.65rem] px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
                        Contexto restrito aos documentos deste processo
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {loading ? (
                    <div className="text-center p-8 opacity-50 dark:text-white text-gray-900">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center p-8 opacity-50 dark:opacity-40 text-gray-900 dark:text-white flex flex-col items-center">
                        <MessageSquare className="w-8 h-8 mb-2" />
                        <p className="m-0 text-[0.85rem]">Converse com a Maia sobre este processo</p>
                        <p className="m-1 text-[0.75rem]">
                            Ela tem acesso ao dados do caso, prazos e legislação
                        </p>
                    </div>
                ) : messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[85%] ${msg.role === 'user'
                            ? 'bg-violet-600 dark:bg-violet-500 text-white rounded-br-none shadow-sm'
                            : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 border border-gray-100 dark:border-white/10 rounded-bl-none shadow-sm'
                            }`}>

                            {msg.id && msg.id.toString().startsWith('streaming-') && msg.content === '' ? (
                                <div className="flex items-center gap-3 py-1">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce"></div>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Buscando no processo...</span>
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100 max-w-none text-sm font-[400] tracking-wide whitespace-pre-wrap">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>                    </div>
                ))}
                {sending && (
                    <div className="flex justify-start">
                        <div className="px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center gap-2 text-[0.85rem] opacity-60 text-gray-800 dark:text-zinc-100">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Maia está analisando o caso...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200 dark:border-white/5 flex gap-2">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Pergunte sobre o processo..."
                    disabled={sending}
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-[0.85rem] outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className={`px-3 py-2 rounded-xl border-none transition-all ${input.trim()
                        ? 'bg-gradient-to-br from-violet-600 to-violet-400 text-white cursor-pointer shadow-md'
                        : 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed'
                        }`}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>

            <style>{`
                .markdown-chat h2 { font-size: 0.95rem; font-weight: 700; margin: 0.5rem 0 0.25rem; }
                .markdown-chat h3 { font-size: 0.9rem; font-weight: 600; margin: 0.4rem 0 0.2rem; }
                .markdown-chat p { margin: 0.25rem 0; }
                .markdown-chat ul, .markdown-chat ol { margin: 0.25rem 0; padding-left: 1.25rem; }
                .markdown-chat li { margin: 0.1rem 0; }
                .markdown-chat strong { color: #8b5cf6; font-weight: 700; }
                .markdown-chat blockquote { border-left: 3px solid #7c3aed; padding-left: 0.75rem; margin: 0.5rem 0; opacity: 0.85; font-style: italic; }
                .markdown-chat table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; font-size: 0.8rem; }
                .markdown-chat th, .markdown-chat td { border: 1px solid rgba(128,128,128,0.3); padding: 0.3rem 0.5rem; text-align: left; }
                .markdown-chat th { background: rgba(124,58,237,0.1); font-weight: 600; }
                .markdown-chat hr { border: none; border-top: 1px solid rgba(128,128,128,0.3); margin: 0.5rem 0; }
                .markdown-chat code { background: rgba(128,128,128,0.15); padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.8rem; }
            `}</style>
        </div>
    );
}
