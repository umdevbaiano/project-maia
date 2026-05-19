import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sun,
  Moon,
  ArrowRight,
  Menu,
  X,
  Scale,
  FileText,
  Search,
  BadgeCheck,
  Lock,
  Cpu,
  Database,
  Zap,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

// ── Scroll Reveal Hook ──
const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
};

// ── Reusable Section Wrapper with Reveal ──
const RevealSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}> = ({ children, className = '', id, delay }) => {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      id={id}
      className={`reveal ${delay ? `reveal-delay-${delay}` : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// ── Main Component ──
const LandingPage: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="min-h-screen font-sans">
      {/* ════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glass py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              MAIA
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#o-que-e" className="btn-maia-ghost text-sm">O que é</a>
            <a href="#como-funciona" className="btn-maia-ghost text-sm">Como funciona</a>
            <a href="#diferenciais" className="btn-maia-ghost text-sm">Diferenciais</a>
            <a href="#tecnologia" className="btn-maia-ghost text-sm">Tecnologia</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Alternar tema"
            >
              {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/chat" className="btn-maia-primary text-sm !px-5 !py-2.5 whitespace-nowrap">
              Experimentar
              <ArrowRight size={16} />
            </Link>
            <button
              className="md:hidden p-2"
              style={{ color: 'var(--text-main)' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden absolute top-full left-0 right-0 glass p-6 flex flex-col gap-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <a href="#o-que-e" onClick={closeMobileMenu} className="text-base font-medium py-2" style={{ color: 'var(--text-main)' }}>O que é</a>
            <a href="#como-funciona" onClick={closeMobileMenu} className="text-base font-medium py-2" style={{ color: 'var(--text-main)' }}>Como funciona</a>
            <a href="#diferenciais" onClick={closeMobileMenu} className="text-base font-medium py-2" style={{ color: 'var(--text-main)' }}>Diferenciais</a>
            <a href="#tecnologia" onClick={closeMobileMenu} className="text-base font-medium py-2" style={{ color: 'var(--text-main)' }}>Tecnologia</a>
            <div className="h-px w-full" style={{ background: 'var(--border)' }} />
            <Link to="/chat" onClick={closeMobileMenu} className="btn-maia-primary text-center">
              Experimentar
            </Link>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Ambient glow — subtle, not mesh gradient */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20 dark:opacity-10 blur-[120px] pointer-events-none"
          style={{ background: 'var(--accent)' }}
        />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          {/* Brand name */}
          <h1
            className="font-display text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight mb-6"
            style={{ color: 'var(--text-main)' }}
          >
            MAIA
            <span style={{ color: 'var(--accent)' }}>.</span>
          </h1>

          {/* Slogan */}
          <p
            className="text-xl sm:text-2xl md:text-3xl font-medium tracking-wide mb-8"
            style={{ color: 'var(--text-muted)' }}
          >
            Leia. Pergunte. Confie.
          </p>

          {/* One-liner */}
          <p
            className="text-base sm:text-lg mb-12 max-w-xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-subtle)' }}
          >
            Assistente jurídica com inteligência artificial que só responde o que pode provar.
          </p>

          {/* CTA */}
          <Link
            to="/chat"
            className="btn-maia-primary text-base !px-8 !py-4 inline-flex items-center gap-2.5 group"
          >
            Experimentar agora
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Floating Chat Preview */}
        <div className="relative z-10 mt-20 w-full max-w-2xl mx-auto">
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.15)',
            }}
          >
            <div className="p-6 space-y-5">
              {/* User message */}
              <div className="flex justify-end">
                <div
                  className="px-4 py-3 rounded-lg text-sm max-w-sm"
                  style={{ background: 'var(--accent)', color: '#0F172A' }}
                >
                  Quais são os requisitos da rescisão indireta segundo o art. 483 da CLT?
                </div>
              </div>
              {/* AI response */}
              <div className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
                >
                  <Scale className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-main)' }}>
                    <strong>Resumo Executivo</strong> — O art. 483 da CLT prevê hipóteses taxativas em que o empregado pode considerar rescindido o contrato e pleitear indenização...
                  </p>
                  <div
                    className="mt-3 px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2"
                    style={{
                      background: 'rgba(212, 175, 55, 0.08)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      color: 'var(--accent)',
                    }}
                  >
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Fonte: CLT_Consolidada.pdf, Art. 483 — Verificada
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5" style={{ border: '1.5px solid var(--text-subtle)' }}>
            <div
              className="w-1 h-2 rounded-full animate-bounce"
              style={{ background: 'var(--text-subtle)' }}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          O QUE É MAIA — Acronym Section
      ════════════════════════════════════════════ */}
      <section id="o-que-e" className="py-28 sm:py-36" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <RevealSection>
            <div className="gold-line mb-8" />
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-16" style={{ color: 'var(--text-main)' }}>
              O que é MAIA?
            </h2>
          </RevealSection>

          {/* Acronym Breakdown */}
          <div className="space-y-8 sm:space-y-10 mb-16">
            {[
              { letter: 'M', word: 'Módulo', rest: 'A base que conecta tudo — documentos, perguntas e respostas em um fluxo único.' },
              { letter: 'A', word: 'de Apoio', rest: 'Não substitui o advogado. Amplifica seu trabalho, reduzindo horas de pesquisa a segundos.' },
              { letter: 'I', word: 'Inteligente', rest: 'IA treinada para o ecossistema jurídico brasileiro, com anti-alucinação nativo.' },
              { letter: 'A', word: 'à Advocacia', rest: 'Feita para quem vive o Direito. CLT, CPC, Código Penal, CF e mais de 10 leis indexadas.' },
            ].map((item, i) => (
              <RevealSection key={i} delay={i + 1}>
                <div className="flex items-start gap-6 sm:gap-10">
                  <span className="acronym-letter text-5xl sm:text-6xl md:text-7xl leading-none select-none min-w-[52px] text-right">
                    {item.letter}
                  </span>
                  <div className="pt-1 sm:pt-2">
                    <h3 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: 'var(--text-main)' }}>
                      {item.word}
                    </h3>
                    <p className="text-base leading-relaxed max-w-lg" style={{ color: 'var(--text-muted)' }}>
                      {item.rest}
                    </p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
              style={{
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                color: 'var(--accent)',
              }}
            >
              <Cpu className="w-4 h-4" />
              Desenvolvida pela Vetta Hub para o ecossistema jurídico brasileiro
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          COMO FUNCIONA
      ════════════════════════════════════════════ */}
      <section
        id="como-funciona"
        className="py-28 sm:py-36"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <RevealSection>
            <div className="gold-line mb-8" />
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{ color: 'var(--text-main)' }}>
              Como funciona?
            </h2>
            <p className="text-lg mb-20 max-w-xl" style={{ color: 'var(--text-muted)' }}>
              Três passos. Do documento à resposta fundamentada.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {[
              {
                step: '01',
                icon: FileText,
                title: 'Envie',
                desc: 'Arraste contratos, petições ou qualquer PDF para o chat. A Maia lê, entende e memoriza cada página.',
              },
              {
                step: '02',
                icon: Search,
                title: 'Pergunte',
                desc: 'Faça sua pergunta em linguagem natural. A Maia busca nos seus documentos o trecho exato que responde.',
              },
              {
                step: '03',
                icon: BadgeCheck,
                title: 'Confie',
                desc: 'Cada resposta vem com a citação do documento e da página. Se a informação não existe, ela avisa.',
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i + 1}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.15)' }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    </div>
                    <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-subtle)' }}>
                      Passo {item.step}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-main)' }}>
                    {item.title}
                  </h3>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {item.desc}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          DIFERENCIAIS
      ════════════════════════════════════════════ */}
      <section
        id="diferenciais"
        className="py-28 sm:py-36"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <RevealSection>
            <div className="gold-line mb-8" />
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{ color: 'var(--text-main)' }}>
              Por que não usar o ChatGPT?
            </h2>
            <p className="text-lg mb-20 max-w-2xl" style={{ color: 'var(--text-muted)' }}>
              IAs genéricas inventam leis, fabricam jurisprudência e não têm acesso aos seus documentos. A Maia faz diferente.
            </p>
          </RevealSection>

          {/* Asymmetric comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Generic AI — compact */}
            <RevealSection delay={1} className="lg:col-span-2">
              <div
                className="h-full p-8 rounded-lg"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <p className="text-sm font-bold uppercase tracking-[0.15em] mb-6" style={{ color: 'var(--text-subtle)' }}>
                  IA Genérica
                </p>
                <ul className="space-y-4">
                  {[
                    'Inventa artigos e jurisprudência',
                    'Sem acesso aos seus documentos',
                    'Dados sensíveis em servidores externos',
                    'Sem citação de fontes',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <X className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#E11D48' }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>

            {/* MAIA — prominent */}
            <RevealSection delay={2} className="lg:col-span-3">
              <div
                className="h-full p-8 rounded-lg"
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  boxShadow: '0 0 40px -10px rgba(212, 175, 55, 0.08)',
                }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Scale className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <p className="text-sm font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--accent)' }}>
                    MAIA
                  </p>
                </div>
                <ul className="space-y-5">
                  {[
                    { title: 'Grounding estrito', desc: 'Só responde com base nos documentos que você inseriu.' },
                    { title: 'Busca semântica', desc: 'Encontra trechos relevantes mesmo quando a pergunta não usa as mesmas palavras do texto.' },
                    { title: 'LGPD compliant', desc: 'Dados criptografados, processamento seguro, sem vazamento.' },
                    { title: 'Citação obrigatória', desc: 'Toda resposta referencia documento, página e trecho exato.' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <BadgeCheck className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#10B981' }} />
                      <div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{item.title}</span>
                        <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>— {item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          TECNOLOGIA
      ════════════════════════════════════════════ */}
      <section
        id="tecnologia"
        className="py-28 sm:py-36"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <RevealSection>
            <div className="gold-line mb-8" />
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{ color: 'var(--text-main)' }}>
              Arquitetura
            </h2>
            <p className="text-lg mb-20 max-w-xl" style={{ color: 'var(--text-muted)' }}>
              Stack moderna, segura e projetada para o ecossistema jurídico brasileiro.
            </p>
          </RevealSection>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'MAIA IA', desc: 'IA Proprietária · Vetta Hub', icon: Cpu },
              { name: 'ChromaDB', desc: 'Banco Vetorial', icon: Database },
              { name: 'FastAPI', desc: 'Backend Python', icon: Zap },
              { name: 'React + Vite', desc: 'Frontend SPA', icon: BarChart3 },
              { name: 'Busca Híbrida', desc: 'Semântica + Palavras-chave', icon: Search },
              { name: 'Ranking Inteligente', desc: 'Fusão de Resultados', icon: BarChart3 },
              { name: 'AES-256', desc: 'Criptografia', icon: Lock },
              { name: 'MongoDB', desc: 'Persistência', icon: ShieldCheck },
            ].map((tech, i) => (
              <RevealSection key={i} delay={(i % 4) + 1}>
                <div
                  className="p-5 rounded-lg text-center transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <tech.icon className="w-5 h-5 mx-auto mb-3" style={{ color: 'var(--accent)' }} />
                  <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-main)' }}>{tech.name}</h4>
                  <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: 'var(--text-subtle)' }}>{tech.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════ */}
      <section className="py-28 sm:py-36" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <RevealSection>
            <h2
              className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6"
              style={{ color: 'var(--text-main)' }}
            >
              Veja com seus<br />próprios olhos.
            </h2>
            <p
              className="text-lg mb-12 max-w-lg mx-auto leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Envie um documento e faça uma pergunta. A resposta vem com a fonte.
            </p>
            <Link
              to="/chat"
              className="btn-maia-primary text-base !px-10 !py-4 inline-flex items-center gap-2.5 group"
            >
              Experimentar agora
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>MAIA</span>
            <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>• Vetta Hub</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
            © 2026 Vetta Hub. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
