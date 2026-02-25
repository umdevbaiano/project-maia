import { useState, useEffect } from 'react';
import { Shield, Search, Filter, ChevronLeft, ChevronRight, LogIn, Plus, Pencil, Trash2, FileDown, Sparkles, MessageSquare, RefreshCw, Upload, UserX, UserPlus } from 'lucide-react';
import api from '../utils/api';

const ACTION_ICONS: Record<string, any> = {
    LOGIN: LogIn,
    REGISTER: UserPlus,
    INVITE: UserPlus,
    REVOKE: UserX,
    CREATE: Plus,
    UPDATE: Pencil,
    DELETE: Trash2,
    EXPORT: FileDown,
    GENERATE: Sparkles,
    CHAT: MessageSquare,
    SYNC: RefreshCw,
    UPLOAD: Upload,
    CLEAR: Trash2,
};

const ACTION_COLORS: Record<string, string> = {
    LOGIN: 'text-green-400 bg-green-400/10',
    REGISTER: 'text-blue-400 bg-blue-400/10',
    INVITE: 'text-blue-400 bg-blue-400/10',
    REVOKE: 'text-red-400 bg-red-400/10',
    CREATE: 'text-emerald-400 bg-emerald-400/10',
    UPDATE: 'text-amber-400 bg-amber-400/10',
    DELETE: 'text-red-400 bg-red-400/10',
    EXPORT: 'text-purple-400 bg-purple-400/10',
    GENERATE: 'text-violet-400 bg-violet-400/10',
    CHAT: 'text-cyan-400 bg-cyan-400/10',
    SYNC: 'text-blue-400 bg-blue-400/10',
    UPLOAD: 'text-teal-400 bg-teal-400/10',
    CLEAR: 'text-orange-400 bg-orange-400/10',
};

const RESOURCE_LABELS: Record<string, string> = {
    auth: 'Autenticação',
    caso: 'Processo',
    cliente: 'Cliente',
    prazo: 'Prazo',
    peca: 'Peça Jurídica',
    documento: 'Documento',
    chat: 'Chat',
};

interface AuditLog {
    id: string;
    user_id: string;
    user_email: string;
    action: string;
    resource_type: string;
    resource_id: string;
    details: string;
    timestamp: string;
}

const AuditPage = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('');
    const [filterResource, setFilterResource] = useState('');
    const perPage = 25;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params: any = { page, per_page: perPage };
            if (filterAction) params.action = filterAction;
            if (filterResource) params.resource_type = filterResource;
            const response = await api.get('/audit/logs', { params });
            setLogs(response.data.logs || []);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filterAction, filterResource]);

    const totalPages = Math.ceil(total / perPage);

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-3 rounded-xl">
                        <Shield className="w-7 h-7 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auditoria</h1>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm">Registro de todas as ações na plataforma</p>
                    </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-zinc-500">{total} registros</span>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <div className="relative">
                    <Filter className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                        value={filterAction}
                        onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white text-sm appearance-none cursor-pointer min-w-[160px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Todas as ações</option>
                        {Object.keys(ACTION_ICONS).map(a => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                        value={filterResource}
                        onChange={(e) => { setFilterResource(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white text-sm appearance-none cursor-pointer min-w-[160px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Todos os recursos</option>
                        {Object.entries(RESOURCE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Timeline */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-20 text-gray-400 dark:text-zinc-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum registro de auditoria encontrado.</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {logs.map((log) => {
                        const Icon = ACTION_ICONS[log.action] || Shield;
                        const colorClass = ACTION_COLORS[log.action] || 'text-gray-400 bg-gray-100 dark:text-zinc-400 dark:bg-zinc-400/10';
                        const resourceLabel = RESOURCE_LABELS[log.resource_type] || log.resource_type;

                        return (
                            <div
                                key={log.id}
                                className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg hover:border-gray-200 dark:hover:border-zinc-700 transition-colors shadow-sm dark:shadow-none"
                            >
                                <div className={`p-2 rounded-lg ${colorClass}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                                            {log.action}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-zinc-500">{resourceLabel}</span>
                                        {log.details && (
                                            <span className="text-xs text-gray-400 dark:text-zinc-400 truncate">— {log.details}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500 dark:text-zinc-500">{log.user_email || log.user_id}</span>
                                        {log.resource_id && (
                                            <span className="text-[10px] text-gray-400 dark:text-zinc-600 font-mono">ID: {log.resource_id.slice(0, 8)}…</span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-zinc-500 whitespace-nowrap">{formatDate(log.timestamp)}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500 dark:text-zinc-400">
                        Página {page} de {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuditPage;
