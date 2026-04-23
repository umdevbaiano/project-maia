import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Key, ShieldCheck, Mail, Lock, User, CheckCircle, Target } from 'lucide-react';

const steps = [
  { id: 'welcome', title: 'Bem-vindo ao Themis' },
  { id: 'database', title: 'Infraestrutura' },
  { id: 'keys', title: 'Provedores de IA & DLP' },
  { id: 'admin', title: 'Master Admin' },
];

export const SetupWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    mongoUri: 'mongodb://localhost:27017',
    chromaUri: 'http://localhost:8000',
    aiProvider: 'gemini',
    aiKey: '',
    dlpProxyUrl: 'http://localhost:8080',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFinish = async () => {
    // Exemplo de submissão ao backend (FastAPI /setup/run)
    try {
      const response = await fetch('http://localhost:8000/setup/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert("Themis foi configurado com sucesso. Reiniciando os motores...");
        window.location.href = '/login';
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao configurar the server");
    }
  };

  return (
    <div className="min-h-screen bg-themis-bg flex flex-col items-center justify-center p-6 text-themis-text border-t-4 border-themis-gold/50 font-sans">
      <div className="w-full max-w-3xl bg-themis-surface rounded-2xl shadow-2xl overflow-hidden border border-themis-border relative">
        
        {/* Progress Bar superior */}
        <div className="h-1 bg-themis-border w-full flex">
          <motion.div 
            className="h-full bg-themis-gold"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        <div className="p-10 flex flex-col items-center relative">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              className="w-full"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-serif text-themis-snow mb-2">{steps[currentStep].title}</h1>
                <h2 className="text-sm font-medium tracking-widest text-themis-gold uppercase">Etapa {currentStep + 1} de {steps.length}</h2>
              </div>

              {/* CONTEÚDOS DE CADA PASSO */}
              {currentStep === 0 && (
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-themis-gold/10 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-12 h-12 text-themis-gold" />
                  </div>
                  <p className="text-themis-muted text-lg max-w-lg leading-relaxed">
                    Você está prestes a inicializar o <strong>Themis</strong>, um ecossistema High-End Legal Tech focado em inteligência processual e segurança DLP inegociável.
                  </p>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="relative group">
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-themis-muted w-5 h-5" />
                    <input type="text" name="mongoUri" value={formData.mongoUri} onChange={handleChange} placeholder="MongoDB URI"
                      className="w-full bg-themis-bg border border-themis-border rounded-lg py-3 pl-10 pr-4 text-themis-snow focus:outline-none focus:ring-1 focus:ring-themis-gold transition transition-all duration-300 shadow-sm" />
                  </div>
                  <div className="relative group">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-themis-muted w-5 h-5" />
                    <input type="text" name="chromaUri" value={formData.chromaUri} onChange={handleChange} placeholder="ChromaDB Host"
                      className="w-full bg-themis-bg border border-themis-border rounded-lg py-3 pl-10 pr-4 text-themis-snow focus:outline-none focus:ring-1 focus:ring-themis-gold transition duration-300 shadow-sm" />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="grid grid-cols-2 gap-4">
                     <button type="button" onClick={() => setFormData({...formData, aiProvider: 'gemini'})} className={`p-4 border rounded-xl flex items-center justify-center font-medium ${formData.aiProvider === 'gemini' ? 'border-themis-gold bg-themis-gold/5 text-themis-gold' : 'border-themis-border text-themis-muted'}`}>Gemini Google</button>
                     <button type="button" onClick={() => setFormData({...formData, aiProvider: 'openai'})} className={`p-4 border rounded-xl flex items-center justify-center font-medium ${formData.aiProvider === 'openai' ? 'border-themis-gold bg-themis-gold/5 text-themis-gold' : 'border-themis-border text-themis-muted'}`}>OpenAI gpt-4o</button>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-themis-muted w-5 h-5" />
                    <input type="password" name="aiKey" value={formData.aiKey} onChange={handleChange} placeholder="Sua Secret API Key" autoComplete="off"
                      className="w-full bg-themis-bg border border-themis-border rounded-lg py-3 pl-10 pr-4 text-themis-snow focus:outline-none focus:ring-1 focus:ring-themis-gold transition duration-300" />
                  </div>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-themis-muted w-5 h-5" />
                    <input type="text" name="dlpProxyUrl" value={formData.dlpProxyUrl} onChange={handleChange} placeholder="Vetta Shield DLP Proxy URL"
                      className="w-full bg-themis-bg border border-themis-border rounded-lg py-3 pl-10 pr-4 text-themis-snow focus:outline-none focus:ring-1 focus:ring-themis-gold transition duration-300" />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-themis-muted w-5 h-5" />
                    <input type="text" name="adminName" value={formData.adminName} onChange={handleChange} placeholder="Nome do Sócio/Admin"
                      className="w-full bg-themis-bg border border-themis-border rounded-lg py-3 pl-10 pr-4 text-themis-snow focus:outline-none focus:ring-1 focus:ring-themis-gold transition duration-300" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-themis-muted w-5 h-5" />
                    <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} placeholder="Email Institucional"
                      className="w-full bg-themis-bg border border-themis-border rounded-lg py-3 pl-10 pr-4 text-themis-snow focus:outline-none focus:ring-1 focus:ring-themis-gold transition duration-300" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-themis-muted w-5 h-5" />
                    <input type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} placeholder="Senha Mestra Segura"
                      className="w-full bg-themis-bg border border-themis-border rounded-lg py-3 pl-10 pr-4 text-themis-snow focus:outline-none focus:ring-1 focus:ring-themis-gold transition duration-300" />
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Navegação Inferior */}
          <div className="mt-12 flex justify-between w-full max-w-md mx-auto">
            {currentStep > 0 ? (
              <button onClick={prevStep} className="px-6 py-2.5 text-themis-muted hover:text-themis-snow transition duration-200 font-medium tracking-wide">
                Voltar
              </button>
            ) : <div />}
            
            {currentStep < steps.length - 1 ? (
              <button onClick={nextStep} className="bg-themis-snow text-themis-bg px-8 py-2.5 rounded-lg shadow-lg hover:shadow-xl hover:bg-white transition duration-300 font-semibold tracking-wide flex items-center space-x-2">
                <span>Continuar</span>
              </button>
            ) : (
              <button onClick={handleFinish} className="bg-themis-gold text-white px-8 py-2.5 rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition duration-300 font-bold tracking-wide flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Inicializar Core</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
