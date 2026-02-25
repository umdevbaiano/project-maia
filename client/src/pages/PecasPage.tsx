import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Copy, Check, Loader2, Briefcase, ChevronDown, Download, Edit2, Save, X, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../utils/api';
import { Peca, TIPO_PECA_OPTIONS } from '../types/peca';

interface Cliente {
    id: string;
    nome: string;
    documento: string;
}

interface Caso {
    id: string;
    titulo: string;
    numero: string;
}

export default function PecasPage() {
    const [pecas, setPecas] = useState<Peca[]>([]);
    const [casos, setCasos] = useState<Caso[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedPeca, setSelectedPeca] = useState<Peca | null>(null);
    const [copied, setCopied] = useState(false);

    // Form state
    const [tipo, setTipo] = useState('peticao_inicial');
    const [casoId, setCasoId] = useState('');
    const [instrucoes, setInstrucoes] = useState('');

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [editedCasoId, setEditedCasoId] = useState('');
    const [editedClienteId, setEditedClienteId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPecas();
        fetchCasos();
        fetchClientes();
    }, []);

    const fetchPecas = async () => {
        setLoading(true);
        try {
            const response = await api.get('/pecas/');
            setPecas(response.data.pecas || []);
        } catch (error) {
            console.error('Error fetching pecas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCasos = async () => {
        try {
            const response = await api.get('/casos/');
            setCasos(response.data.casos || []);
        } catch (error) {
            console.error('Error fetching casos:', error);
        }
    };

    const fetchClientes = async () => {
        try {
            const response = await api.get('/clientes/');
            setClientes(response.data.clientes || []);
        } catch (error) {
            console.error('Error fetching clientes:', error);
        }
    };

    const handleGenerate = async () => {
        if (instrucoes.length < 10) return;
        setGenerating(true);
        try {
            const response = await api.post('/pecas/generate', {
                tipo,
                caso_id: casoId || undefined,
                instrucoes,
            });
            const newPeca = response.data;
            setPecas([newPeca, ...pecas]);
            setSelectedPeca(newPeca);
            setShowForm(false);
            setInstrucoes('');
            setCasoId('');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Erro ao gerar peça');
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta peça?')) return;
        try {
            await api.delete(`/pecas/${id}`);
            setPecas(pecas.filter(p => p.id !== id));
            if (selectedPeca?.id === id) {
                setSelectedPeca(null);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error deleting peca:', error);
        }
    };

    const handleSelectPeca = (p: Peca) => {
        setSelectedPeca(p);
        setIsEditing(false);
        setEditedContent(p.conteudo);
        setEditedCasoId(p.caso_id || '');
        setEditedClienteId(p.cliente_id || '');
    };

    const handleUpdate = async () => {
        if (!selectedPeca) return;
        setSaving(true);
        try {
            const updates = {
                conteudo: editedContent,
                caso_id: editedCasoId || null,
                cliente_id: editedClienteId || null,
            };
            const response = await api.put(`/pecas/${selectedPeca.id}`, updates);
            const updatedPeca = response.data;
            setPecas(pecas.map(p => p.id === updatedPeca.id ? updatedPeca : p));
            setSelectedPeca(updatedPeca);
            setIsEditing(false);
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Erro ao atualizar peça');
        } finally {
            setSaving(false);
        }
    };

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadDocx = async (pecaId: string) => {
        try {
            const response = await api.get(`/pecas/${pecaId}/download`, {
                responseType: 'blob',
            });
            let filename = `peca_${pecaId}.docx`;
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('filename') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                    filename = decodeURIComponent(filename);
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading DOCX:', error);
            alert('Erro ao baixar o documento.');
        }
    };

    const tipoLabel = TIPO_PECA_OPTIONS.find(t => t.value === tipo)?.label || '';

    return (
        <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 5rem)' }}>
            {/* Left Panel: List + Generate */}
            <div style={{
                width: '380px', minWidth: '380px',
                display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={22} style={{ color: '#a78bfa' }} /> Peças Jurídicas
                    </h2>
                    <button onClick={() => setShowForm(!showForm)} style={{
                        background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                        border: 'none', borderRadius: '10px', padding: '0.5rem 1rem',
                        color: '#fff', cursor: 'pointer', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem',
                    }}>
                        <Plus size={16} /> Nova Peça
                    </button>
                </div>

                {/* Generate Form */}
                {showForm && (
                    <div style={{
                        background: 'rgba(124,58,237,0.08)',
                        borderRadius: '16px', border: '1px solid rgba(124,58,237,0.2)',
                        padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                            Tipo de Peça
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select value={tipo} onChange={e => setTipo(e.target.value)} style={{
                                width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px',
                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '0.9rem', appearance: 'none', cursor: 'pointer',
                            }}>
                                {TIPO_PECA_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value} style={{ background: '#1a1a2e' }}>{o.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }} />
                        </div>

                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                            Vincular a Processo (opcional)
                        </label>
                        <select value={casoId} onChange={e => setCasoId(e.target.value)} style={{
                            width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px',
                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', fontSize: '0.9rem',
                        }}>
                            <option value="" style={{ background: '#1a1a2e' }}>Nenhum processo</option>
                            {casos.map(c => (
                                <option key={c.id} value={c.id} style={{ background: '#1a1a2e' }}>
                                    {c.numero ? `${c.numero} — ` : ''}{c.titulo}
                                </option>
                            ))}
                        </select>

                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                            Instruções para a Maia
                        </label>
                        <textarea
                            value={instrucoes}
                            onChange={e => setInstrucoes(e.target.value)}
                            placeholder="Descreva os detalhes da peça: partes, fatos, pedidos, fundamentação desejada..."
                            rows={5}
                            style={{
                                width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px',
                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit',
                            }}
                        />

                        <button
                            onClick={handleGenerate}
                            disabled={generating || instrucoes.length < 10}
                            style={{
                                background: generating ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                border: 'none', borderRadius: '10px', padding: '0.75rem',
                                color: '#fff', cursor: generating ? 'not-allowed' : 'pointer',
                                fontWeight: 700, fontSize: '0.95rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            }}
                        >
                            {generating ? (
                                <><Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Maia está gerando...</>
                            ) : (
                                <><FileText size={18} /> Gerar {tipoLabel}</>
                            )}
                        </button>
                    </div>
                )}

                {/* Pecas List */}
                <div style={{
                    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Carregando...</div>
                    ) : pecas.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '3rem 1.5rem',
                            background: 'rgba(255,255,255,0.02)', borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p style={{ opacity: 0.5, margin: 0 }}>Nenhuma peça gerada ainda</p>
                            <p style={{ opacity: 0.3, margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
                                Clique em "Nova Peça" para começar
                            </p>
                        </div>
                    ) : pecas.map(p => (
                        <div
                            key={p.id}
                            onClick={() => handleSelectPeca(p)}
                            style={{
                                padding: '1rem 1.25rem', borderRadius: '12px', cursor: 'pointer',
                                background: selectedPeca?.id === p.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${selectedPeca?.id === p.id ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                                        color: '#a78bfa', letterSpacing: '0.05em',
                                    }}>
                                        {p.tipo_label}
                                    </span>
                                    <h4 style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.3 }}>
                                        {p.titulo}
                                    </h4>
                                    {p.caso_titulo && (
                                        <span style={{ fontSize: '0.75rem', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                                            <Briefcase size={12} /> {p.caso_titulo}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                    style={{
                                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                                        cursor: 'pointer', padding: '0.25rem',
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '0.5rem' }}>
                                {new Date(p.created_at).toLocaleString('pt-BR')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Document Preview */}
            <div style={{
                flex: 1, borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
                {selectedPeca ? (
                    <>
                        {/* Doc Header */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' }}>
                                    {selectedPeca.tipo_label}
                                </span>
                                <h3 style={{ margin: '0.25rem 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
                                    {selectedPeca.titulo}
                                </h3>

                                {isEditing ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <select value={editedClienteId} onChange={e => setEditedClienteId(e.target.value)} style={{
                                            padding: '0.4rem 0.5rem', borderRadius: '6px', width: '150px',
                                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff', fontSize: '0.75rem',
                                        }}>
                                            <option value="">Sem Cliente vinculado</option>
                                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                        </select>
                                        <select value={editedCasoId} onChange={e => setEditedCasoId(e.target.value)} style={{
                                            padding: '0.4rem 0.5rem', borderRadius: '6px', width: '150px',
                                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff', fontSize: '0.75rem',
                                        }}>
                                            <option value="">Sem Processo vinculado</option>
                                            {casos.map(c => <option key={c.id} value={c.id}>{c.numero || c.titulo}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', opacity: 0.6 }}>
                                        {selectedPeca.cliente_nome && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={12} /> {selectedPeca.cliente_nome}</span>
                                        )}
                                        {selectedPeca.caso_titulo && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Briefcase size={12} /> {selectedPeca.caso_titulo}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {isEditing ? (
                                    <>
                                        <button onClick={() => setIsEditing(false)} style={{
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px', padding: '0.5rem 1rem', color: '#fff', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem',
                                        }}>
                                            <X size={16} /> Cancelar
                                        </button>
                                        <button onClick={handleUpdate} disabled={saving} style={{
                                            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', border: 'none',
                                            borderRadius: '10px', padding: '0.5rem 1rem', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem',
                                        }}>
                                            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Salvar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setIsEditing(true)} style={{
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px', padding: '0.5rem 1rem', color: '#fff', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem',
                                        }}>
                                            <Edit2 size={16} /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDownloadDocx(selectedPeca.id)}
                                            style={{
                                                background: 'rgba(34,197,94,0.1)',
                                                border: '1px solid rgba(34,197,94,0.2)',
                                                borderRadius: '10px', padding: '0.5rem 1rem',
                                                color: '#22c55e', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem',
                                            }}
                                        >
                                            <Download size={16} /> DOCX
                                        </button>
                                        <button
                                            onClick={() => handleCopy(selectedPeca.conteudo)}
                                            style={{
                                                background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: '10px', padding: '0.5rem 1rem',
                                                color: copied ? '#22c55e' : '#fff', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem',
                                            }}
                                        >
                                            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                        </button>
                                    </div>
                            </div>

                            {/* Doc Content */}
                            {isEditing ? (
                                <textarea
                                    value={editedContent}
                                    onChange={e => setEditedContent(e.target.value)}
                                    style={{
                                        flex: 1, padding: '1.5rem 2rem', background: 'transparent',
                                        border: 'none', color: '#fff', fontSize: '0.95rem',
                                        fontFamily: '"JetBrains Mono", "Courier New", monospace', resize: 'none',
                                        lineHeight: 1.6, outline: 'none'
                                    }}
                                />
                            ) : (
                                <div className="markdown-peca" style={{
                                    flex: 1, overflowY: 'auto', padding: '1.5rem 2rem',
                                    fontSize: '0.95rem', lineHeight: 1.8,
                                    fontFamily: '"Inter", sans-serif',
                                }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedPeca.conteudo}</ReactMarkdown>
                                </div>
                            )}
                        </>
                        ) : (
                        <div style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', opacity: 0.3,
                        }}>
                            <FileText size={64} style={{ marginBottom: '1rem' }} />
                            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Selecione ou gere uma peça</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                A Maia vai gerar o documento com base na legislação brasileira
                            </p>
                        </div>
                    )}
                    </div>

                <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                    .markdown-peca h1 { font-size: 1.3rem; font-weight: 800; margin: 1rem 0 0.5rem; text-align: center; text-transform: uppercase; }
                    .markdown-peca h2 { font-size: 1.1rem; font-weight: 700; margin: 0.75rem 0 0.35rem; text-transform: uppercase; }
                    .markdown-peca h3 { font-size: 1rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
                    .markdown-peca p { margin: 0.4rem 0; text-align: justify; }
                    .markdown-peca ul, .markdown-peca ol { margin: 0.4rem 0; padding-left: 1.5rem; }
                    .markdown-peca li { margin: 0.2rem 0; }
                    .markdown-peca strong { color: #c4b5fd; }
                    .markdown-peca blockquote { border-left: 3px solid #7c3aed; padding-left: 1rem; margin: 0.75rem 0; opacity: 0.85; font-style: italic; }
                    .markdown-peca table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
                    .markdown-peca th, .markdown-peca td { border: 1px solid rgba(255,255,255,0.1); padding: 0.4rem 0.75rem; text-align: left; }
                    .markdown-peca th { background: rgba(124,58,237,0.15); font-weight: 600; }
                    .markdown-peca hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 1rem 0; }
                    .markdown-peca code { background: rgba(0,0,0,0.3); padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.85rem; }
                `}</style>
            </div>
            );
}
