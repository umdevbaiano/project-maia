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
                                    msg.id === streamingId ? { ...msg, id: `ai-${Date.now()}` } : msg
                                )
                            );
                        }
                        if (data.error) throw new Error(data.error);
                    } catch {
                        // Skip malformed SSE lines
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
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: 'rgba(0,0,0,0.2)', borderRadius: '16px',
            border: '1px solid rgba(124,58,237,0.2)', overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(124,58,237,0.1)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} style={{ color: '#a78bfa' }} />
                    <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa' }}>Chat do Processo</span>
                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {casoTitulo}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={handleClear} style={{
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                        cursor: 'pointer', padding: '0.25rem',
                    }} title="Limpar histórico">
                        <Trash2 size={14} />
                    </button>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                        cursor: 'pointer', padding: '0.25rem',
                    }}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '2rem', opacity: 0.4,
                    }}>
                        <MessageSquare size={32} style={{ marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Converse com a Maia sobre este processo</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem' }}>
                            Ela tem acesso ao dados do caso, prazos e legislação
                        </p>
                    </div>
                ) : messages.map(msg => (
                    <div key={msg.id} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                        <div style={{
                            maxWidth: '85%', padding: '0.65rem 0.85rem', borderRadius: '12px',
                            background: msg.role === 'user'
                                ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                                : 'rgba(255,255,255,0.05)',
                            border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                        }}>
                            {msg.role === 'user' ? msg.content : (
                                <div className="markdown-chat">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {sending && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                            padding: '0.65rem 0.85rem', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.6,
                        }}>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            Maia está analisando o caso...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: '0.5rem',
            }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Pergunte sobre o processo..."
                    disabled={sending}
                    style={{
                        flex: 1, padding: '0.6rem 0.75rem', borderRadius: '10px',
                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: '0.85rem', outline: 'none',
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    style={{
                        background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : 'rgba(255,255,255,0.05)',
                        border: 'none', borderRadius: '10px', padding: '0.6rem 0.75rem',
                        color: '#fff', cursor: input.trim() ? 'pointer' : 'not-allowed',
                    }}
                >
                    <Send size={16} />
                </button>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .markdown-chat h2 { font-size: 0.95rem; font-weight: 700; margin: 0.5rem 0 0.25rem; }
                .markdown-chat h3 { font-size: 0.9rem; font-weight: 600; margin: 0.4rem 0 0.2rem; }
                .markdown-chat p { margin: 0.25rem 0; }
                .markdown-chat ul, .markdown-chat ol { margin: 0.25rem 0; padding-left: 1.25rem; }
                .markdown-chat li { margin: 0.1rem 0; }
                .markdown-chat strong { color: #c4b5fd; }
                .markdown-chat blockquote { border-left: 3px solid #7c3aed; padding-left: 0.75rem; margin: 0.5rem 0; opacity: 0.85; font-style: italic; }
                .markdown-chat table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; font-size: 0.8rem; }
                .markdown-chat th, .markdown-chat td { border: 1px solid rgba(255,255,255,0.1); padding: 0.3rem 0.5rem; text-align: left; }
                .markdown-chat th { background: rgba(124,58,237,0.15); font-weight: 600; }
                .markdown-chat hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 0.5rem 0; }
                .markdown-chat code { background: rgba(0,0,0,0.3); padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.8rem; }
            `}</style>
        </div>
    );
}
