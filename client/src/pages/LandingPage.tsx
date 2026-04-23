import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  FileText, 
  PieChart, 
  Sun, 
  Moon, 
  ArrowRight,
  Menu,
  X,
  Monitor,
  Smartphone,
  Apple,
  Laptop,
  Download,
  Info
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      {/* Navbar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glass py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              Maia
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#produto" className="btn-maia-ghost">Produto</a>
            <a href="#features" className="btn-maia-ghost">Features</a>
            <a href="#precos" className="btn-maia-ghost">Preços</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
            <Link to="/login" className="hidden md:block btn-maia-ghost">
              Login
            </Link>
            <Link to="/register" className="btn-maia-primary whitespace-nowrap">
              Começar Agora
            </Link>
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass absolute top-full left-0 right-0 p-6 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200">
            <a href="#produto" className="text-lg font-medium py-2">Produto</a>
            <a href="#features" className="text-lg font-medium py-2">Features</a>
            <a href="#precos" className="text-lg font-medium py-2">Preços</a>
            <hr className="border-gray-200 dark:border-slate-800" />
            <Link to="/login" className="text-lg font-medium py-2 text-center">Login</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            Novo: Inteligência Artificial integrada
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] max-w-4xl leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            A infraestrutura operacional do advogado moderno.
          </h1>
          
          <p className="text-xl md:text-2xl text-[#475569] dark:text-[#94A3B8] max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
            Automatize fluxos, gerencie processos e escale sua advocacia com precisão usando o software jurídico mais avançado do mercado.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-20 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
            <Link to="/register" className="btn-maia-primary text-lg !px-8 !py-4 flex items-center gap-2 group">
              Comece gratuitamente
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="btn-maia-ghost border border-gray-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 text-lg !px-8 !py-4">
              Fale com vendas
            </button>
          </div>

          {/* Hero Mockup */}
          <div className="relative w-full max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-500">
            <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full -z-10"></div>
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-2xl bg-white dark:bg-[#151E2E]">
              {/* Mockup Toolbar */}
              <div className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-800 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto w-1/3 h-5 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
              </div>
              {/* Mockup Content */}
              <div className="aspect-[16/10] p-6 lg:p-10 flex flex-col gap-6">
                 <div className="flex gap-6 h-full">
                    <div className="w-1/4 flex flex-col gap-4">
                      <div className="h-20 bg-blue-50 dark:bg-blue-900/20 rounded-xl"></div>
                      <div className="h-full bg-gray-50 dark:bg-slate-900/20 rounded-xl"></div>
                    </div>
                    <div className="flex-1 flex flex-col gap-6">
                       <div className="flex gap-4">
                          <div className="flex-1 h-32 bg-gray-50 dark:bg-slate-900/20 rounded-2xl p-6">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full mb-4"></div>
                            <div className="w-1/2 h-3 bg-gray-200 dark:bg-slate-800 rounded"></div>
                          </div>
                          <div className="flex-1 h-32 bg-gray-50 dark:bg-slate-900/20 rounded-2xl p-6">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full mb-4"></div>
                            <div className="w-1/2 h-3 bg-gray-200 dark:bg-slate-800 rounded"></div>
                          </div>
                       </div>
                       <div className="flex-1 bg-gray-50 dark:bg-slate-900/20 rounded-2xl p-8">
                          <div className="flex justify-between mb-8">
                            <div className="w-1/4 h-5 bg-gray-200 dark:bg-slate-800 rounded"></div>
                            <div className="w-20 h-5 bg-gray-200 dark:bg-slate-800 rounded"></div>
                          </div>
                          <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="flex gap-4 items-center">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-lg"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="w-1/3 h-3 bg-gray-200 dark:bg-slate-800 rounded"></div>
                                  <div className="w-1/4 h-2 bg-gray-100 dark:bg-slate-900 rounded"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 border-y border-gray-100 dark:border-slate-900 bg-white/50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#475569] dark:text-[#94A3B8] mb-12 opacity-80">
            Confiado por escritórios inovadores
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 dark:opacity-40 grayscale">
            {['Vercel', 'Stripe', 'Anthropic', 'OpenAI', 'Amazon'].map(logo => (
              <span key={logo} className="text-2xl font-bold tracking-tighter text-[#0F172A] dark:text-[#F8FAFC]">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Poderoso em todos os níveis.
            </h2>
            <p className="text-xl text-[#475569] dark:text-[#94A3B8] max-w-2xl">
              Nossa plataforma foi desenhada para resolver os gargalos da advocacia tradicional com tecnologia de ponta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Card 1: Large */}
            <div className="md:col-span-2 md:row-span-2 group relative rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#151E2E] overflow-hidden p-10 flex flex-col justify-between hover:shadow-xl transition-all duration-300">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Clock size={28} />
                </div>
                <h3 className="text-3xl font-bold">Automação de Prazos</h3>
                <p className="text-lg text-[#475569] dark:text-[#94A3B8] max-w-md">
                  Nunca mais perca um prazo processual. Nossa IA monitora diários oficiais e tribunais em tempo real, agendando automaticamente todas as tarefas críticas.
                </p>
              </div>
              <div className="relative mt-8 h-48 bg-gray-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 p-6 flex flex-col gap-3">
                 {[
                   { t: 'Prazo Fatal: Recurso Especial', d: 'Hoje, 23:59', c: 'bg-red-500' },
                   { t: 'Audiência de Conciliação', d: 'Amanhã, 14:00', c: 'bg-blue-500' },
                   { t: 'Manifestação sobre contestação', d: 'Em 2 dias', c: 'bg-yellow-500' }
                 ].map((p, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${p.c}`}></div>
                        <span className="font-medium text-sm">{p.t}</span>
                      </div>
                      <span className="text-xs text-slate-500">{p.d}</span>
                   </div>
                 ))}
              </div>
            </div>

            {/* Card 2: Small */}
            <div className="group relative rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#151E2E] overflow-hidden p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <FileText size={24} />
                </div>
                <h3 className="text-2xl font-bold">IA Documental</h3>
                <p className="text-[#475569] dark:text-[#94A3B8]">
                  Análise preditiva de decisões e geração automática de petições com base no seu histórico.
                </p>
              </div>
              <div className="mt-4 flex -space-x-2">
                 {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800"></div>)}
                 <div className="w-8 h-8 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center">+24</div>
              </div>
            </div>

            {/* Card 3: Small */}
            <div className="group relative rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#151E2E] overflow-hidden p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <PieChart size={24} />
                </div>
                <h3 className="text-2xl font-bold">Gestão Financeira</h3>
                <p className="text-[#475569] dark:text-[#94A3B8]">
                  Dashboards completos para controle de honorários, fluxo de caixa e rentabilidade por cliente.
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                 <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-blue-600"></div>
                 </div>
                 <div className="flex justify-between text-[10px] font-medium opacity-60">
                    <span>Meta Mensal</span>
                    <span>75%</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Downloads Section */}
      <section id="downloads" className="py-32 bg-[#F8FAFC] dark:bg-[#030712] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              Maia em <span className="text-blue-600">Qualquer Lugar</span>.
            </h2>
            <p className="text-xl text-[#475569] dark:text-[#94A3B8] max-w-2xl mx-auto">
              Sua advocacia não tem fronteiras. Baixe a Maia nativamente em todos os seus dispositivos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: 'Windows', icon: Monitor, sub: 'Versão Desktop', size: '120MB', ext: '.exe / .msi', color: 'blue' },
              { name: 'macOS', icon: Apple, sub: 'Apple Silicon & Intel', size: '115MB', ext: '.dmg', color: 'slate' },
              { name: 'Linux', icon: Laptop, sub: 'Ubuntu, Fedora, Debian', size: '95MB', ext: '.AppImage', color: 'orange' },
              { name: 'Android', icon: Smartphone, sub: 'Play Store / APK', size: '48MB', ext: '.apk', color: 'green' },
              { name: 'iOS', icon: Apple, sub: 'App Store', size: '52MB', ext: 'IPA', color: 'indigo' },
            ].map((p, i) => (
              <div key={i} className="group relative p-8 rounded-[2rem] bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/5 hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <p.icon size={36} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8] font-medium uppercase tracking-wider mb-4 opacity-60">{p.sub}</p>
                
                <div className="mt-auto pt-6 w-full space-y-4 border-t border-gray-50 dark:border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#475569] dark:text-[#94A3B8] opacity-50">
                    <span>{p.ext}</span>
                    <span>~{p.size}</span>
                  </div>
                  <button className="w-full py-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-sm font-bold flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <Download size={16} />
                    Download
                  </button>
                </div>
                
                {/* Visual Glow */}
                <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            ))}
          </div>

          <div className="mt-20 p-8 rounded-3xl bg-blue-600/5 border border-blue-600/10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 text-blue-600">
              <div className="p-3 bg-blue-600/10 rounded-2xl">
                <Info size={24} />
              </div>
              <p className="text-sm font-semibold max-w-md">
                Estimativa total do pacote de instalação: <span className="font-bold underline">750MB - 1GB</span> de espaço livre recomendado para todos os artefatos de build.
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#475569] dark:text-blue-400">Status da Distribuição</span>
              <span className="text-sm font-bold">Pronto para Empacotamento</span>
            </div>
          </div>
        </div>
      </section>

      {/* PreFooter CTA */}
      <section className="py-24 border-t border-gray-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
            Pronto para modernizar seu escritório?
          </h2>
          <p className="text-xl text-[#475569] dark:text-[#94A3B8] mb-12 max-w-2xl mx-auto">
            Junte-se a mais de 2.000 advogados que já escalaram sua produtividade com a Maia.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link to="/register" className="btn-maia-primary text-xl px-12 py-5">
                Criar conta agora
             </Link>
             <button className="btn-maia-ghost border border-gray-200 dark:border-slate-800 text-xl px-12 py-5">
                Ver demonstração
             </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white dark:bg-[#0B0F19] border-t border-gray-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                M
              </div>
              <span className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">Maia</span>
            </div>
            <p className="text-[#475569] dark:text-[#94A3B8] max-w-sm mb-8">
              A inteligência operacional definitiva para o setor jurídico. Tecnologia, eficiência e precisão para sua advocacia.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6">Produto</h4>
            <ul className="space-y-4 text-[#475569] dark:text-[#94A3B8]">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Segurança</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Marketplace</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Empresa</h4>
            <ul className="space-y-4 text-[#475569] dark:text-[#94A3B8]">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Sobre nós</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Contato</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-[#475569] dark:text-[#94A3B8]">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Termos</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-gray-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#475569] dark:text-[#94A3B8]">
           <p>© 2024 Maia Tecnologia Jurídica. Todos os direitos reservados.</p>
           <div className="flex gap-6">
              <a href="#" className="hover:text-blue-600 transition-colors">Twitter</a>
              <a href="#" className="hover:text-blue-600 transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Instagram</a>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
