import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Users, FileText, Settings, LogOut, Scale, Briefcase, Clock, ScrollText, Shield, Sun, Moon, Store, ChevronRight, Command, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWidget from './ChatWidget';
import CommandBar from './CommandBar';
import OnboardingWizard from './OnboardingWizard';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../utils/cn';

const Layout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isAdminOrSocio = user?.role === 'admin' || user?.role === 'socio';
  
  const isActive = (path: string) => {
    if (path === '/app' && location.pathname === '/app') return true;
    if (path !== '/app' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/app', icon: Home, label: 'Início' },
    { path: '/app/chat', icon: MessageSquare, label: 'Assistente (Maia)' },
    { path: '/app/casos', icon: Briefcase, label: 'Processos' },
    { path: '/app/clientes', icon: Users, label: 'Clientes' },
    { path: '/app/documentos', icon: FileText, label: 'Documentos' },
    { path: '/app/prazos', icon: Clock, label: 'Meus Prazos' },
    { path: '/app/pecas', icon: ScrollText, label: 'Redação (Peças)' },
    { path: '/app/jurisprudencia', icon: Scale, label: 'Jurisprudência' },
    { path: '/app/action-center', icon: Zap, label: 'Action Center' },
    { path: '/app/marketplace', icon: Store, label: 'Marketplace' },
  ];

  const adminNavItems = [
    { path: '/app/equipe', icon: Users, label: 'Equipe' },
    { path: '/app/auditoria', icon: Shield, label: 'Auditoria' },
  ];

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-[#090E1A] font-inter overflow-hidden">
      <aside className="w-72 glass-premium border-r border-black/5 dark:border-white/10 flex flex-col z-20 m-4 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-10">
          <Link to="/" className="flex items-center gap-4 group">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-500/30"
            >
              <Scale className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white block leading-none">MAIA</span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-[0.3em] uppercase opacity-80 mt-1">Plataforma</span>
            </div>
          </Link>
        </div>

        {user && (
          <div className="mx-4 mb-6 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {user.name?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-500 truncate uppercase tracking-wider">{user.workspace_name}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto scrollbar-hide">
          <p className="px-5 mb-4 text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.25em] opacity-50">Menu Principal</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden",
                  active
                    ? "text-white shadow-xl shadow-blue-600/20"
                    : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 z-0"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                
                <Icon className={cn(
                  "w-5 h-5 z-10 transition-transform duration-300",
                  active ? "scale-110" : "group-hover:scale-110 opacity-70 group-hover:opacity-100"
                )} />
                <span className={cn(
                  "font-bold text-sm tracking-tight z-10 transition-colors duration-300",
                  active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                )}>
                  {item.label}
                </span>

                {active && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-auto z-10"
                  >
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </motion.div>
                )}
              </Link>
            );
          })}
          
          {isAdminOrSocio && (
            <>
              <div className="h-px bg-black/5 dark:bg-white/10 my-6 mx-5" />
              <p className="px-5 mb-4 text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.25em] opacity-50">Administração</p>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "relative flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden",
                      active
                        ? "text-white shadow-xl shadow-amber-500/20"
                        : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="active-pill-admin"
                        className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 z-0"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <Icon className={cn(
                      "w-5 h-5 z-10 transition-transform duration-300",
                      active ? "scale-110" : "group-hover:scale-110 opacity-70 group-hover:opacity-100"
                    )} />
                    <span className={cn(
                      "font-bold text-sm tracking-tight z-10",
                      active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="px-4 mb-2">
            <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-blue-600/5 border border-blue-600/10 text-blue-600/60 text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <Command className="w-3 h-3" />
                    <span>Busca Global</span>
                </div>
                <div className="flex items-center gap-1 opacity-50 font-mono">
                    <span>⌘</span>
                    <span>K</span>
                </div>
            </div>
        </div>

        <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/5 m-4 rounded-3xl space-y-1">
          <button
            onClick={() => {
              if (theme === 'light') setTheme('dark');
              else if (theme === 'dark') setTheme('system');
              else setTheme('light');
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-gray-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
              <span className="font-semibold text-sm">
                {theme === 'system' ? 'Tema: Auto' : theme === 'dark' ? 'Tema: Escuro' : 'Tema: Claro'}
              </span>
            </div>
          </button>
          
          <Link
            to="/app/configuracoes"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
          >
            <Settings className="w-5 h-5" />
            <span className="font-semibold text-sm">Ajustes</span>
          </Link>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-sm">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden p-4">
        <motion.div 
          key={location.pathname}
          initial={{ opacity: 0, y: 15, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full w-full rounded-[3rem] bg-white dark:bg-white/5 border border-black/[0.03] dark:border-white/10 shadow-inner p-0 overflow-auto scrollbar-hide"
        >
          <Outlet />
        </motion.div>
      </main>

      {location.pathname !== '/app/chat' && <ChatWidget />}

      <AnimatePresence>
        {user && !user.workspace_onboarding_completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <OnboardingWizard />
          </motion.div>
        )}
      </AnimatePresence>

      <CommandBar />
    </div>
  );
};

export default Layout;
