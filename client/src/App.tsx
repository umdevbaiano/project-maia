import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import ClientesPage from './pages/ClientesPage';
import DocumentosPage from './pages/DocumentosPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="documentos" element={<DocumentosPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
