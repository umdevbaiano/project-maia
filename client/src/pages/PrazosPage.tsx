import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Edit3, X, Loader2, AlertTriangle, CheckCircle2, Briefcase } from 'lucide-react';
import api from '../utils/api';
import type { Prazo, PrazoCreateRequest, PrazoPrioridade, PrazoStatus } from '../types/prazo';
import { STATUS_LABELS, PRIORIDADE_LABELS, PRIORIDADE_COLORS } from '../types/prazo';

const isOverdue = (date: string) => new Date(date) < new Date(new Date().toISOString().split('T')[0]);
const daysUntil = (date: string) => {
    const diff = (new Date(date).getTime() - new Date(new Date().toISOString().split('T')[0]).getTime()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
};

const PrazosPage: React.FC = () => {
    const [prazos, setPrazos] = useState<Prazo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Prazo | null>(null);
    const [filter, setFilter] = useState<string>('');
    const [form, setForm] = useState<PrazoCreateRequest>({
        titulo: '', data_limite: '', prioridade: 'media',
    });
    const [saving, setSaving] = useState(false);

    const fetchPrazos = async () => {
        try {
            const params: any = {};
            if (filter) params.status = filter;
            const res = await api.get('/prazos', { params });
            setPrazos(res.data.prazos || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPrazos(); }, [filter]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editing) { await api.put(`/prazos/${editing.id}`, form); }
            else { await api.post('/prazos', form); }
            setShowModal(false); setEditing(null);
            setForm({ titulo: '', data_limite: '', prioridade: 'media' });
            fetchPrazos();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este prazo?')) return;
        try { await api.delete(`/prazos/${id}`); fetchPrazos(); } catch (err) { console.error(err); }
    };

    const toggleStatus = async (prazo: Prazo) => {
        const newStatus = prazo.status === 'pendente' ? 'cumprido' : 'pendente';
        try { await api.put(`/prazos/${prazo.id}`, { status: newStatus }); fetchPrazos(); }
        catch (err) { console.error(err); }
    };

    const openEdit = (p: Prazo) => {
        setEditing(p);
        setForm({ titulo: p.titulo, descricao: p.descricao || '', data_limite: p.data_limite, caso_id: p.caso_id || '', prioridade: p.prioridade });
        setShowModal(true);
    };

    const overduePrazos = prazos.filter(p => p.status === 'pendente' && isOverdue(p.data_limite));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            Gestão de Prazos
          </h1>
          <p className="text-gray-500 dark:text-zinc-500 font-medium mt-1 ml-13">
            {prazos.length} prazos processuais monitorados
          </p>
        </div>
        <button 
          onClick={() => { setEditing(null); setForm({ titulo: '', data_limite: '', prioridade: 'media' }); setShowModal(true); }}
          className="btn-maia-primary py-2.5 px-6 shadow-xl shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" /> Novo Prazo
        </button>
      </header>

      {/* Overdue Alert Banner */}
      {overduePrazos.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 flex items-center gap-6 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-red-600 dark:text-red-400 font-extrabold text-lg">Atenção: Prazos Críticos</p>
            <p className="text-red-500/80 dark:text-red-400/70 font-medium text-sm">
              Você possui {overduePrazos.length} prazo(s) que expiraram. Verifique imediatamente.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl w-fit">
        {['', 'pendente', 'cumprido', 'expirado'].map(s => (
          <button 
            key={s} 
            onClick={() => setFilter(s)}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
              filter === s 
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-300'
            }`}
          >
            {s === '' ? 'Todos' : STATUS_LABELS[s as PrazoStatus]}
          </button>
        ))}
      </div>

      {/* Timeline Section */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600/50" /></div>
      ) : prazos.length === 0 ? (
        <div className="bento-card text-center py-24">
           <Clock className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
           <p className="text-gray-500 dark:text-zinc-500 font-medium">Nenhum prazo para exibir neste filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {prazos.map(prazo => {
            const days = daysUntil(prazo.data_limite);
            const overdue = prazo.status === 'pendente' && days < 0;
            const urgent = prazo.status === 'pendente' && days >= 0 && days <= 3;

            return (
              <div key={prazo.id}
                className={`bento-card flex items-center justify-between group h-24 ${
                  overdue ? 'bg-red-500/[0.03] !border-red-500/20' : 
                  urgent ? 'bg-orange-500/[0.03] !border-orange-500/20' : 
                  'bg-white/50 dark:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => toggleStatus(prazo)}
                    className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 ${
                      prazo.status === 'cumprido' 
                        ? 'border-green-500 bg-green-500 shadow-lg shadow-green-500/20' 
                        : 'border-gray-200 dark:border-zinc-800 hover:border-blue-500 hover:scale-110'
                    }`}
                  >
                    {prazo.status === 'cumprido' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </button>
                  
                  <div>
                    <h3 className={`text-base font-bold transition-all ${
                      prazo.status === 'cumprido' 
                        ? 'text-gray-400 dark:text-zinc-600 line-through' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {prazo.titulo}
                    </h3>
                    <div className="flex items-center gap-4 mt-1.5 font-medium tracking-tight">
                      <span className={`text-[10px] font-black uppercase tracking-tighter px-2.5 py-0.5 rounded-lg border ${PRIORIDADE_COLORS[prazo.prioridade]}`}>
                        {PRIORIDADE_LABELS[prazo.prioridade]}
                      </span>
                      <span className={`text-[11px] flex items-center gap-1.5 ${
                        overdue ? 'text-red-500' : 
                        urgent ? 'text-orange-500' : 
                        'text-gray-500 dark:text-zinc-500'
                      }`}>
                        📅 {new Date(prazo.data_limite).toLocaleDateString('pt-BR')}
                        <span className="opacity-50">•</span>
                        {prazo.status === 'pendente' ? (
                          overdue ? `${Math.abs(days)}d atrasado` : `${days}d restantes`
                        ) : 'Concluído'}
                      </span>
                      {prazo.caso_titulo && (
                        <span className="text-[11px] text-gray-400 dark:text-zinc-600 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> {prazo.caso_titulo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button onClick={() => openEdit(prazo)} className="p-3 rounded-2xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-500 transition-all">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(prazo.id)} className="p-3 rounded-2xl text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? 'Editar Prazo' : 'Novo Prazo'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Título *</label>
                                <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Contestação do processo..."
                                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Data Limite *</label>
                                    <input type="date" value={form.data_limite} onChange={e => setForm({ ...form, data_limite: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
                                <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Prioridade</label>
                                    <select value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value as PrazoPrioridade })}
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600">
                                        {Object.entries(PRIORIDADE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select></div>
                            </div>
                            <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Descrição</label>
                                <textarea value={form.descricao || ''} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3}
                                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" /></div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 py-2.5 rounded-lg transition-all font-medium">Cancelar</button>
                            <button onClick={handleSave} disabled={saving || !form.titulo || !form.data_limite}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrazosPage;
