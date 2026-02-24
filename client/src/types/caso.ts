export type CasoStatus = 'ativo' | 'em_andamento' | 'suspenso' | 'arquivado' | 'encerrado';
export type CasoTipo = 'civel' | 'trabalhista' | 'criminal' | 'tributario' | 'administrativo' | 'previdenciario' | 'outro';

export interface Caso {
    id: string;
    numero: string;
    titulo: string;
    tipo: CasoTipo;
    status: CasoStatus;
    cliente_id?: string;
    cliente_nome?: string;
    responsavel_id?: string;
    tribunal?: string;
    vara?: string;
    descricao?: string;
    workspace_id: string;
    created_at: string;
    updated_at: string;
}

export interface CasoCreateRequest {
    numero: string;
    titulo: string;
    tipo: CasoTipo;
    status: CasoStatus;
    cliente_id?: string;
    tribunal?: string;
    vara?: string;
    descricao?: string;
}

export const STATUS_LABELS: Record<CasoStatus, string> = {
    ativo: 'Ativo',
    em_andamento: 'Em Andamento',
    suspenso: 'Suspenso',
    arquivado: 'Arquivado',
    encerrado: 'Encerrado',
};

export const TIPO_LABELS: Record<CasoTipo, string> = {
    civel: 'Cível',
    trabalhista: 'Trabalhista',
    criminal: 'Criminal',
    tributario: 'Tributário',
    administrativo: 'Administrativo',
    previdenciario: 'Previdenciário',
    outro: 'Outro',
};

export const STATUS_COLORS: Record<CasoStatus, string> = {
    ativo: 'bg-green-500/10 text-green-400 border-green-500/20',
    em_andamento: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    suspenso: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    arquivado: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    encerrado: 'bg-red-500/10 text-red-400 border-red-500/20',
};
