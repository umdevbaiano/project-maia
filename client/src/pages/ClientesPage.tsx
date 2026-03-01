import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Trash2, Edit3, X, Loader2, User, Building2, FileText } from 'lucide-react';
import DocumentPanel from '../components/DocumentPanel';
import api from '../utils/api';
import type { Cliente, ClienteCreateRequest, TipoPessoa } from '../types/cliente';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const maskDocument = (doc: string | undefined, tipo: TipoPessoa) => {
  if (!doc) return '';
  // Basic masking: keep last 2 digits, or first 3 + last 2
  const clean = doc.replace(/\D/g, '');
  if (tipo === 'fisica' && clean.length === 11) {
    return `***.${clean.substring(3, 6)}.${clean.substring(6, 9)}-**`;
  }
  if (tipo === 'juridica' && clean.length === 14) {
    return `**.***.${clean.substring(5, 8)}/****-${clean.substring(12, 14)}`;
  }
  return '***' + doc.slice(-4);
};

const isValidCPF = (cpf: string) => {
  const c = cpf.replace(/[^\d]+/g, '');
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(c.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(c.charAt(10))) return false;
  return true;
};

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteCreateRequest>({ nome: '', tipo_pessoa: 'fisica' });
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [activePanelCliente, setActivePanelCliente] = useState<{ id: string, nome: string } | null>(null);

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
    if (!form.nome.trim()) {
      alert("Por favor, preencha o nome do cliente.");
      return;
    }
    if (form.documento && form.tipo_pessoa === 'fisica') {
      if (!isValidCPF(form.documento)) {
        alert("Por favor, insira um CPF válido.");
        return;
      }
    }
    if (form.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        alert("Por favor, insira um e-mail válido contendo '@'.");
        return;
      }
    }

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

  const generatePDFReport = async (cliente: Cliente) => {
    setExportingId(cliente.id);
    try {
      const res = await api.get(`/clientes/${cliente.id}/report`);
      const data = res.data;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Cabeçalho
      doc.setFontSize(20);
      doc.text('Relatório Consolidado do Cliente', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, pageWidth / 2, 28, { align: 'center' });

      // Dados do Cliente
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('1. Informações Cadastrais', 14, 45);

      autoTable(doc, {
        startY: 50,
        theme: 'plain',
        body: [
          ['Nome:', data.cliente?.nome || '-'],
          ['Tipo:', data.cliente?.tipo_pessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'],
          [data.cliente?.tipo_pessoa === 'juridica' ? 'CNPJ:' : 'CPF:', data.cliente?.documento || '-'],
          ['E-mail:', data.cliente?.email || '-'],
          ['Telefone:', data.cliente?.telefone || '-'],
          ['Endereço:', data.cliente?.endereco || '-']
        ],
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } }
      });

      // Processos (Casos)
      let currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('2. Processos e Casos Vinculados', 14, currentY);

      if (data.casos && data.casos.length > 0) {
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Título do Processo', 'Número', 'Status', 'Criado em']],
          body: data.casos.map((c: any) => [
            c.titulo,
            c.numero || 'Sem número',
            c.status?.toUpperCase() || '-',
            new Date(c.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 9 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.text('Nenhum processo vinculado a este cliente.', 14, currentY + 8);
        currentY += 20;
      }

      // Documentos Anexados
      doc.setFontSize(14);
      doc.text('3. Relação de Documentos', 14, currentY);

      if (data.documentos && data.documentos.length > 0) {
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Nome do Arquivo', 'Data de Upload', 'Tamanho']],
          body: data.documentos.map((d: any) => [
            d.filename,
            new Date(d.upload_date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            d.size ? `${(d.size / 1024).toFixed(1)} KB` : '-'
          ]),
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] },
          styles: { fontSize: 9 }
        });
      } else {
        doc.setFontSize(10);
        doc.text('Nenhum documento anexado.', 14, currentY + 8);
      }

      // Salvar PDF
      const pdfBlob = doc.output('blob');
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = cliente.nome.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
      link.setAttribute('download', `Relatorio_Cliente_${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o relatório. Verifique os logs.");
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-500" /> Clientes
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">{clientes.length} cliente(s)</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ nome: '', tipo_pessoa: 'fisica' }); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-blue-600/20">
          <Plus className="w-5 h-5" /> Novo Cliente
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
        <input type="text" placeholder="Buscar por nome, CPF/CNPJ ou e-mail..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg pl-11 pr-4 py-3 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-zinc-700" />
          <p className="text-gray-500 dark:text-zinc-500">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map(c => (
            <div key={c.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 hover:border-gray-300 dark:hover:border-zinc-700 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.tipo_pessoa === 'juridica' ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}>
                    {c.tipo_pessoa === 'juridica' ? <Building2 className="w-5 h-5 text-purple-500 dark:text-purple-400" /> : <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
                  </div>
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-medium text-sm">{c.nome}</h3>
                    <p className="text-gray-500 dark:text-zinc-500 text-xs">{c.tipo_pessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => generatePDFReport(c)} disabled={exportingId === c.id} className="text-gray-400 hover:text-emerald-500 dark:text-zinc-400 dark:hover:text-emerald-400 p-1 transition-colors disabled:opacity-50" title="Gerar Relatório PDF">
                    {exportingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>}
                  </button>
                  <button onClick={() => setActivePanelCliente({ id: c.id, nome: c.nome })} className="text-gray-400 hover:text-purple-500 dark:text-zinc-400 dark:hover:text-purple-400 p-1 transition-colors" title="Ver Documentos"><FileText className="w-4 h-4" /></button>
                  <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400 p-1" title="Editar Cliente"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 p-1" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {c.documento && <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1" title={c.documento}>📄 {maskDocument(c.documento, c.tipo_pessoa)}</p>}
              {c.email && <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">✉️ {c.email}</p>}
              {c.telefone && <p className="text-xs text-gray-500 dark:text-zinc-400">📞 {c.telefone}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Nome *</label>
                  <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
                <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Tipo</label>
                  <select value={form.tipo_pessoa} onChange={e => setForm({ ...form, tipo_pessoa: e.target.value as TipoPessoa })}
                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="fisica">Pessoa Física</option><option value="juridica">Pessoa Jurídica</option>
                  </select></div>
              </div>
              <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">{form.tipo_pessoa === 'juridica' ? 'CNPJ' : 'CPF'}</label>
                <input value={form.documento || ''} onChange={e => setForm({ ...form, documento: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">E-mail</label>
                  <input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
                <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Telefone</label>
                  <input value={form.telefone || ''} onChange={e => setForm({ ...form, telefone: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
              </div>
              <div><label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1">Endereço</label>
                <input value={form.endereco || ''} onChange={e => setForm({ ...form, endereco: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 py-2.5 rounded-lg transition-all font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.nome}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Panel */}
      {activePanelCliente && (
        <DocumentPanel
          entityType="cliente"
          entityId={activePanelCliente.id}
          entityName={activePanelCliente.nome}
          onClose={() => setActivePanelCliente(null)}
        />
      )}
    </div>
  );
};

export default ClientesPage;
