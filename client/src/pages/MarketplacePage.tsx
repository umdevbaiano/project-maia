import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Loader2, Sparkles, TrendingUp, Search } from 'lucide-react';
import api from '../utils/api';

interface Template {
    id: string;
    titulo: string;
    descricao: string;
    tipo_peca: string;
    tipo_label: string;
    instrucoes_base: string;
    autor_nome: string;
    downloads: number;
}

export default function MarketplacePage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchMarketplace();
    }, []);

    const fetchMarketplace = async () => {
        setLoading(true);
        try {
            const res = await api.get('/templates/marketplace');
            setTemplates(res.data.templates || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUseTemplate = async (templateId: string, inst: string, tipo: string) => {
        try {
            // Increment popularity counter
            await api.post(`/templates/${templateId}/use`);
            
            // Pass state to PecasPage using location state memory
            navigate('/pecas', { state: { presetInstrucoes: inst, presetTipo: tipo } });
        } catch (error) {
            console.error('Error using template:', error);
            alert('Não foi possível usar este template agora.');
        }
    };

    const filteredTemplates = templates.filter((t: Template) => 
        t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tipo_label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-full animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800/50">
                        <Sparkles size={14} /> NOVO!
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        Marketplace de Prompts
                    </h1>
                    <p className="text-gray-600 dark:text-zinc-400 mt-2 text-lg">
                        Descubra, utilize e aprenda com os melhores templates jurídicos compartilhados pela comunidade.
                    </p>
                </div>
                
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar peças, teses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="animate-spin text-blue-600 dark:text-blue-500" size={40} />
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="text-center p-20 bg-white dark:bg-[#1e1e3a]/50 rounded-2xl border border-gray-100 dark:border-zinc-800/50">
                    <Store className="w-16 h-16 mx-auto text-gray-300 dark:text-zinc-700 mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 dark:text-zinc-300">Nenhum template encontrado</h2>
                    <p className="text-gray-500 dark:text-zinc-500 mt-2">Tente buscar por um termo diferente.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template: Template) => (
                        <div key={template.id} className="group bg-white dark:bg-[#1e1e3a] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                            
                            {/* Card Header Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 px-2.5 py-1 rounded-md">
                                        {template.tipo_label}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md" title="Vezes utilizado">
                                        <TrendingUp size={12} className="text-emerald-500" /> {template.downloads} usos
                                    </div>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {template.titulo}
                                </h3>
                                
                                <p className="text-sm text-gray-600 dark:text-zinc-400 flex-1 line-clamp-3 leading-relaxed">
                                    {template.descricao}
                                </p>
                                
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/50 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-zinc-500">
                                    <User size={14} />
                                    <span>Criado por <strong className="text-gray-700 dark:text-zinc-300">{template.autor_nome}</strong></span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-zinc-800">
                                <button 
                                    onClick={() => handleUseTemplate(template.id, template.instrucoes_base, template.tipo_peca)}
                                    className="w-full py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md group-hover:shadow-lg active:translate-y-0"
                                >
                                    <Sparkles size={16} /> Usar Template Agora
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
