import React, { useState } from 'react';
import { X, Plus, Trash2, Mail, User, Loader2, Send } from 'lucide-react';
import api from '../utils/api';
import { Peca } from '../types/peca';

interface Signer {
    name: string;
    email: string;
}

interface SignatureModalProps {
    peca: Peca;
    onClose: () => void;
    onSuccess: (updatedPeca: Peca) => void;
}

export default function SignatureModal({ peca, onClose, onSuccess }: SignatureModalProps) {
    const [signers, setSigners] = useState<Signer[]>([{ name: '', email: '' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addSigner = () => setSigners([...signers, { name: '', email: '' }]);

    const removeSigner = (index: number) => {
        if (signers.length > 1) {
            setSigners(signers.filter((_, i) => i !== index));
        }
    };

    const updateSigner = (index: number, field: keyof Signer, value: string) => {
        const newSigners = [...signers];
        newSigners[index][field] = value;
        setSigners(newSigners);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        const invalid = signers.some(s => s.name.trim().length < 2 || !s.email.includes('@'));
        if (invalid) {
            setError('Preencha corretamente o nome e e-mail de todos os assinantes.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post(`/pecas/${peca.id}/request-signature`, { signers });
            onSuccess(response.data);
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Erro ao enviar para assinatura.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
        }}>
            <div style={{
                background: '#1e1e3a', borderRadius: '16px', width: '100%', maxWidth: '500px',
                border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{
                    padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>Solicitar Assinatura</h3>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer', display: 'flex'
                    }}><X size={20} /></button>
                </div>

                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                        Você está enviando o documento <strong>{peca.titulo}</strong> para assinatura digital. Informe e-mails e nomes completos.
                    </p>

                    {error && (
                        <div style={{
                            padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '0.85rem',
                            marginBottom: '1rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <form id="signature-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {signers.map((signer, i) => (
                            <div key={i} style={{
                                background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.05)', position: 'relative'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa' }}>Assinante {i + 1}</span>
                                    {signers.length > 1 && (
                                        <button type="button" onClick={() => removeSigner(i)} style={{
                                            background: 'none', border: 'none', color: '#ef4444',
                                            cursor: 'pointer', padding: 0, opacity: 0.8
                                        }}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem' }}>Nome Completo</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                            <input
                                                type="text"
                                                required
                                                value={signer.name}
                                                onChange={e => updateSigner(i, 'name', e.target.value)}
                                                style={{
                                                    width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '8px',
                                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                    color: '#fff', fontSize: '0.85rem', outline: 'none'
                                                }}
                                                placeholder="João da Silva"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem' }}>E-mail</label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                            <input
                                                type="email"
                                                required
                                                value={signer.email}
                                                onChange={e => updateSigner(i, 'email', e.target.value)}
                                                style={{
                                                    width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '8px',
                                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                    color: '#fff', fontSize: '0.85rem', outline: 'none'
                                                }}
                                                placeholder="joao@email.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={addSigner} style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)',
                            borderRadius: '10px', padding: '0.75rem', color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem'
                        }}>
                            <Plus size={16} /> Adicionar outro assinante
                        </button>
                    </form>
                </div>

                <div style={{
                    padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'rgba(0,0,0,0.2)'
                }}>
                    <button type="button" onClick={onClose} style={{
                        background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                        padding: '0.6rem 1.25rem', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500
                    }}>
                        Cancelar
                    </button>
                    <button type="submit" form="signature-form" disabled={loading} style={{
                        background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', border: 'none', borderRadius: '8px',
                        padding: '0.6rem 1.25rem', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                        Enviar para Assinatura
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
