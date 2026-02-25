import React, { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, File, FileUp, Trash2, X } from 'lucide-react';
import api from '../utils/api';
import type { Documento } from '../types/documento';

interface DocumentPanelProps {
    entityType: 'cliente' | 'caso';
    entityId: string;
    entityName: string;
    onClose: () => void;
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const FILE_ICONS: Record<string, string> = { pdf: '📄', txt: '📝', docx: '📃' };

const DocumentPanel: React.FC<DocumentPanelProps> = ({ entityType, entityId, entityName, onClose }) => {
    const [docs, setDocs] = useState<Documento[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [linkingExisting, setLinkingExisting] = useState(false);
    const [allDocs, setAllDocs] = useState<Documento[]>([]);
    const fileInput = useRef<HTMLInputElement>(null);

    const fetchDocs = async () => {
        try {
            const res = await api.get('/documents');
            const all = res.data.documents || [];
            setAllDocs(all);
            // Filter docs for this entity
            const filtered = all.filter((d: Documento) =>
                (entityType === 'cliente' && d.cliente_id === entityId) ||
                (entityType === 'caso' && d.caso_id === entityId)
            );
            setDocs(filtered);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchDocs(); }, [entityId]);

    const uploadFile = async (file: globalThis.File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (entityType === 'cliente') formData.append('cliente_id', entityId);
            if (entityType === 'caso') formData.append('caso_id', entityId);

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

    const handleUnlink = async (id: string) => {
        if (!confirm('Remover vínculo deste documento? (Ele continuará na base geral)')) return;
        try {
            await api.put(`/documents/${id}/link`, { cliente_id: null, caso_id: null });
            fetchDocs();
        } catch (err) { console.error(err); }
    };

    const handleLinkExisting = async (docId: string) => {
        try {
            await api.put(`/documents/${docId}/link`, {
                cliente_id: entityType === 'cliente' ? entityId : null,
                caso_id: entityType === 'caso' ? entityId : null
            });
            setLinkingExisting(false);
            fetchDocs();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-[60]">
            <div className="bg-gray-50 dark:bg-zinc-950 border-l border-gray-200 dark:border-zinc-800 shadow-2xl w-full max-w-md h-full flex flex-col animate-slide-left">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Documentos
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-1">{entityName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* Upload Zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInput.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'
                            }`}
                    >
                        <input ref={fileInput} type="file" accept=".pdf,.txt,.docx" className="hidden"
                            onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <p className="text-gray-700 dark:text-zinc-300 text-sm font-medium">Processando...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <FileUp className="w-8 h-8 text-gray-400 dark:text-zinc-500" />
                                <p className="text-gray-700 dark:text-zinc-300 text-sm font-medium">Arraste ou clique para anexar</p>
                                <p className="text-gray-500 dark:text-zinc-500 text-xs">PDF, TXT ou DOCX</p>
                            </div>
                        )}
                    </div>

                    {!linkingExisting ? (
                        <button onClick={() => setLinkingExisting(true)} className="w-full py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 font-medium hover:bg-white dark:hover:bg-zinc-900 transition-colors">
                            + Vincular Documento Existente
                        </button>
                    ) : (
                        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Selecionar do Repositório</h3>
                                <button onClick={() => setLinkingExisting(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {allDocs.filter(d => !d.cliente_id && !d.caso_id).length === 0 ? (
                                    <p className="text-xs text-gray-500 text-center py-2">Nenhum documento livre na base.</p>
                                ) : (
                                    allDocs.filter(d => !d.cliente_id && !d.caso_id).map(d => (
                                        <button key={d.id} onClick={() => handleLinkExisting(d.id)} className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded border border-gray-100 dark:border-zinc-800 transition-colors text-left group">
                                            <div className="truncate flex-1">
                                                <p className="text-xs font-medium text-gray-900 dark:text-zinc-200 truncate pr-2">{d.filename}</p>
                                                <p className="text-[10px] text-gray-500">{formatBytes(d.size_bytes)}</p>
                                            </div>
                                            <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Vincular</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* List */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            Anexos ({docs.length})
                        </h3>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                        ) : docs.length === 0 ? (
                            <div className="text-center py-8 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                                <File className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-zinc-600" />
                                <p className="text-xs text-gray-500 dark:text-zinc-500">Nenhum documento vinculado.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {docs.map(doc => (
                                    <div key={doc.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 flex items-start gap-3 group">
                                        <span className="text-xl mt-0.5">{FILE_ICONS[doc.file_type] || '📎'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={doc.filename}>{doc.filename}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-gray-500 dark:text-zinc-500">{formatBytes(doc.size_bytes)}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700"></span>
                                                <span className="text-[11px] text-blue-500 dark:text-blue-400">{doc.chunk_count} chunks</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleUnlink(doc.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1" title="Remover Vínculo">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentPanel;
