import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Key, Bot, ChevronUp, Server, CheckCircle2, CircleDashed } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ActionCenterPage: React.FC = () => {
  const [certUploaded, setCertUploaded] = useState(false);

  return (
    <div className="h-full flex flex-col p-8 space-y-8 select-none">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
            Action Center
          </h1>
          <p className="text-sm font-semibold text-gray-500 dark:text-zinc-500 mt-2 uppercase tracking-widest">
            Comando de Operações da Maia (RPA & Hardware)
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold ring-1 ring-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            VETTA VAULT CONECTADO
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Painel de Certificado (Storage A1) */}
        <div className="col-span-1 lg:col-span-1 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 p-6 rounded-3xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 relative overflow-hidden group shadow-xl"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
                <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Cofre Criptográfico</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Certificado Digital (A1)</p>
              </div>
            </div>

            <div className={`mt-4 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
                ${certUploaded ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-gray-200 dark:border-white/10 hover:border-blue-500/50 dark:hover:bg-white/5'}` }
                onClick={() => setCertUploaded(!certUploaded)}
            >
              {certUploaded ? (
                <>
                  <Shield className="w-12 h-12 text-emerald-500 mb-4" />
                  <span className="font-bold text-gray-900 dark:text-white">samuel_miranda.pfx</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Injetado no Vetta Vault</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-10 h-10 text-gray-400 dark:text-zinc-600 mb-2" />
                  <span className="font-semibold text-sm text-gray-600 dark:text-zinc-300">Arraste o Certificado A1</span>
                  <span className="text-xs text-gray-400 mt-1">O arquivo ficara retido e selado localmente no Edge.</span>
                </>
              )}
            </div>
            
            <p className="mt-6 text-[11px] text-gray-500 dark:text-zinc-500 leading-relaxed font-mono">
               Acesso da Maia aos tribunais via Playwright RPA requer delegação de credenciais ativas. O Hardware Fingerprint foi validado com sucesso neste Node.
            </p>
          </motion.div>
        </div>

        {/* Fila de Protocolos (RPA Actions) */}
        <div className="col-span-1 lg:col-span-2 flex flex-col">
           <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 p-6 rounded-3xl bg-white dark:bg-[#0A0D14] border border-gray-100 dark:border-white/5 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl">
                  <Bot className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Fila de Protocolo RPA</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Atividades do Agente no PJe / e-SAJ</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Server className="w-4 h-4 text-gray-400" /> 
                 <span className="text-xs font-mono text-gray-400">Node: vtt-vault-01x</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Item de Fila Animado */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 relative overflow-hidden">
                 <div className="absolute bottom-0 left-0 h-[2px] bg-amber-500 w-[65%] transition-all" />
                 <div className="flex justify-between items-start">
                    <div>
                       <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-1">
                          <CircleDashed className="w-3 h-3 animate-spin"/>
                          Protocolando no PJe (TJSP)
                       </span>
                       <h4 className="font-semibold text-gray-900 dark:text-white">Petição Inicial - Fraude Bancária (João da Silva)</h4>
                       <p className="text-xs text-gray-500 mt-1">Status: Resolvendo Captcha Visual HCaptcha via Vetta Core...</p>
                    </div>
                    <span className="text-sm font-mono text-gray-400">65%</span>
                 </div>
              </div>

              {/* Item Concluido */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 opacity-70">
                 <div className="flex justify-between items-start">
                    <div>
                       <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-3 h-3"/>
                          Protocolo Sucesso
                       </span>
                       <h4 className="font-semibold text-gray-900 dark:text-white line-through">Recurso Inominado (Apple Inc)</h4>
                       <p className="text-xs text-gray-500 mt-1">Status: Recibo #77281-A baixado e salvo no GED.</p>
                    </div>
                    <span className="text-xs text-gray-400">Há 12 min</span>
                 </div>
              </div>

            </div>
            
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default ActionCenterPage;
