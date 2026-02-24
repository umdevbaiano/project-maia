import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, FileText, Clock, AlertTriangle, TrendingUp, Scale, ArrowRight, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface DashboardData {
  casos_count: number;
  clientes_count: number;
  documentos_count: number;
  prazos_pendentes: number;
  overdue: any[];
  upcoming: any[];
  recent_casos: any[];
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [casosRes, clientesRes, docsRes, alertsRes] = await Promise.all([
          api.get('/casos'),
          api.get('/clientes'),
          api.get('/documents'),
          api.get('/prazos/alerts'),
        ]);
        setData({
          casos_count: casosRes.data.casos?.length || 0,
          clientes_count: clientesRes.data.clientes?.length || 0,
          documentos_count: docsRes.data.documents?.length || 0,
          prazos_pendentes: (alertsRes.data.overdue_count || 0) + (alertsRes.data.upcoming_count || 0),
          overdue: alertsRes.data.overdue || [],
          upcoming: alertsRes.data.upcoming || [],
          recent_casos: (casosRes.data.casos || []).slice(0, 5),
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const stats = [
    { label: 'Processos', value: data?.casos_count || 0, icon: Briefcase, color: 'blue', link: '/casos' },
    { label: 'Clientes', value: data?.clientes_count || 0, icon: Users, color: 'purple', link: '/clientes' },
    { label: 'Documentos', value: data?.documentos_count || 0, icon: FileText, color: 'emerald', link: '/documentos' },
    { label: 'Prazos Pendentes', value: data?.prazos_pendentes || 0, icon: Clock, color: 'orange', link: '/prazos' },
  ];

  const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
    orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', border: 'border-orange-500/20' },
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Scale className="w-7 h-7 text-blue-500" />
          Olá, {user?.name?.split(' ')[0] || 'Advogado'}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Visão geral do escritório</p>
      </div>

      {/* Overdue Alert */}
      {data && data.overdue.length > 0 && (
        <Link to="/prazos" className="block mb-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 hover:bg-red-500/15 transition-all">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">⚠️ {data.overdue.length} prazo(s) vencido(s)!</p>
              <p className="text-red-400/70 text-sm">{data.overdue.map((p: any) => p.titulo).join(', ')}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-red-400" />
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <Link key={stat.label} to={stat.link}
              className={`${colors.bg} border ${colors.border} rounded-xl p-5 hover:scale-[1.02] transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-6 h-6 ${colors.icon}`} />
                <TrendingUp className={`w-4 h-4 ${colors.icon} opacity-50`} />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-zinc-400 text-sm mt-1">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" /> Próximos Prazos
            </h2>
            <Link to="/prazos" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">Ver todos <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {data && data.upcoming.length > 0 ? (
            <div className="space-y-3">
              {data.upcoming.slice(0, 5).map((prazo: any) => (
                <div key={prazo.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{prazo.titulo}</p>
                    {prazo.caso_titulo && <p className="text-xs text-zinc-500">📁 {prazo.caso_titulo}</p>}
                  </div>
                  <span className="text-xs text-orange-400 font-medium whitespace-nowrap">
                    📅 {new Date(prazo.data_limite).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm py-4 text-center">Nenhum prazo próximo.</p>
          )}
        </div>

        {/* Recent Cases */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" /> Processos Recentes
            </h2>
            <Link to="/casos" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">Ver todos <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {data && data.recent_casos.length > 0 ? (
            <div className="space-y-3">
              {data.recent_casos.map((caso: any) => (
                <div key={caso.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{caso.titulo}</p>
                    <p className="text-xs text-zinc-500 font-mono">{caso.numero}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${caso.status === 'em_andamento' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      caso.status === 'ativo' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>{caso.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm py-4 text-center">Nenhum processo cadastrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
