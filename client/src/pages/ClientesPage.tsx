import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Trash2, Edit3, X, Loader2, User, Building2 } from 'lucide-react';
import api from '../utils/api';
import type { Cliente, ClienteCreateRequest, TipoPessoa } from '../types/cliente';

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteCreateRequest>({ nome: '', tipo_pessoa: 'fisica' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    try {
      const params = search ? { search } : {};
      const res = await api.get('/clientes', { params });
      setClientes(res.data.clientes || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) { await api.put(`/clientes/${editing.id}`, form); }
      else { await api.post('/clientes', form); }
      setShowModal(false); setEditing(null);
      setForm({ nome: '', tipo_pessoa: 'fisica' });
      fetch();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cliente?')) return;
    try { await api.delete(`/clientes/${id}`); fetch(); } catch (err) { console.error(err); }
  };

  const openEdit = (c: Cliente) => {
    setEditing(c);
    setForm({ nome: c.nome, tipo_pessoa: c.tipo_pessoa, documento: c.documento || '', email: c.email || '', telefone: c.telefone || '', endereco: c.endereco || '', observacoes: c.observacoes || '' });
    setShowModal(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-500" /> Clientes
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{clientes.length} cliente(s)</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ nome: '', tipo_pessoa: 'fisica' }); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-blue-600/20">
          <Plus className="w-5 h-5" /> Novo Cliente
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input type="text" placeholder="Buscar por nome, CPF/CNPJ ou e-mail..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-11 pr-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p className="text-zinc-500">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.tipo_pessoa === 'juridica' ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}>
                    {c.tipo_pessoa === 'juridica' ? <Building2 className="w-5 h-5 text-purple-400" /> : <User className="w-5 h-5 text-blue-400" />}
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{c.nome}</h3>
                    <p className="text-zinc-500 text-xs">{c.tipo_pessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => openEdit(c)} className="text-zinc-400 hover:text-blue-400 p-1"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-zinc-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {c.documento && <p className="text-xs text-zinc-400 mb-1">📄 {c.documento}</p>}
              {c.email && <p className="text-xs text-zinc-400 mb-1">✉️ {c.email}</p>}
              {c.telefone && <p className="text-xs text-zinc-400">📞 {c.telefone}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-zinc-300 mb-1">Nome *</label>
                  <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
                <div><label className="block text-sm text-zinc-300 mb-1">Tipo</label>
                  <select value={form.tipo_pessoa} onChange={e => setForm({ ...form, tipo_pessoa: e.target.value as TipoPessoa })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="fisica">Pessoa Física</option><option value="juridica">Pessoa Jurídica</option>
                  </select></div>
              </div>
              <div><label className="block text-sm text-zinc-300 mb-1">{form.tipo_pessoa === 'juridica' ? 'CNPJ' : 'CPF'}</label>
                <input value={form.documento || ''} onChange={e => setForm({ ...form, documento: e.target.value })}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-zinc-300 mb-1">E-mail</label>
                  <input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
                <div><label className="block text-sm text-zinc-300 mb-1">Telefone</label>
                  <input value={form.telefone || ''} onChange={e => setForm({ ...form, telefone: e.target.value })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
              </div>
              <div><label className="block text-sm text-zinc-300 mb-1">Endereço</label>
                <input value={form.endereco || ''} onChange={e => setForm({ ...form, endereco: e.target.value })}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg transition-all font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.nome}
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

export default ClientesPage;
