import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import ConfiguracoesPage from './pages/ConfiguracoesPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
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
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
