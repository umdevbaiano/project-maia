import React from 'react';
import { FileText, AlertCircle, Users, TrendingUp, Calendar, Clock } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const kpiData = [
    {
      title: 'Processos Ativos',
      value: '12',
      icon: FileText,
      color: 'bg-blue-600',
      trend: '+2 este mês',
    },
    {
      title: 'Prazos Urgentes',
      value: '3',
      icon: AlertCircle,
      color: 'bg-red-600',
      trend: 'Próximos 7 dias',
    },
    {
      title: 'Novos Clientes',
      value: '8',
      icon: Users,
      color: 'bg-green-600',
      trend: '+3 este mês',
    },
    {
      title: 'Taxa de Sucesso',
      value: '87%',
      icon: TrendingUp,
      color: 'bg-purple-600',
      trend: '+5% vs. mês anterior',
    },
  ];

  const upcomingDeadlines = [
    {
      id: 1,
      title: 'Contestação - Processo 1234/2024',
      client: 'João Silva',
      date: '2024-02-15',
      priority: 'high',
    },
    {
      id: 2,
      title: 'Recurso - Processo 5678/2024',
      client: 'Maria Santos',
      date: '2024-02-18',
      priority: 'high',
    },
    {
      id: 3,
      title: 'Petição Inicial - Processo 9012/2024',
      client: 'Pedro Oliveira',
      date: '2024-02-22',
      priority: 'medium',
    },
    {
      id: 4,
      title: 'Audiência - Processo 3456/2024',
      client: 'Ana Costa',
      date: '2024-02-25',
      priority: 'medium',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Novo processo cadastrado',
      details: 'Processo 7890/2024 - Ação Trabalhista',
      time: 'Há 2 horas',
    },
    {
      id: 2,
      action: 'Documento atualizado',
      details: 'Contrato de Prestação de Serviços - Cliente XYZ',
      time: 'Há 5 horas',
    },
    {
      id: 3,
      action: 'Reunião agendada',
      details: 'Consulta com João Silva - 16/02/2024 às 14h',
      time: 'Há 1 dia',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      default:
        return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return 'Normal';
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-zinc-400">Visão geral do seu escritório jurídico</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className={`${kpi.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-zinc-400 text-sm font-medium mb-1">{kpi.title}</h3>
              <p className="text-3xl font-bold text-white mb-2">{kpi.value}</p>
              <p className="text-xs text-zinc-500">{kpi.trend}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Prazos Próximos
            </h2>
          </div>
          <div className="space-y-3">
            {upcomingDeadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-medium text-sm">{deadline.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                      deadline.priority
                    )}`}
                  >
                    {getPriorityLabel(deadline.priority)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {deadline.client}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(deadline.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6">Atividade Recente</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="border-l-2 border-blue-600 pl-4">
                <h3 className="text-white font-medium text-sm mb-1">{activity.action}</h3>
                <p className="text-zinc-400 text-xs mb-2">{activity.details}</p>
                <span className="text-zinc-500 text-xs">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simple Chart Visualization */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Evolução de Casos (Últimos 6 Meses)
        </h2>
        <div className="h-64 flex items-end justify-between gap-4">
          {[45, 52, 48, 61, 58, 65].map((value, index) => {
            const months = ['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev'];
            const height = (value / 70) * 100;

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full">
                  <div
                    className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-500 hover:to-blue-300"
                    style={{ height: `${height}%` }}
                  />
                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white">
                    {value}
                  </span>
                </div>
                <span className="text-xs text-zinc-400 mt-2">{months[index]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
