import { useState, useEffect } from 'react';
import { 
    Shield, Search, Filter, ChevronLeft, ChevronRight, LogIn, Plus, Pencil, 
    Trash2, FileDown, Sparkles, MessageSquare, RefreshCw, Upload, UserX, 
    UserPlus, Calendar, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { cn } from '../utils/cn';

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
    LOGIN: 'text-emerald-500 bg-emerald-500/10',
    REGISTER: 'text-blue-500 bg-blue-500/10',
    INVITE: 'text-blue-500 bg-blue-500/10',
    REVOKE: 'text-red-500 bg-red-500/10',
    CREATE: 'text-emerald-500 bg-emerald-500/10',
    UPDATE: 'text-amber-500 bg-amber-500/10',
    DELETE: 'text-red-500 bg-red-500/10',
    EXPORT: 'text-purple-500 bg-purple-500/10',
    GENERATE: 'text-violet-500 bg-violet-500/10',
    CHAT: 'text-cyan-500 bg-cyan-500/10',
    SYNC: 'text-blue-500 bg-blue-500/10',
    UPLOAD: 'text-teal-500 bg-teal-500/10',
    CLEAR: 'text-orange-500 bg-orange-500/10',
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
    ip_address?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

const AuditPage = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('');
    const [filterResource, setFilterResource] = useState('');
    const perPage = 15;

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

    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Audit Log</h1>
                    </div>
                    <p className="text-gray-500 dark:text-zinc-500 font-medium ml-15">Rastreabilidade total e conformidade em tempo real</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {total} Eventos Registrados
                    </div>
                    <button className="btn-maia-secondary py-2 px-5 flex items-center gap-2 text-xs">
                        <FileDown className="w-4 h-4" /> Exportar Report
                    </button>
                </div>
            </header>

            {/* Filters Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative group">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <select
                        value={filterAction}
                        onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                        className="w-full glass bg-white/50 dark:bg-white/[0.02] border-black/5 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600/20 outline-none"
                    >
                        <option value="">Todas as Ações</option>
                        {Object.keys(ACTION_ICONS).sort().map(a => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <select
                        value={filterResource}
                        onChange={(e) => { setFilterResource(e.target.value); setPage(1); }}
                        className="w-full glass bg-white/50 dark:bg-white/[0.02] border-black/5 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-blue-600/20 outline-none"
                    >
                        <option value="">Todos os Recursos</option>
                        {Object.entries(RESOURCE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2 p-1 glass bg-white/30 dark:bg-white/[0.01] border-black/5 dark:border-white/5 rounded-2xl">
                    <button 
                        onClick={() => fetchLogs()}
                        className="flex-1 py-2 px-4 rounded-xl hover:bg-white dark:hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} /> Atualizar
                    </button>
                </div>
            </div>

            {/* Timeline Content */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-10 top-0 bottom-0 w-px bg-gradient-to-b from-blue-600/20 via-blue-600/10 to-transparent hidden md:block" />

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-32 space-y-4"
                        >
                            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">Sincronizando registros de auditoria...</p>
                        </motion.div>
                    ) : logs.length === 0 ? (
                        <motion.div 
                            key="empty"
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            className="bento-card text-center py-24"
                        >
                            <Shield className="w-16 h-16 text-gray-300 dark:text-zinc-800 mx-auto mb-6 opacity-50" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nenhum evento crítico</h3>
                            <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">Não encontramos registros que correspondam aos filtros aplicados no momento.</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="list"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-4"
                        >
                            {logs.map((log) => {
                                const Icon = ACTION_ICONS[log.action] || Shield;
                                const colorClass = ACTION_COLORS[log.action] || 'text-gray-400 bg-gray-100 dark:text-zinc-400 dark:bg-zinc-400/10';
                                const resourceLabel = RESOURCE_LABELS[log.resource_type] || log.resource_type;

                                return (
                                    <motion.div
                                        key={log.id}
                                        variants={itemVariants}
                                        className="group relative flex flex-col md:flex-row md:items-center gap-6 p-5 glass-premium bg-white dark:bg-white/[0.02] border-black/5 dark:border-white/5 rounded-[2rem] hover:shadow-xl hover:shadow-blue-600/5 transition-all"
                                    >
                                        {/* Action Icon Circle */}
                                        <div className="md:ml-2 flex flex-col items-center shrink-0 z-10">
                                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", colorClass)}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-zinc-400">
                                                    {log.action}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    Interação em <span className="text-blue-600 dark:text-blue-400 capitalize">{resourceLabel}</span>
                                                </span>
                                                <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                    <Calendar className="w-2.5 h-2.5" /> {formatDate(log.timestamp)}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-500">
                                                <span className="font-bold text-gray-700 dark:text-zinc-300">{log.user_email || "Sistema"}</span>
                                                {log.ip_address && (
                                                    <span className="opacity-50 font-mono text-[10px]">@{log.ip_address}</span>
                                                )}
                                                {log.resource_id && (
                                                    <span className="flex items-center gap-1 opacity-50 font-mono text-[10px]">
                                                        <ExternalLink className="w-2.5 h-2.5" /> ID: {log.resource_id.slice(-8)}
                                                    </span>
                                                )}
                                            </div>

                                            {log.details && (
                                                <div className="mt-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.01] border border-black/[0.03] dark:border-white/[0.03] text-[11px] text-gray-500 dark:text-zinc-400 italic font-medium leading-relaxed">
                                                    "{log.details}"
                                                </div>
                                            )}
                                        </div>

                                        {/* Side Effect Indicator */}
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination Glass Card */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 glass bg-white/50 dark:bg-white/[0.02] border-black/5 dark:border-white/5 rounded-[2rem]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Página {page} de {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-3 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-3 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditPage;
