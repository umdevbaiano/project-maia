import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Trash2, Edit3, X, Loader2, MessageSquare, FileText, Clock, Users, Zap } from 'lucide-react';
import CaseChatPanel from '../components/CaseChatPanel';
import DocumentPanel from '../components/DocumentPanel';
import api from '../utils/api';
import type { Caso, CasoCreateRequest, CasoStatus, CasoTipo } from '../types/caso';
import { STATUS_LABELS, TIPO_LABELS, STATUS_COLORS } from '../types/caso';
import type { Cliente } from '../types/cliente';

const CasosPage: React.FC = () => {
    const [casos, setCasos] = useState<Caso[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCaso, setEditingCaso] = useState<Caso | null>(null);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [form, setForm] = useState<CasoCreateRequest & { cliente_id?: string }>({
        numero: '', titulo: '', tipo: 'civel', status: 'em_andamento',
    });
    const [saving, setSaving] = useState(false);
    const [chatCaso, setChatCaso] = useState<Caso | null>(null);
    const [activePanelCaso, setActivePanelCaso] = useState<{ id: string, titulo: string } | null>(null);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);

    const fetchCasos = async () => {
        try {
            const params = search ? { search } : {};
            const res = await api.get('/casos', { params });
            setCasos(res.data.casos || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchClientes = async () => {
        try {
            const res = await api.get('/clientes');
            setClientes(res.data.clientes || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchCasos(); }, [search]);
    useEffect(() => { fetchClientes(); }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingCaso) {
                await api.put(`/casos/${editingCaso.id}`, form);
            } else {
                await api.post('/casos', form);
            }
            setShowModal(false);
            setEditingCaso(null);
            setForm({ numero: '', titulo: '', tipo: 'civel', status: 'em_andamento', cliente_id: '' });
            fetchCasos();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este processo?')) return;
        try { await api.delete(`/casos/${id}`); fetchCasos(); }
        catch (err) { console.error(err); }
    };

    const handleAnalyze = async (id: string) => {
        setAnalyzingId(id);
        try {
            await api.post(`/casos/${id}/analyze`);
            fetchCasos(); // Refresh to show analytics
        } catch (err) { 
            console.error(err);
            alert('Falha ao gerar análise preditiva. Tente novamente.');
        } finally {
            setAnalyzingId(null);
        }
    };

    const openEdit = (caso: Caso) => {
        setEditingCaso(caso);
        setForm({ numero: caso.numero, titulo: caso.titulo, tipo: caso.tipo, status: caso.status, tribunal: caso.tribunal || '', vara: caso.vara || '', descricao: caso.descricao || '', cliente_id: caso.cliente_id || '' });
        setShowModal(true);
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        Gestão de Processos
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-500 font-medium mt-1 ml-13">
                        {casos.length} processos sob sua responsabilidade
                    </p>
                </div>
                <button 
                  onClick={() => { setEditingCaso(null); setForm({ numero: '', titulo: '', tipo: 'civel', status: 'em_andamento', cliente_id: '' }); setShowModal(true); }}
                  className="btn-maia-primary py-2.5 px-6 shadow-xl shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" /> Novo Processo
                </button>
            </header>

            {/* Search & Filters */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Pesquisar por número, título ou cliente..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  className="w-full glass bg-white/50 dark:bg-white/[0.02] border-black/5 dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white dark:focus:bg-white/[0.05] transition-all" 
                />
            </div>

            {/* Content Table */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600/50" /></div>
            ) : casos.length === 0 ? (
                <div className="bento-card text-center py-24 bg-white/50 dark:bg-white/[0.02]">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
                        <Briefcase className="w-10 h-10 text-gray-400 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum processo encontrado</h3>
                    <p className="text-gray-500 dark:text-zinc-500 mt-2 max-w-xs mx-auto">Tente ajustar sua busca ou adicione um novo processo para começar.</p>
                </div>
            ) : (
                <div className="bento-card overflow-hidden bg-white/50 dark:bg-white/[0.02] !p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Identificação</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Informações</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Tipo / Cliente</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest text-right whitespace-nowrap">Ações Estratégicas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {casos.map(caso => (
                                    <tr key={caso.id} className="group hover:bg-blue-600/[0.02] dark:hover:bg-blue-400/[0.02] transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/5 px-2 py-1 rounded-md inline-block mb-1 italic">
                                                {caso.numero}
                                            </div>
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                                                <Clock className="w-3 h-3" /> Atualizado recentemente
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">{caso.titulo}</p>
                                                {caso.predictive_analytics && (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[9px] font-black border border-amber-500/10" title={`Probabilidade: ${caso.predictive_analytics.label}`}>
                                                        <Zap className="w-2.5 h-2.5 fill-current" />
                                                        {Math.round(caso.predictive_analytics.score * 100)}%
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-500 dark:text-zinc-500 line-clamp-1 mt-0.5 font-medium">{caso.tribunal} • {caso.vara}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300 capitalize">{TIPO_LABELS[caso.tipo]}</span>
                                                <span className="text-[10px] text-gray-500 dark:text-zinc-500 flex items-center gap-1 font-medium mt-0.5">
                                                    <Users className="w-3 h-3" /> {clientes.find(c => c.id === caso.cliente_id)?.nome || 'Sem cliente'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-full border ${STATUS_COLORS[caso.status] || ''}`}>
                                                {STATUS_LABELS[caso.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                  onClick={() => handleAnalyze(caso.id)} 
                                                  disabled={analyzingId === caso.id}
                                                  className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all disabled:opacity-50" 
                                                  title="Análise Preditiva (IA)"
                                                >
                                                    {analyzingId === caso.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => setChatCaso(caso)} className="p-2 rounded-xl text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all relative" title="Análise Maia">
                                                    <MessageSquare className="w-4 h-4 fill-current opacity-20" />
                                                    <MessageSquare className="w-4 h-4 absolute top-2 left-2" />
                                                </button>
                                                <button onClick={() => setActivePanelCaso({ id: caso.id, titulo: caso.titulo })} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-500 transition-all" title="Ver Documentos"><FileText className="w-4 h-4" /></button>
                                                <button onClick={() => openEdit(caso)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-500 transition-all"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(caso.id)} className="p-2 rounded-xl text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }

            {/* Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingCaso ? 'Editar Processo' : 'Novo Processo'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Número *</label>
                                        <input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="0001234-56.2026.8.05.0001"
                                            className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
                                    <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Tipo</label>
                                        <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as CasoTipo })}
                                            className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600">
                                            {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select></div>
                                </div>
                                <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Título *</label>
                                    <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Indenização por danos morais"
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Status</label>
                                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as CasoStatus })}
                                            className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600">
                                            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select></div>
                                    <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Tribunal</label>
                                        <input value={form.tribunal || ''} onChange={e => setForm({ ...form, tribunal: e.target.value })} placeholder="TJBA"
                                            className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
                                </div>
                                <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Vara</label>
                                    <input value={form.vara || ''} onChange={e => setForm({ ...form, vara: e.target.value })} placeholder="2ª Vara Cível"
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>

                                <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Cliente Vinculado</label>
                                    <select value={form.cliente_id || ''} onChange={e => setForm({ ...form, cliente_id: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600">
                                        <option value="">Nenhum</option>
                                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} {c.tipo_pessoa === 'juridica' ? '(PJ)' : '(PF)'}</option>)}
                                    </select></div>

                                <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Descrição</label>
                                    <textarea value={form.descricao || ''} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3}
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" /></div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 py-2.5 rounded-lg transition-all font-medium">Cancelar</button>
                                <button onClick={handleSave} disabled={saving || !form.numero || !form.titulo}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Case Chat Drawer */}
            {
                chatCaso && (
                    <div className="fixed inset-0 z-50 flex">
                        <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setChatCaso(null)} />
                        <div className="w-[420px] bg-gray-50 dark:bg-zinc-950 border-l border-gray-200 dark:border-zinc-800 shadow-2xl">
                            <CaseChatPanel casoId={chatCaso.id} casoTitulo={chatCaso.titulo} onClose={() => setChatCaso(null)} />
                        </div>
                    </div>
                )
            }

            {/* Document Panel */}
            {
                activePanelCaso && (
                    <DocumentPanel
                        entityType="caso"
                        entityId={activePanelCaso.id}
                        entityName={activePanelCaso.titulo}
                        onClose={() => setActivePanelCaso(null)}
                    />
                )
            }
        </div >
    );
};

export default CasosPage;
