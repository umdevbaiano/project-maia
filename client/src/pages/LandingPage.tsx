import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  ArrowRight,
  Menu,
  X,
  Shield,
  Brain,
  FileSearch,
  Sparkles,
  Scale
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
            <a href="#como-funciona" className="btn-maia-ghost">Como Funciona</a>
            <a href="#diferenciais" className="btn-maia-ghost">Diferenciais</a>
            <a href="#tecnologia" className="btn-maia-ghost">Tecnologia</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
            <Link to="/chat" className="btn-maia-primary whitespace-nowrap">
              Testar a IA
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
            <a href="#como-funciona" className="text-lg font-medium py-2">Como Funciona</a>
            <a href="#diferenciais" className="text-lg font-medium py-2">Diferenciais</a>
            <a href="#tecnologia" className="text-lg font-medium py-2">Tecnologia</a>
            <hr className="border-gray-200 dark:border-slate-800" />
            <Link to="/chat" className="text-lg font-medium py-2 text-center">Testar a IA</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            Apresentação OAB • Inteligência Artificial Jurídica
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] max-w-4xl leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            IA que lê seus documentos.<br />
            <span className="text-blue-600">Sem alucinação.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#475569] dark:text-[#94A3B8] max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
            A Maia usa <strong>RAG (Retrieval-Augmented Generation)</strong> para fundamentar cada resposta exclusivamente na doutrina e nos documentos que você inserir. Zero invenção.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-20 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
            <Link to="/chat" className="btn-maia-primary text-lg !px-8 !py-4 flex items-center gap-2 group">
              Testar a IA Agora
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Hero Mockup — Chat Preview */}
          <div className="relative w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-500">
            <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full -z-10"></div>
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-2xl bg-white dark:bg-[#151E2E]">
              {/* Mockup Toolbar */}
              <div className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-800 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto flex items-center gap-2 px-4 py-1 bg-gray-200 dark:bg-slate-800 rounded-md">
                  <Scale className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">maia.vettahub.com.br/chat</span>
                </div>
              </div>
              {/* Mockup Content — Chat simulation */}
              <div className="p-8 space-y-6">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white px-5 py-3 rounded-lg max-w-md text-sm">
                    Quais são os requisitos para rescisão indireta segundo o art. 483 da CLT?
                  </div>
                </div>
                {/* AI response */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">M</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 px-5 py-4 rounded-lg max-w-lg">
                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                      <strong>RESUMO EXECUTIVO</strong><br />
                      O art. 483 da CLT elenca as hipóteses taxativas de rescisão indireta...
                    </p>
                    <div className="mt-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        📄 [Doc: CLT_Consolidada.pdf, Art. 483] — Fonte verificada
                      </p>
                    </div>
                  </div>
                </div>
                {/* RAG indicator */}
                <div className="flex items-center justify-center gap-2 pt-4">
                  <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800"></div>
                  <span className="text-[10px] font-bold uppercase text-emerald-500 tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Resposta fundamentada em documento real
                  </span>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="py-32 border-t border-gray-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Como o RAG funciona na prática?
            </h2>
            <p className="text-xl text-[#475569] dark:text-[#94A3B8] max-w-2xl mx-auto">
              Em 3 passos, você sai de um PDF bruto para respostas jurídicas com citação obrigatória.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: FileSearch,
                title: 'Envie o Documento',
                desc: 'Arraste PDFs, DOCX ou TXT para a tela de chat. A IA extrai o texto, divide em fragmentos semânticos e indexa no banco vetorial ChromaDB.',
                detail: 'Chunking inteligente com 10% de overlap',
                color: 'blue',
              },
              {
                step: '02',
                icon: Brain,
                title: 'Busca Híbrida (RAG)',
                desc: 'Quando você faz uma pergunta, o sistema executa busca semântica (vetorial) + busca por palavras-chave (BM25) e combina os resultados com Reciprocal Rank Fusion.',
                detail: 'Dense + Sparse + RRF = Máxima precisão',
                color: 'sky',
              },
              {
                step: '03',
                icon: Shield,
                title: 'Resposta com Grounding',
                desc: 'A IA gera a resposta usando APENAS os fragmentos recuperados como fonte. Se a informação não estiver nos documentos, ela declara isso explicitamente.',
                detail: 'Chain of Verification anti-alucinação',
                color: 'emerald',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#151E2E] overflow-hidden p-10 flex flex-col hover:shadow-xl transition-all duration-300"
              >
                <span className="text-7xl font-black text-gray-100 dark:text-slate-900 absolute top-4 right-6 select-none">
                  {item.step}
                </span>
                <div className={`w-14 h-14 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-900/30 flex items-center justify-center text-${item.color}-600 dark:text-${item.color}-400 mb-6`}>
                  <item.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-[#475569] dark:text-[#94A3B8] mb-6 leading-relaxed flex-1">
                  {item.desc}
                </p>
                <div className={`px-4 py-2 rounded-xl bg-${item.color}-50 dark:bg-${item.color}-900/20 border border-${item.color}-100 dark:border-${item.color}-800`}>
                  <p className={`text-xs font-bold text-${item.color}-600 dark:text-${item.color}-400`}>
                    ⚡ {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentials */}
      <section id="diferenciais" className="py-32 bg-[#F8FAFC] dark:bg-[#030712]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Por que a Maia é diferente?
            </h2>
            <p className="text-xl text-[#475569] dark:text-[#94A3B8] max-w-2xl mx-auto">
              Enquanto IAs genéricas "inventam" jurisprudência, a Maia trabalha exclusivamente com fontes reais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Comparison */}
            <div className="rounded-3xl border-2 border-red-200 dark:border-red-900/50 bg-white dark:bg-[#151E2E] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                  <X size={20} />
                </div>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">IA Genérica (ChatGPT, etc.)</h3>
              </div>
              <ul className="space-y-4 text-[#475569] dark:text-[#94A3B8]">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Inventa artigos de lei e jurisprudência inexistente</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Não tem acesso aos documentos do seu processo</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Dados sensíveis vazam para servidores externos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Sem citação de fontes — impossível verificar</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border-2 border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-[#151E2E] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Maia (RAG Jurídico)</h3>
              </div>
              <ul className="space-y-4 text-[#475569] dark:text-[#94A3B8]">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span><strong>Grounding estrito</strong> — só responde com base nos documentos inseridos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>Busca semântica nos PDFs do seu escritório</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span><strong>LGPD compliant</strong> — dados criptografados, processamento local</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span><strong>Citação obrigatória</strong> — [Doc: arquivo.pdf, pág. X]</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="tecnologia" className="py-32 border-t border-gray-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Arquitetura de Referência
            </h2>
            <p className="text-xl text-[#475569] dark:text-[#94A3B8] max-w-2xl mx-auto">
              Stack moderna, escalável e segura — projetada para o ecossistema jurídico brasileiro.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Google Gemini', desc: 'LLM principal', icon: '🧠' },
              { name: 'ChromaDB', desc: 'Banco Vetorial', icon: '🗄️' },
              { name: 'FastAPI', desc: 'Backend Python', icon: '⚡' },
              { name: 'React + Vite', desc: 'Frontend SPA', icon: '💻' },
              { name: 'BM25 + Dense', desc: 'Busca Híbrida', icon: '🔍' },
              { name: 'RRF Fusion', desc: 'Ranking Inteligente', icon: '📊' },
              { name: 'AES-256', desc: 'Criptografia', icon: '🔒' },
              { name: 'MongoDB', desc: 'Persistência', icon: '🍃' },
            ].map((tech, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#151E2E] hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-300 text-center"
              >
                <span className="text-3xl mb-3 block">{tech.icon}</span>
                <h4 className="font-bold text-sm mb-1">{tech.name}</h4>
                <p className="text-[10px] uppercase tracking-widest text-[#475569] dark:text-[#94A3B8] font-medium">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-gray-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
            Veja a IA jurídica<br />em ação.
          </h2>
          <p className="text-xl text-[#475569] dark:text-[#94A3B8] mb-12 max-w-2xl mx-auto">
            Envie um documento real e faça perguntas. A Maia vai fundamentar cada resposta diretamente no texto — sem inventar nada.
          </p>
          <Link to="/chat" className="btn-maia-primary text-xl px-12 py-5 inline-flex items-center gap-3 group">
            Testar a IA Agora
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white dark:bg-[#0B0F19] border-t border-gray-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#475569] dark:text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
              M
            </div>
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">Maia</span>
            <span className="text-xs">• Projeto Themis</span>
          </div>
          <p>© 2026 Maia Tecnologia Jurídica. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
