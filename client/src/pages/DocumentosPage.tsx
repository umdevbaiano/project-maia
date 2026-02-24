import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, Search, Loader2, File, FileUp } from 'lucide-react';
import api from '../utils/api';
import type { Documento } from '../types/documento';

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

  const fetchDocs = async () => {
    try {
      const res = await api.get('/documents');
      setDocs(res.data.documents || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-500" /> Documentos
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{docs.length} documento(s) indexado(s) para RAG</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInput.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-8 ${dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'
          }`}
      >
        <input ref={fileInput} type="file" accept=".pdf,.txt,.docx" className="hidden"
          onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-zinc-300 font-medium">Processando documento...</p>
            <p className="text-zinc-500 text-sm">Extraindo texto, gerando embeddings e indexando no ChromaDB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <FileUp className="w-10 h-10 text-zinc-500" />
            <p className="text-zinc-300 font-medium">Arraste um arquivo ou clique para enviar</p>
            <p className="text-zinc-500 text-sm">PDF, TXT ou DOCX • Máximo 10MB</p>
          </div>
        )}
      </div>

      {/* Document List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12">
          <File className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p className="text-zinc-500">Nenhum documento enviado ainda.</p>
          <p className="text-zinc-600 text-sm mt-1">Envie documentos para que a Maia possa consultá-los.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-700 transition-all group">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{FILE_ICONS[doc.file_type] || '📎'}</span>
                <div>
                  <h3 className="text-white font-medium text-sm">{doc.filename}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-500">{formatBytes(doc.size_bytes)}</span>
                    <span className="text-xs text-blue-400">{doc.chunk_count} chunks</span>
                    <span className="text-xs text-zinc-600">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(doc.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 p-2 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentosPage;
