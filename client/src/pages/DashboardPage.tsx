import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, FileText, Clock, AlertTriangle,
  ArrowRight, Loader2, ScrollText, TrendingUp,
  Activity, Calendar, ChevronRight, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  AreaChart, Area, ResponsiveContainer, CartesianGrid
} from 'recharts';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

const COLORS_STATUS = ['#3b82f6', '#22c55e', '#f59e0b', '#6366f1', '#ef4444'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5, 
      ease: [0.22, 1, 0.36, 1] as any
    } 
  }
};

interface DashboardStats {
  totals: {
    casos: number;
    clientes: number;
    documentos: number;
    prazos: number;
    pecas: number;
  };
  cases_by_status: Array<{ name: string; value: number; key: string }>;
  cases_by_type: Array<{ name: string; value: number; key: string }>;
  cases_by_month: Array<{ name: string; processos: number; prazos: number }>;
  deadlines_summary: Array<{ name: string; value: number; color: string }>;
  predictive_summary?: {
    avg_score: number;
    analyzed_count: number;
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-premium p-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 py-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 capitalize">{entry.name}:</span>
            <span className="text-xs font-black ml-auto">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<{ overdue: any[]; upcoming: any[] }>({ overdue: [], upcoming: [] });
  const [recentCasos, setRecentCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, alertsRes, casosRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/prazos/alerts'),
          api.get('/casos'),
        ]);
        setStats(statsRes.data);
        setAlerts({
          overdue: alertsRes.data.overdue || [],
          upcoming: alertsRes.data.upcoming || [],
        });
        setRecentCasos((casosRes.data.casos || []).slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const statCards = [
    { label: 'Processos', value: stats?.totals.casos || 0, icon: Briefcase, color: 'blue', link: '/app/casos' },
    { label: 'Clientes', value: stats?.totals.clientes || 0, icon: Users, color: 'purple', link: '/app/clientes' },
    { label: 'Documentos', value: stats?.totals.documentos || 0, icon: FileText, color: 'emerald', link: '/app/documentos' },
    { label: 'Prazos', value: stats?.totals.prazos || 0, icon: Clock, color: 'orange', link: '/app/prazos' },
    { label: 'Peças Geradas', value: stats?.totals.pecas || 0, icon: ScrollText, color: 'violet', link: '/app/pecas' },
  ];

  const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
    orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', border: 'border-orange-500/20' },
    violet: { bg: 'bg-violet-500/10', icon: 'text-violet-400', border: 'border-violet-500/20' },
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-10 space-y-10 max-w-[1600px] mx-auto"
    >
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-4 mb-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/10">
              Ambiente Inteligente
            </span>
            <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
              Versão 2.5 • Premium
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Seja bem-vindo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{user?.name?.split(' ')[0] || 'Doutor'}</span>
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 font-medium mt-2 flex items-center gap-2">
            Sua operação jurídica está <span className="text-emerald-500 font-bold flex items-center gap-1"><Activity className="w-3 h-3" /> normalizada</span> e rodando em alta performance.
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex items-center gap-4 text-sm">
          <Link to="/app/chat" className="btn-maia-primary shadow-xl shadow-blue-500/20 px-8">
            <Zap className="w-4 h-4 fill-current" />
            Central de Comando Maia
          </Link>
        </motion.div>
      </header>

      {/* Critical Alert Ribbon */}
      {alerts.overdue.length > 0 && (
        <motion.div variants={itemVariants}>
          <Link to="/app/prazos" className="block group">
            <div className="relative overflow-hidden bg-red-600 rounded-[2.5rem] p-8 flex items-center gap-8 shadow-2xl shadow-red-600/20 group-hover:scale-[1.01] transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all" />
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:rotate-12 transition-transform">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="flex-1 text-white">
                <p className="font-black text-2xl tracking-tight">ALERTA CRÍTICO DE PERFORMANCE</p>
                <p className="text-white/80 font-medium text-lg">
                  {alerts.overdue.length} prazos expiraram. Sua atenção imediata é mandatória para evitar sanções.
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-red-600 shadow-xl group-hover:translate-x-2 transition-transform">
                <ChevronRight className="w-8 h-8" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Main Asymmetric Bento Grid (12-column layout) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* HERO STATS - High visibility (Spans 12 columns) */}
        <motion.section 
          variants={itemVariants}
          className="md:col-span-12 flex flex-wrap items-center justify-between gap-6 p-1 bg-gray-100 dark:bg-white/5 rounded-[2.5rem] border border-black/5 dark:border-white/5"
        >
          {statCards.map((stat) => {
            const colors = colorMap[stat.color] || colorMap.blue;
            return (
              <Link key={stat.label} to={stat.link} className="flex-1 min-w-[150px] p-6 rounded-[2.2rem] flex flex-col items-center group transition-all hover:bg-white dark:hover:bg-white/5 hover:shadow-xl hover:glow-blue">
                <div className={cn("p-4 rounded-2xl mb-4 transition-all group-hover:scale-110", colors.bg)}>
                  <stat.icon className={cn("w-6 h-6", colors.icon)} />
                </div>
                <p className="text-4xl font-black mb-1">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40">{stat.label}</p>
              </Link>
            );
          })}
        </motion.section>

        {/* PREDICTIVE INSIGHT - New AI card (Spans 4 columns) */}
        <motion.section variants={itemVariants} className="md:col-span-4 bento-card relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 opacity-70 flex items-center gap-2">
            <Zap className="w-4 h-4 fill-current" /> Inteligência Preditiva
          </h3>
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="relative mb-6">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * (stats?.predictive_summary?.avg_score || 0)) / 100} className="text-white transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black">{stats?.predictive_summary?.avg_score || 0}%</span>
                <span className="text-[8px] font-black uppercase opacity-60">Êxito Médio</span>
              </div>
            </div>
            <p className="text-sm font-bold opacity-90">Análise de IA concluída em {stats?.predictive_summary?.analyzed_count || 0} processos.</p>
            <p className="text-[10px] opacity-60 mt-2 italic px-4">
              A média baseia-se em heurísticas de jurisprudência e complexidade fatual.
            </p>
          </div>
        </motion.section>

        {/* ANALYTICS MAIN - Deep Strategic view (Spans 8 columns) */}
        <motion.section variants={itemVariants} className="md:col-span-8 bento-card">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-blue-500" /> 
                Escalamento Operacional
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 font-medium italic">Monitoramento de processos e prazos no último semestre</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black uppercase opacity-60">Processos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-[10px] font-black uppercase opacity-60">Prazos</span>
              </div>
            </div>
          </div>
          <div className="h-[380px] w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={stats?.cases_by_month || []}>
                 <defs>
                   <linearGradient id="colorProc" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15}/>
                     <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorPrazo" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15}/>
                     <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.05)" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={15} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dx={-10} />
                 <Tooltip content={<CustomTooltip />} cursor={{stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 2}} />
                 <Area type="monotone" dataKey="processos" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorProc)" animationDuration={2000} />
                 <Area type="monotone" dataKey="prazos" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorPrazo)" animationDuration={2000} />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </motion.section>

        {/* STATUS PIE - Compact Visualization (Spans 4 columns) */}
        <motion.section variants={itemVariants} className="md:col-span-4 bento-card flex flex-col h-full bg-blue-500/[0.01] dark:bg-blue-500/[0.005]">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-10 opacity-50 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Distribuição de Status
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full h-[240px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.cases_by_status || []}
                    innerRadius={75} outerRadius={95}
                    paddingAngle={8} dataKey="value"
                    animationDuration={1500}
                    stroke="none"
                  >
                    {stats?.cases_by_status.map((_, i) => (
                      <Cell key={i} fill={COLORS_STATUS[i % COLORS_STATUS.length]} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black">{stats?.totals.casos || 0}</span>
                <span className="text-[9px] font-black uppercase opacity-40">Total Ativo</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-y-4 mt-10 w-full px-6 overflow-y-auto max-h-[150px] scrollbar-hide">
               {stats?.cases_by_status.map((item, i) => (
                 <div key={item.name} className="flex items-center group cursor-default">
                   <div className="w-3 h-3 rounded-full mr-4 group-hover:scale-125 transition-transform" style={{backgroundColor: COLORS_STATUS[i % COLORS_STATUS.length]}} />
                   <span className="text-[11px] font-black text-gray-500 dark:text-zinc-500 uppercase tracking-tight truncate">{item.name}</span>
                   <span className="ml-auto text-xs font-black">{item.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </motion.section>

        {/* TIMELINE/AGENDA - Tactical focus (Spans 4 columns) */}
        <motion.section variants={itemVariants} className="md:col-span-4 bento-card border-orange-500/10 dark:border-orange-500/5 bg-orange-500/[0.01]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Cronograma Crítico
            </h3>
            <Link to="/app/prazos" className="p-2 rounded-xl bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-all">
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="space-y-6">
            {alerts.upcoming.length > 0 ? alerts.upcoming.slice(0, 4).map((prazo: any) => (
              <div key={prazo.id} className="group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">Imediato</span>
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-500 transition-colors uppercase">{new Date(prazo.data_limite).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</span>
                    </div>
                    <p className="text-sm font-black text-gray-900 dark:text-white group-hover:translate-x-1 transition-transform">{prazo.titulo}</p>
                    <p className="text-[10px] text-gray-400 mt-1 truncate">{prazo.caso_titulo || 'Processo não vinculado'}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                <Calendar className="w-10 h-10 mb-2" />
                <p className="text-[10px] font-black uppercase">Agenda livre</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* RECENT MOVEMENTS - Details (Spans 8 columns) */}
        <motion.section variants={itemVariants} className="md:col-span-8 bento-card bg-blue-500/[0.01]">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
               <Activity className="w-4 h-4" /> Movimentações de Inteligência
             </h3>
             <Link to="/app/casos" className="text-[10px] font-black uppercase text-blue-600 hover:tracking-widest transition-all">Ver todos</Link>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {recentCasos.slice(0, 4).map((caso) => (
               <div key={caso.id} className="relative flex items-center gap-5 p-4 rounded-3xl bg-white/50 dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.05] hover:border-blue-500/20 transition-all group cursor-pointer hover:shadow-xl hover:glow-blue">
                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center text-blue-600 border border-blue-500/5 group-hover:scale-110 transition-transform">
                    <ScrollText className="w-6 h-6" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">{caso.titulo}</p>
                    <div className="flex items-center gap-3 mt-1 opacity-50">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 font-mono italic">{caso.numero}</span>
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">{caso.tipo_processo || 'Geral'}</span>
                    </div>
                 </div>
                 <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
               </div>
             ))}
           </div>
        </motion.section>

      </div>
    </motion.div>
  );
};

export default DashboardPage;
