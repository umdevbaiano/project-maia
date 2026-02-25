import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, Search, Loader2, File, FileUp, Link as LinkIcon, X, Briefcase, User } from 'lucide-react';
import api from '../utils/api';
import type { Documento } from '../types/documento';
import type { Cliente } from '../types/cliente';
import type { Caso } from '../types/caso';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const FILE_ICONS: Record<string, string> = { pdf: '📄', txt: '📝', docx: '📃' };

const DocumentosPage: React.FC = () => {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Linking state
  const [linkDoc, setLinkDoc] = useState<Documento | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedCaso, setSelectedCaso] = useState<string>('');
  const [linking, setLinking] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await api.get('/documents');
      setDocs(res.data.documents || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchEntities = async () => {
    try {
      const [resC, resCa] = await Promise.all([api.get('/clientes'), api.get('/casos')]);
      setClientes(resC.data.clientes || []);
      setCasos(resCa.data.casos || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchDocs();
    fetchEntities();
  }, []);

  const uploadFile = async (file: globalThis.File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchDocs();
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este documento e seus embeddings?')) return;
    try { await api.delete(`/documents/${id}`); fetchDocs(); } catch (err) { console.error(err); }
  };

  const openLinkModal = (doc: Documento) => {
    setLinkDoc(doc);
    setSelectedCliente(doc.cliente_id || '');
    setSelectedCaso(doc.caso_id || '');
  };

  const handleLink = async () => {
    if (!linkDoc) return;
    setLinking(true);
    try {
      await api.put(`/documents/${linkDoc.id}/link`, {
        cliente_id: selectedCliente || null,
        caso_id: selectedCaso || null
      });
      setLinkDoc(null);
      fetchDocs();
    } catch (err) { console.error(err); }
    finally { setLinking(false); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-500" /> Documentos
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">{docs.length} documento(s) indexado(s) para RAG</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInput.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-8 ${dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600 bg-gray-50 dark:bg-zinc-900/50'
          }`}
      >
        <input ref={fileInput} type="file" accept=".pdf,.txt,.docx" className="hidden"
          onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-gray-700 dark:text-zinc-300 font-medium">Processando documento...</p>
            <p className="text-gray-500 dark:text-zinc-500 text-sm">Extraindo texto, gerando embeddings e indexando no ChromaDB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <FileUp className="w-10 h-10 text-gray-400 dark:text-zinc-500" />
            <p className="text-gray-700 dark:text-zinc-300 font-medium">Arraste um arquivo ou clique para enviar</p>
            <p className="text-gray-500 dark:text-zinc-500 text-sm">PDF, TXT ou DOCX • Máximo 10MB</p>
          </div>
        )}
      </div>

      {/* Document List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12">
          <File className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-zinc-700" />
          <p className="text-gray-500 dark:text-zinc-500">Nenhum documento enviado ainda.</p>
          <p className="text-gray-400 dark:text-zinc-600 text-sm mt-1">Envie documentos para que a Maia possa consultá-los.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-300 dark:hover:border-zinc-700 transition-all group">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{FILE_ICONS[doc.file_type] || '📎'}</span>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-medium text-sm">{doc.filename}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 dark:text-zinc-500">{formatBytes(doc.size_bytes)}</span>
                    <span className="text-xs text-blue-500 dark:text-blue-400">{doc.chunk_count} chunks</span>
                    <span className="text-xs text-gray-400 dark:text-zinc-600">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                    {(doc.cliente_id || doc.caso_id) && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Vinculado
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openLinkModal(doc)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 p-2 transition-all" title="Vincular a Entidade">
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(doc.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 p-2 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Linking Modal */}
      {linkDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-blue-500" /> Vincular Documento
              </h2>
              <button onClick={() => setLinkDoc(null)} className="text-gray-400 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="mb-6 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg flex items-center gap-3">
              <span className="text-2xl">{FILE_ICONS[linkDoc.file_type] || '📎'}</span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{linkDoc.filename}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{formatBytes(linkDoc.size_bytes)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" /> Referente ao Cliente
                </label>
                <select value={selectedCliente} onChange={e => setSelectedCliente(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="">Nenhum</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-500" /> Referente ao Processo (Caso)
                </label>
                <select value={selectedCaso} onChange={e => setSelectedCaso(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="">Nenhum</option>
                  {casos.map(c => <option key={c.id} value={c.id}>{c.numero} - {c.titulo}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setLinkDoc(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 py-2.5 rounded-lg transition-all font-medium">Cancelar</button>
              <button onClick={handleLink} disabled={linking}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Vínculo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentosPage;
