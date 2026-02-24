import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Users, FileText, Settings, LogOut, Scale, Briefcase, Clock, ScrollText, Shield, Sun, Moon } from 'lucide-react';
import ChatWidget from './ChatWidget';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/chat', icon: MessageSquare, label: 'Assistente (Maia)' },
    { path: '/casos', icon: Briefcase, label: 'Processos' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/documentos', icon: FileText, label: 'Documentos' },
    { path: '/prazos', icon: Clock, label: 'Meus Prazos' },
    { path: '/pecas', icon: ScrollText, label: 'Redação (Peças)' },
    { path: '/jurisprudencia', icon: Scale, label: 'Jurisprudência' },
  ];

  // Admin-only nav items
  const isAdminOrSocio = user?.role === 'admin' || user?.role === 'socio';
  const adminNavItems = [
    { path: '/auditoria', icon: Shield, label: 'Auditoria' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">MAIA</span>
          </Link>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{user.workspace_name}</p>
            <span className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wider text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-400/10 px-2 py-0.5 rounded">
              {user.role}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          {isAdminOrSocio && adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${active
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-600 dark:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-amber-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-amber-400'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-all"
            aria-label="Alternar Tema"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </span>
            </div>
          </button>
          <Link
            to="/configuracoes"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Configurações</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Floating Chat Widget (Hidden on /chat page) */}
      {location.pathname !== '/chat' && <ChatWidget />}
    </div>
  );
};

export default Layout;
