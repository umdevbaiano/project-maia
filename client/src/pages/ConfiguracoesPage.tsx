import React, { useState, useEffect } from 'react';
import { Settings, Users, Database, Sparkles, Building2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface UsageStats {
    plan: string;
    plan_name: string;
    users: { used: number; max: number };
    ai_calls: { used: number; max: number; reset_date: string };
    storage: { used_mb: number; max_mb: number };
}

const ConfiguracoesPage: React.FC = () => {
    const { user } = useAuth();
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const res = await api.get('/workspaces/usage');
                setUsage(res.data.usage);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsage();
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-blue-600 dark:text-blue-500" size={40} />
            </div>
        );
    }

    if (!usage) {
        return <div className="p-8 text-center text-red-500">Erro ao carregar os dados de assinatura.</div>;
    }

    const getProgressPct = (used: number, max: number) => Math.min((used / max) * 100, 100);
    const getProgressColor = (pct: number) => {
        if (pct >= 90) return 'bg-red-500';
        if (pct >= 75) return 'bg-amber-500';
        return 'bg-blue-600 dark:bg-blue-500';
    };

    // Calculate reset date formatting
    const resetDateFormatted = usage.ai_calls.reset_date 
        ? new Date(usage.ai_calls.reset_date).toLocaleDateString('pt-BR') 
        : '--';

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    <Settings className="text-blue-600 dark:text-blue-500" size={32} /> Configurações
                </h1>
                <p className="text-gray-600 dark:text-zinc-400 mt-2 text-lg">
                    Gerencie seu escritório, sua equipe e acompanhe sua assinatura.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* General Info */}
                <div className="lg:col-span-1 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#1e1e3a] rounded-2xl p-6 shadow-sm h-min">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Building2 className="text-gray-400" /> Meu Escritório
                    </h2>
                    
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Nome do Ambiente</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{user?.workspace_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Plano Atual</p>
                            <div className="inline-flex mt-2 items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-bold border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                                <Sparkles size={16} className="text-indigo-500" /> {usage.plan_name}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription & Limits */}
                <div className="lg:col-span-2 border border-blue-100 dark:border-blue-900/30 bg-white dark:bg-[#1e1e3a] rounded-2xl p-6 lg:p-8 shadow-xl shadow-blue-900/5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Assinatura e Uso
                        </h2>
                        {usage.plan !== 'enterprise' && (
                            <button className="flex items-center gap-2 text-sm px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                                Fazer Upgrade <ArrowRight size={16} />
                            </button>
                        )}
                    </div>

                    <div className="space-y-8">
                        {/* Users */}
                        <div>
                            <div className="flex justify-between text-sm mb-3">
                                <span className="font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                                    <Users size={18} className="text-gray-400" /> Assentos de Usuários
                                </span>
                                <span className="text-gray-500 dark:text-zinc-400 font-medium">
                                    {usage.users.used} / {usage.users.max >= 999999 ? 'Ilimitado' : usage.users.max}
                                </span>
                            </div>
                            <div className="h-4 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out ${getProgressColor(getProgressPct(usage.users.used, usage.users.max))}`} 
                                    style={{ width: `${getProgressPct(usage.users.used, usage.users.max)}%` }} 
                                />
                            </div>
                            {getProgressPct(usage.users.used, usage.users.max) >= 100 && (
                                <p className="text-xs text-red-500 mt-2 flex items-center gap-1 font-medium"><AlertTriangle size={14}/> Você atingiu o limite de usuários do seu plano.</p>
                            )}
                        </div>

                        {/* AI Calls */}
                        <div>
                            <div className="flex justify-between text-sm mb-3">
                                <span className="font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                                    <Sparkles size={18} className="text-amber-500" /> Chamadas de Inteligência Artificial
                                </span>
                                <span className="text-gray-500 dark:text-zinc-400 font-medium">
                                    {usage.ai_calls.used} / {usage.ai_calls.max >= 999999 ? 'Ilimitado' : usage.ai_calls.max}
                                </span>
                            </div>
                            <div className="h-4 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out delay-150 ${getProgressColor(getProgressPct(usage.ai_calls.used, usage.ai_calls.max))}`} 
                                    style={{ width: `${getProgressPct(usage.ai_calls.used, usage.ai_calls.max)}%` }} 
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">Sua franquia reseta em: <strong className="text-gray-700 dark:text-zinc-300">{resetDateFormatted}</strong></p>
                        </div>

                        {/* Storage */}
                        <div>
                            <div className="flex justify-between text-sm mb-3">
                                <span className="font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                                    <Database size={18} className="text-gray-400" /> Armazenamento (Documentos)
                                </span>
                                <span className="text-gray-500 dark:text-zinc-400 font-medium">
                                    {usage.storage.used_mb < 1 ? '< 1' : usage.storage.used_mb.toFixed(0)} MB / {usage.storage.max_mb >= 50000 ? '50 GB' : `${(usage.storage.max_mb / 1024).toFixed(0)} GB`}
                                </span>
                            </div>
                            <div className="h-4 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out delay-300 ${getProgressColor(getProgressPct(usage.storage.used_mb, usage.storage.max_mb))}`} 
                                    style={{ width: `${getProgressPct(usage.storage.used_mb, usage.storage.max_mb)}%` }} 
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracoesPage;
