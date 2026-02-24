import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-950">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-950">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
                    <p className="text-zinc-400">Você não tem permissão para acessar esta página.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
