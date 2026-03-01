import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, FileText, Clock, AlertTriangle, Scale,
  ArrowRight, Loader2, ScrollText, TrendingUp
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  AreaChart, Area, ResponsiveContainer, Legend
} from 'recharts';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const COLORS_STATUS = ['#3b82f6', '#22c55e', '#f59e0b', '#6366f1', '#ef4444'];
const COLORS_TIPO = ['#6366f1', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'];
const COLORS_PRAZOS = ['#f59e0b', '#ef4444', '#22c55e'];

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
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(24,24,27,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px', padding: '0.5rem 0.75rem',
    }}>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ margin: 0, fontSize: '0.8rem', color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
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
    { label: 'Processos', value: stats?.totals.casos || 0, icon: Briefcase, color: 'blue', link: '/casos' },
    { label: 'Clientes', value: stats?.totals.clientes || 0, icon: Users, color: 'purple', link: '/clientes' },
    { label: 'Documentos', value: stats?.totals.documentos || 0, icon: FileText, color: 'emerald', link: '/documentos' },
    { label: 'Prazos', value: stats?.totals.prazos || 0, icon: Clock, color: 'orange', link: '/prazos' },
    { label: 'Peças Geradas', value: stats?.totals.pecas || 0, icon: ScrollText, color: 'violet', link: '/pecas' },
  ];

  const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
    orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', border: 'border-orange-500/20' },
    violet: { bg: 'bg-violet-500/10', icon: 'text-violet-400', border: 'border-violet-500/20' },
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Scale className="w-7 h-7 text-blue-500" />
          Olá, {user?.name?.split(' ')[0] || 'Advogado'}
        </h1>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">Visão geral do escritório</p>
      </div>

      {/* Overdue Alert */}
      {alerts.overdue.length > 0 && (
        <Link to="/prazos" className="block mb-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 hover:bg-red-500/15 transition-all">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">⚠️ {alerts.overdue.length} prazo(s) vencido(s)!</p>
              <p className="text-red-400/70 text-sm">{alerts.overdue.map((p: any) => p.titulo).join(', ')}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-red-400" />
          </div>
        </Link>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(stat => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <Link key={stat.label} to={stat.link}
              className={`${colors.bg} border ${colors.border} rounded-xl p-5 hover:scale-[1.02] transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-6 h-6 ${colors.icon}`} />
                <TrendingUp className={`w-4 h-4 ${colors.icon} opacity-50`} />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Cases by Status - Pie */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-300 mb-4 uppercase tracking-wider">Status dos Processos</h3>
          {stats && stats.cases_by_status.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.cases_by_status}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value"
                >
                  {stats.cases_by_status.map((_, i) => (
                    <Cell key={i} fill={COLORS_STATUS[i % COLORS_STATUS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value: string) => <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 dark:text-zinc-600 text-sm">Sem dados</div>
          )}
        </div>

        {/* Cases by Type - Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-300 mb-4 uppercase tracking-wider">Por Área do Direito</h3>
          {stats && stats.cases_by_type.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.cases_by_type}>
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Processos" radius={[6, 6, 0, 0]}>
                  {stats.cases_by_type.map((_, i) => (
                    <Cell key={i} fill={COLORS_TIPO[i % COLORS_TIPO.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 dark:text-zinc-600 text-sm">Sem dados</div>
          )}
        </div>

        {/* Deadlines Summary - Pie */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-300 mb-4 uppercase tracking-wider">Situação dos Prazos</h3>
          {stats && stats.deadlines_summary.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.deadlines_summary}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value"
                >
                  {stats.deadlines_summary.map((entry, i) => (
                    <Cell key={i} fill={entry.color || COLORS_PRAZOS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value: string) => <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 dark:text-zinc-600 text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* Timeline + Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Timeline */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-300 mb-4 uppercase tracking-wider">Últimos 6 Meses</h3>
          {stats && stats.cases_by_month.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.cases_by_month}>
                <defs>
                  <linearGradient id="gradProcessos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPrazos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="processos" name="Processos" stroke="#6366f1" fill="url(#gradProcessos)" strokeWidth={2} />
                <Area type="monotone" dataKey="prazos" name="Prazos" stroke="#f59e0b" fill="url(#gradPrazos)" strokeWidth={2} />
                <Legend
                  formatter={(value: string) => <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>{value}</span>}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 dark:text-zinc-600 text-sm">Sem dados</div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" /> Próximos Prazos
            </h3>
            <Link to="/prazos" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {alerts.upcoming.length > 0 ? (
            <div className="space-y-3">
              {alerts.upcoming.slice(0, 5).map((prazo: any) => (
                <div key={prazo.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800/50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{prazo.titulo}</p>
                    {prazo.caso_titulo && <p className="text-xs text-gray-500 dark:text-zinc-500">📁 {prazo.caso_titulo}</p>}
                  </div>
                  <span className="text-xs text-orange-400 font-medium whitespace-nowrap">
                    📅 {new Date(prazo.data_limite).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-zinc-500 text-sm py-4 text-center">Nenhum prazo próximo.</p>
          )}
        </div>

        {/* Recent Cases */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-400" /> Processos Recentes
            </h3>
            <Link to="/casos" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {recentCasos.length > 0 ? (
            <div className="space-y-3">
              {recentCasos.map((caso: any) => (
                <div key={caso.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800/50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{caso.titulo}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 font-mono">{caso.numero}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${caso.status === 'em_andamento' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                    caso.status === 'ativo' ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                      'bg-gray-100 text-gray-500 border-gray-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20'
                    }`}>{caso.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-zinc-500 text-sm py-4 text-center">Nenhum processo cadastrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
