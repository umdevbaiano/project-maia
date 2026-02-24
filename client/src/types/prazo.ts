export type PrazoStatus = 'pendente' | 'cumprido' | 'expirado';
export type PrazoPrioridade = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Prazo {
    id: string;
    titulo: string;
    descricao?: string;
    data_limite: string;
    caso_id?: string;
    caso_titulo?: string;
    prioridade: PrazoPrioridade;
    status: PrazoStatus;
    workspace_id: string;
    created_at: string;
    updated_at: string;
}

export interface PrazoCreateRequest {
    titulo: string;
    descricao?: string;
    data_limite: string;
    caso_id?: string;
    prioridade: PrazoPrioridade;
    status?: PrazoStatus;
}

export const STATUS_LABELS: Record<PrazoStatus, string> = {
    pendente: 'Pendente',
    cumprido: 'Cumprido',
    expirado: 'Expirado',
};

export const PRIORIDADE_LABELS: Record<PrazoPrioridade, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    urgente: 'Urgente',
};

export const PRIORIDADE_COLORS: Record<PrazoPrioridade, string> = {
    baixa: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    media: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    alta: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    urgente: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const STATUS_COLORS: Record<PrazoStatus, string> = {
    pendente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    cumprido: 'bg-green-500/10 text-green-400 border-green-500/20',
    expirado: 'bg-red-500/10 text-red-400 border-red-500/20',
};
