import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import CasosPage from './pages/CasosPage';
import ClientesPage from './pages/ClientesPage';
import DocumentosPage from './pages/DocumentosPage';
import PrazosPage from './pages/PrazosPage';
import PecasPage from './pages/PecasPage';
import ActionCenterPage from './pages/ActionCenterPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import AuditPage from './pages/AuditPage';
import JurisprudenciaPage from './pages/JurisprudenciaPage';
import MarketplacePage from './pages/MarketplacePage';
import EquipePage from './pages/EquipePage';

import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';

const queryClient = new QueryClient();

const App: React.FC = () => {
  console.log('App Rendering - Path:', window.location.pathname);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="casos" element={<CasosPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="documentos" element={<DocumentosPage />} />
              <Route path="prazos" element={<PrazosPage />} />
              <Route path="pecas" element={<PecasPage />} />
              <Route path="action-center" element={<ActionCenterPage />} />
              <Route path="equipe" element={<EquipePage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
              <Route path="auditoria" element={<AuditPage />} />
              <Route path="jurisprudencia" element={<JurisprudenciaPage />} />
              <Route path="marketplace" element={<MarketplacePage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
