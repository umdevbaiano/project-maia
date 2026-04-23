export interface Peca {
    id: string;
    tipo: string;
    tipo_label: string;
    titulo: string;
    conteudo: string;
    caso_id?: string;
    caso_titulo?: string;
    cliente_id?: string;
    cliente_nome?: string;
    signature_status: 'unsigned' | 'pending' | 'signed' | string;
    signature_id?: string;
    signature_url?: string;
    workspace_id: string;
    created_at: string;
}

export interface PecaGenerateRequest {
    tipo: string;
    caso_id?: string;
    instrucoes: string;
}

export const TIPO_PECA_OPTIONS = [
    { value: 'peticao_inicial', label: 'Petição Inicial' },
    { value: 'contestacao', label: 'Contestação' },
    { value: 'recurso_apelacao', label: 'Recurso de Apelação' },
    { value: 'agravo_instrumento', label: 'Agravo de Instrumento' },
    { value: 'peticao_simples', label: 'Petição Simples' },
    { value: 'parecer', label: 'Parecer Jurídico' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'procuracao', label: 'Procuração' },
    { value: 'declaracao_hipossuficiencia', label: 'Declaração de Hipossuficiência' },
];
