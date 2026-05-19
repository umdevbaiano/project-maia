import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// ── OAB Demo Mode: AI-Only Routes ──
import ChatPage from './pages/ChatPage';
import LandingPage from './pages/LandingPage';

// ── Full Platform Routes (preserved, disabled for OAB demo) ──
// import ProtectedRoute from './components/ProtectedRoute';
// import Layout from './components/Layout';
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import DashboardPage from './pages/DashboardPage';
// import CasosPage from './pages/CasosPage';
// import ClientesPage from './pages/ClientesPage';
// import DocumentosPage from './pages/DocumentosPage';
// import PrazosPage from './pages/PrazosPage';
// import PecasPage from './pages/PecasPage';
// import ActionCenterPage from './pages/ActionCenterPage';
// import ConfiguracoesPage from './pages/ConfiguracoesPage';
// import AuditPage from './pages/AuditPage';
// import JurisprudenciaPage from './pages/JurisprudenciaPage';
// import MarketplacePage from './pages/MarketplacePage';
// import EquipePage from './pages/EquipePage';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* ── OAB Demo Routes ── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage />} />

            {/* Redirect any unknown route to chat */}
            <Route path="*" element={<Navigate to="/chat" replace />} />

            {/* ── Full Platform Routes (preserved for post-OAB reactivation) ──
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
            */}
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
