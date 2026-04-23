import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Database, 
  ShieldAlert 
} from 'lucide-react';

const OnboardingWizard: React.FC = () => {
    const { user, completeOnboarding } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateSampleData = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post('/workspaces/sample-data');
            setStep(3); // Success!
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erro ao gerar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            await api.put('/workspaces/onboarding/complete');
            completeOnboarding(); // Updates context and unmounts this component
        } catch (err: any) {
            setError('Erro ao concluir. Tente novamente.');
            setLoading(false);
        }
    };

    // If non-admin logged in before onboarding is done
    if (user?.role !== 'admin') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-[#1e1e3a] border border-gray-200 dark:border-zinc-800 w-full max-w-md p-8 rounded-2xl shadow-2xl text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ambiente em Configuração</h2>
                    <p className="text-gray-600 dark:text-zinc-400 mb-6">
                        O administrador do seu escritório acadêmico/jurídico ainda está concluindo as configurações iniciais. Aguarde a liberação.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1e1e3a] border border-gray-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">
                
                {/* Header Decoration */}
                <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full" />
                
                <div className="p-8">
                    {step === 1 && (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 transform rotate-3">
                                <Sparkles size={40} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                                Bem-vindo à Maia!
                            </h2>
                            <p className="text-gray-600 dark:text-zinc-400 text-lg mb-8 leading-relaxed">
                                Seu ambiente corporativo <strong>{user?.workspace_name}</strong> foi criado com sucesso. A Maia é seu sistema inteligente para gestão e automação jurídica.
                            </p>
                            <button
                                onClick={() => setStep(2)}
                                className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-600/25"
                            >
                                Vamos Configurar <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="text-center animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Database size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Popular Dados de Exemplo
                            </h2>
                            <p className="text-gray-600 dark:text-zinc-400 mb-6 leading-relaxed">
                                Para que você possa testar a geração de peças e a IA imediatamente, podemos criar um <strong>Cliente</strong>, um <strong>Processo</strong> e um <strong>Prazo</strong> fictícios no seu painel.
                            </p>
                            
                            {error && (
                                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/50">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={handleComplete}
                                    disabled={loading}
                                    className="px-6 py-3 rounded-xl font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Pular esta etapa
                                </button>
                                <button
                                    onClick={handleCreateSampleData}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <><Loader2 size={20} className="animate-spin" /> Gerando...</>
                                    ) : (
                                        <><Sparkles size={20} /> Gerar Dados Fictícios</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                                Tudo Pronto! 🚀
                            </h2>
                            <p className="text-gray-600 dark:text-zinc-400 mb-8 max-w-sm mx-auto">
                                Seu ambiente já está pré-configurado com dados de exemplo. Agora você já pode explorar o painel e testar o Assistente Maia.
                            </p>
                            
                            {error && (
                                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/50">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleComplete}
                                disabled={loading}
                                className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-xl font-extrabold text-lg transition-transform hover:scale-[1.02] shadow-xl shadow-green-500/20 active:scale-95"
                            >
                                {loading ? <Loader2 size={24} className="animate-spin" /> : 'Acessar Plataforma'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
