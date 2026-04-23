import React, { useState } from 'react';
import { UserPlus, Mail, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

interface UserMember {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
}

const EquipePage: React.FC = () => {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState('associado');
    const [isInviting, setIsInviting] = useState(false);
    const queryClient = useQueryClient();

    const { data: members, isLoading } = useQuery<UserMember[]>({
        queryKey: ['workspace-members'],
        queryFn: async () => {
            const response = await api.get('/auth/workspace/members');
            return response.data;
        }
    });

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsInviting(true);
            await api.post('/auth/invite', {
                email: inviteEmail,
                name: inviteName,
                role: inviteRole
            });
            setIsInviteModalOpen(false);
            setInviteEmail('');
            setInviteName('');
            queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
            alert('Convite enviado com sucesso!');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Erro ao convidar usuário');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRevoke = async (userId: string) => {
        if (!window.confirm('Tem certeza que deseja revogar o acesso deste usuário?')) return;
        try {
            await api.post(`/auth/users/${userId}/revoke`);
            queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Erro ao revogar acesso');
        }
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, any> = {
            admin: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Admin' },
            socio: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Sócio' },
            associado: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', label: 'Associado' },
            estagiario: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', label: 'Estagiário' },
        };
        const style = styles[role] || styles.associado;
        return (
            <span style={{ 
                background: style.bg, 
                color: style.color, 
                padding: '4px 10px', 
                borderRadius: '20px', 
                fontSize: '0.75rem', 
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                {style.label}
            </span>
        );
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Gestão de Equipe</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>Gerencie quem tem acesso ao seu escritório Maia.</p>
                </div>
                <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    style={{
                        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                        border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem',
                        color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                        cursor: 'pointer', boxShadow: '0 4px 15px rgba(37,99,235,0.3)'
                    }}
                >
                    <UserPlus size={18} /> Novo Membro
                </button>
            </div>

            <div style={{ 
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '24px', overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                            <th style={{ padding: '1.2rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Membro</th>
                            <th style={{ padding: '1.2rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>E-mail</th>
                            <th style={{ padding: '1.2rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Nível</th>
                            <th style={{ padding: '1.2rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Status</th>
                            <th style={{ padding: '1.2rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                                    <Loader2 className="spin" size={32} color="#2563eb" />
                                </td>
                            </tr>
                        ) : members?.map(member => (
                            <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '1.2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <div style={{ 
                                            width: '36px', height: '36px', borderRadius: '12px', 
                                            background: 'rgba(59,130,246,0.1)', display: 'flex', 
                                            alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 800
                                        }}>
                                            {member.name.charAt(0)}
                                        </div>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>{member.name}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1.2rem', color: 'rgba(255,255,255,0.6)' }}>{member.email}</td>
                                <td style={{ padding: '1.2rem' }}>{getRoleBadge(member.role)}</td>
                                <td style={{ padding: '1.2rem' }}>
                                    {member.is_active ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#22c55e', fontSize: '0.85rem' }}>
                                            <CheckCircle size={14} /> Ativo
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                                            <XCircle size={14} /> Inativo
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                                    {member.role !== 'admin' && member.is_active && (
                                        <button 
                                            onClick={() => handleRevoke(member.id)}
                                            style={{ 
                                                background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', 
                                                cursor: 'pointer', padding: '0.5rem', borderRadius: '8px',
                                                transition: 'color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239,68,68,0.5)'}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {isInviteModalOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100 }}
                            onClick={() => setIsInviteModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{ 
                                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: '100%', maxWidth: '450px', background: '#09090b', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '32px', padding: '2.5rem', zIndex: 101, boxShadow: '0 32px 64px rgba(0,0,0,0.5)'
                            }}
                        >
                            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Novo Membro</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                Envie um convite por e-mail para um novo colega.
                            </p>

                            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>Nome Completo</label>
                                    <input 
                                        type="text" required value={inviteName} onChange={e => setInviteName(e.target.value)}
                                        style={{ 
                                            width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px', padding: '0.8rem 1rem', color: '#fff', outline: 'none'
                                        }}
                                        placeholder="Ex: Dr. Ricardo Silva"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>E-mail corporativo</label>
                                    <input 
                                        type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                        style={{ 
                                            width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px', padding: '0.8rem 1rem', color: '#fff', outline: 'none'
                                        }}
                                        placeholder="ricardo@escritorio.com"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>Nível de Permissão</label>
                                    <select 
                                        value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                                        style={{ 
                                            width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px', padding: '0.8rem 1rem', color: '#fff', outline: 'none'
                                        }}
                                    >
                                        <option value="socio">Sócio</option>
                                        <option value="associado">Associado</option>
                                        <option value="estagiario">Estagiário</option>
                                    </select>
                                </div>

                                <button 
                                    type="submit" disabled={isInviting}
                                    style={{
                                        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                                        border: 'none', borderRadius: '12px', padding: '1rem',
                                        color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: '1rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {isInviting ? <Loader2 size={18} className="spin" /> : <Mail size={18} />}
                                    Enviar Convite
                                </button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EquipePage;
