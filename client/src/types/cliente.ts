export type TipoPessoa = 'fisica' | 'juridica';

export interface Cliente {
    id: string;
    nome: string;
    tipo_pessoa: TipoPessoa;
    documento?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    observacoes?: string;
    workspace_id: string;
    created_at: string;
    updated_at: string;
}

export interface ClienteCreateRequest {
    nome: string;
    tipo_pessoa: TipoPessoa;
    documento?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    observacoes?: string;
}
