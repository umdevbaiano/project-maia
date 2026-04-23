import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Mail, Lock, User, Building2, FileText, Loader2, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
    const [workspaceName, setWorkspaceName] = useState('');
    const [document, setDocument] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<1 | 2>(1);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register, verifyRegister } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            if (!workspaceName || !document || !adminName || !adminEmail || !password) {
                setError('Preencha todos os campos.');
                return;
            }

            if (password !== confirmPassword) {
                setError('As senhas não conferem.');
                return;
            }

            if (password.length < 6) {
                setError('A senha deve ter no mínimo 6 caracteres.');
                return;
            }

            setIsLoading(true);
            try {
                await register({
                    workspace_name: workspaceName,
                    document,
                    admin_name: adminName,
                    admin_email: adminEmail,
                    password,
                });
                setStep(2);
                setError('');
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Erro ao criar conta. Tente novamente.');
            } finally {
                setIsLoading(false);
            }
        } else {
            if (code.length !== 6) {
                setError('Digite o código de 6 dígitos inteiro.');
                return;
            }

            setIsLoading(true);
            try {
                await verifyRegister({
                    email: adminEmail,
                    code,
                });
                navigate('/app');
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Código inválido ou expirado.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            {/* Background gradient effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-600/20">
                            <Scale className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">MAIA</span>
                    </div>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm">Crie seu escritório na plataforma</p>
                </div>

                {/* Register Card */}
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Criar novo escritório</h2>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span className="text-sm text-red-400">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {step === 1 ? (
                            <>
                                {/* Workspace Info */}
                                <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Dados do Escritório</h3>
                                    <div>
                                        <label htmlFor="workspace" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                                            Nome do Escritório
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
                                            <input
                                                id="workspace"
                                                type="text"
                                                value={workspaceName}
                                                onChange={(e) => setWorkspaceName(e.target.value)}
                                                placeholder="Miranda & Associados"
                                                className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg pl-11 pr-4 py-2.5 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="document" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                                            CNPJ ou CPF
                                        </label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
                                            <input
                                                id="document"
                                                type="text"
                                                value={document}
                                                onChange={(e) => setDocument(e.target.value)}
                                                placeholder="00.000.000/0001-00"
                                                className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg pl-11 pr-4 py-2.5 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Info */}
                                <div className="space-y-4 pt-2">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Administrador</h3>
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                                            Nome completo
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
                                            <input
                                                id="name"
                                                type="text"
                                                value={adminName}
                                                onChange={(e) => setAdminName(e.target.value)}
                                                placeholder="Dr. Samuel Miranda"
                                                className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg pl-11 pr-4 py-2.5 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                                            E-mail
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
                                            <input
                                                id="reg-email"
                                                type="email"
                                                value={adminEmail}
                                                onChange={(e) => setAdminEmail(e.target.value)}
                                                placeholder="admin@escritorio.com"
                                                className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg pl-11 pr-4 py-2.5 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                                                Senha
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
                                                <input
                                                    id="reg-password"
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••"
                                                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg pl-11 pr-4 py-2.5 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                                                Confirmar
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
                                                <input
                                                    id="confirm-password"
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="••••••"
                                                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg pl-11 pr-4 py-2.5 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 mt-6"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {step === 1 ? 'Processando...' : 'Verificando...'}
                                        </>
                                    ) : (
                                        step === 1 ? 'Continuar para Verificação' : 'Criar Escritório'
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-2">
                                        <KeyRound className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Verifique seu e-mail</h3>
                                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                                        Enviamos um código de 6 dígitos para o e-mail: <br />
                                        <span className="font-semibold text-gray-800 dark:text-zinc-200">{adminEmail}</span>
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 text-center">
                                        Código de Segurança
                                    </label>
                                    <input
                                        id="code"
                                        type="text"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className="w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-lg py-4 text-center text-3xl tracking-[1em] font-mono text-gray-900 dark:text-zinc-100 placeholder-gray-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                        disabled={isLoading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || code.length !== 6}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Verificando...
                                        </>
                                    ) : (
                                        'Validar Código e Entrar'
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar e editar dados
                                </button>
                            </div>
                        )}
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 dark:text-zinc-500 text-sm">
                            Já tem uma conta?{' '}
                            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                                Fazer login
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-gray-500 dark:text-zinc-600 text-xs mt-6">
                    © 2026 Maia Platform · VettaLaw
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
