import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Trash2, Edit3, X, Loader2, MessageSquare, FileText } from 'lucide-react';
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

    const openEdit = (caso: Caso) => {
        setEditingCaso(caso);
        setForm({ numero: caso.numero, titulo: caso.titulo, tipo: caso.tipo, status: caso.status, tribunal: caso.tribunal || '', vara: caso.vara || '', descricao: caso.descricao || '', cliente_id: caso.cliente_id || '' });
        setShowModal(true);
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Briefcase className="w-7 h-7 text-blue-500" /> Processos
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">{casos.length} processo(s) cadastrado(s)</p>
                </div>
                <button onClick={() => { setEditingCaso(null); setForm({ numero: '', titulo: '', tipo: 'civel', status: 'em_andamento', cliente_id: '' }); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-blue-600/20">
                    <Plus className="w-5 h-5" /> Novo Processo
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
                <input type="text" placeholder="Buscar por número ou título..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-zinc-800 rounded-lg pl-11 pr-4 py-3 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : casos.length === 0 ? (
                <div className="text-center py-20">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-zinc-700" />
                    <p className="text-gray-500 dark:text-zinc-500">Nenhum processo encontrado.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead><tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-[#1a1c23]">
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Número</th>
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Título</th>
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Tipo</th>
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Cliente</th>
                            <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Ações</th>
                        </tr></thead>
                        <tbody>
                            {casos.map(caso => (
                                <tr key={caso.id} className="border-b border-gray-200 dark:border-zinc-800/50 bg-white dark:bg-[#1f2128] hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-700 dark:text-blue-300">{caso.numero}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{caso.titulo}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-zinc-400">{TIPO_LABELS[caso.tipo] || caso.tipo}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[caso.status] || ''}`}>
                                            {STATUS_LABELS[caso.status] || caso.status}
                                        </span>
                                    </td>
                                    <button onClick={() => setActivePanelCaso({ id: caso.id, titulo: caso.titulo })} className="text-gray-400 dark:text-zinc-400 hover:text-green-500 dark:hover:text-green-400 p-1 mr-2 transition-colors" title="Ver Documentos"><FileText className="w-4 h-4" /></button>
                                    <button onClick={() => setChatCaso(caso)} className="text-violet-500/80 hover:text-violet-600 dark:text-violet-400/80 dark:hover:text-violet-300 p-1 mr-2 transition-colors relative group" title="Análise IA do Processo">
                                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                                        </span>
                                        <MessageSquare className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => openEdit(caso)} className="text-gray-400 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 p-1 mr-2 transition-colors"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(caso.id)} className="text-gray-400 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                </table>
            </div >
            )}

{/* Modal */ }
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

{/* Case Chat Drawer */ }
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

{/* Document Panel */ }
{
    activePanelCaso && (
        <DocumentPanel
            entityType="caso"
            entityId={activePanelCaso.id}
            entityName={activePanelCaso.titulo}
            onClose={() => setActivePanelCaso(null)}
        />
        />
      )
}
    </div >
  );
};

export default CasosPage;
