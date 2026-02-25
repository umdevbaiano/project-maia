export interface Documento {
    id: string;
    filename: string;
    file_type: string;
    size_bytes: number;
    chunk_count: number;
    uploaded_by: string;
    cliente_id?: string;
    caso_id?: string;
    created_at: string;
}
