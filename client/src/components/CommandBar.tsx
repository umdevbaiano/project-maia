import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Briefcase, Plus, FileText, Users, Clock, 
    MessageSquare, Settings, Layout, Zap, Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

interface CommandItem {
    id: string;
    label: string;
    icon: React.ElementType;
    shortcut?: string;
    action: () => void;
    category: 'Ações Rápidas' | 'Navegação' | 'Recentes';
}

const CommandBar: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const items: CommandItem[] = [
        // Ações Rápidas
        { id: 'new-case', label: 'Novo Processo', icon: Plus, shortcut: 'P', category: 'Ações Rápidas', action: () => navigate('/app/casos?action=new') },
        { id: 'new-peca', label: 'Gerar Nova Peça', icon: Zap, shortcut: 'N', category: 'Ações Rápidas', action: () => navigate('/app/pecas') },
        { id: 'maia-chat', label: 'Perguntar à Maia', icon: MessageSquare, category: 'Ações Rápidas', action: () => navigate('/app/chat') },
        
        // Navegação
        { id: 'nav-home', label: 'Dashboard', icon: Layout, category: 'Navegação', action: () => navigate('/app') },
        { id: 'nav-casos', label: 'Processos', icon: Briefcase, category: 'Navegação', action: () => navigate('/app/casos') },
        { id: 'nav-clientes', label: 'Clientes', icon: Users, category: 'Navegação', action: () => navigate('/app/clientes') },
        { id: 'nav-docs', label: 'Documentos', icon: FileText, category: 'Navegação', action: () => navigate('/app/documentos') },
        { id: 'nav-prazos', label: 'Prazos', icon: Clock, category: 'Navegação', action: () => navigate('/app/prazos') },
        { id: 'nav-settings', label: 'Configurações', icon: Settings, category: 'Navegação', action: () => navigate('/app/configuracoes') },
    ];

    const filteredItems = items.filter(item => 
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (open) {
            setSearch('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [open]);

    const handleSelect = (item: CommandItem) => {
        item.action();
        setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % filteredItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        } else if (e.key === 'Enter' && filteredItems[activeIndex]) {
            e.preventDefault();
            handleSelect(filteredItems[activeIndex]);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md"
                    />

                    {/* Command Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/10"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-4 px-6 py-5 border-b border-black/5 dark:border-white/10">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input 
                                ref={inputRef}
                                type="text"
                                placeholder="O que você deseja fazer agora?"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400 font-medium"
                            />
                            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/5 font-mono text-[10px] font-black text-gray-400">
                                <span>ESC</span>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] overflow-y-auto py-3 scrollbar-hide">
                            {filteredItems.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Nenhum resultado encontrado</p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Tente pesquisar por outros termos.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 px-3">
                                    {['Ações Rápidas', 'Navegação', 'Recentes'].map(category => {
                                        const categoryItems = filteredItems.filter(i => i.category === category);
                                        if (categoryItems.length === 0) return null;

                                        return (
                                            <div key={category} className="space-y-1">
                                                <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 opacity-60">
                                                    {category}
                                                </p>
                                                {categoryItems.map(item => {
                                                    const isSelected = filteredItems[activeIndex]?.id === item.id;
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleSelect(item)}
                                                            className={cn(
                                                                "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative",
                                                                isSelected 
                                                                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" 
                                                                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "p-2 rounded-xl transition-all",
                                                                isSelected ? "bg-white/20" : "bg-gray-100 dark:bg-zinc-800 group-hover:scale-110"
                                                            )}>
                                                                <item.icon className="w-4 h-4" />
                                                            </div>
                                                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                                            {item.shortcut && (
                                                                <div className={cn(
                                                                    "ml-auto flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-black",
                                                                    isSelected ? "bg-white/20 border-white/20" : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-40"
                                                                )}>
                                                                    <Command className="w-2.5 h-2.5" />
                                                                    <span>{item.shortcut}</span>
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer Tips */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                    <div className="px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800">↑↓</div>
                                    <span>Navegar</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                    <div className="px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800">ENTER</div>
                                    <span>Selecionar</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Maia Intelligence Bar</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandBar;
