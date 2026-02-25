import { useState } from 'react';
import { Search, Scale, ExternalLink, Loader2, BookOpen } from 'lucide-react';
import api from '../utils/api';

interface JurisResult {
    tribunal: string;
    titulo: string;
    ementa: string;
    relator: string;
    data: string;
    url: string;
    processo: string;
}

const JurisprudenciaPage = () => {
    const [query, setQuery] = useState('');
    const [tribunal, setTribunal] = useState('');
    const [results, setResults] = useState<JurisResult[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim() || query.trim().length < 3) return;

        setLoading(true);
        setSearched(true);
        try {
            const params: any = { q: query, per_page: 20 };
            if (tribunal) params.tribunal = tribunal;
            const resp = await api.get('/jurisprudencia/search', { params });
            setResults(resp.data.results || []);
            setTotal(resp.data.total || 0);
        } catch (err) {
            console.error('Erro ao buscar jurisprudência:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const tribunalColor = (t: string) => {
        switch (t) {
            case 'STF': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'STJ': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'TST': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            default: return 'text-gray-500 dark:text-zinc-400 bg-gray-200/50 dark:bg-zinc-400/10 border-gray-300 dark:border-zinc-400/20';
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-violet-500/10 p-3 rounded-xl">
                    <Scale className="w-7 h-7 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Busca Jurisprudencial</h1>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm">Pesquise decisões do STF e STJ</p>
                </div>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-8">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-gray-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ex: dano moral, legítima defesa, usucapião..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-colors"
                    />
                </div>
                <select
                    value={tribunal}
                    onChange={(e) => setTribunal(e.target.value)}
                    className="px-4 py-3 bg-white dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm appearance-none cursor-pointer min-w-[120px] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                    <option value="">Todos</option>
                    <option value="STF">STF</option>
                    <option value="STJ">STJ</option>
                </select>
                <button
                    type="submit"
                    disabled={loading || query.trim().length < 3}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Buscar
                </button>
            </form>

            {/* Results */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                    <p className="text-gray-500 dark:text-zinc-500 text-sm">Buscando nos tribunais...</p>
                </div>
            ) : searched && results.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-zinc-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma decisão encontrada para "{query}".</p>
                    <p className="text-xs mt-1">Tente termos mais específicos ou outro tribunal.</p>
                </div>
            ) : results.length > 0 ? (
                <>
                    <p className="text-sm text-gray-500 dark:text-zinc-500 mb-4">
                        {total > 0 ? `${total} resultado(s) encontrado(s)` : `${results.length} resultado(s)`}
                    </p>
                    <div className="space-y-4">
                        {results.map((r, i) => (
                            <div
                                key={i}
                                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md border ${tribunalColor(r.tribunal)}`}>
                                            {r.tribunal}
                                        </span>
                                        {r.processo && (
                                            <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono">{r.processo}</span>
                                        )}
                                        {r.data && (
                                            <span className="text-xs text-gray-500 dark:text-zinc-500">{r.data}</span>
                                        )}
                                    </div>
                                    {r.url && (
                                        <a
                                            href={r.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                                {r.titulo && (
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{r.titulo}</h3>
                                )}
                                {r.ementa && (
                                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed line-clamp-4">
                                        {r.ementa}
                                    </p>
                                )}
                                {r.relator && (
                                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">
                                        Relator: {r.relator}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            ) : !searched ? (
                <div className="text-center py-20 text-gray-500 dark:text-zinc-500">
                    <Scale className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Pesquise jurisprudência nos tribunais superiores</p>
                    <p className="text-xs mt-2">Digite um tema ou termo jurídico para buscar decisões relevantes</p>
                </div>
            ) : null}
        </div>
    );
};

export default JurisprudenciaPage;
