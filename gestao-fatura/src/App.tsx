import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout'; // Importe o novo Layout
import PainelPrincipal from './pages/PainelPrincipal';
import IntegradorPage from './pages/IntegradorPage';
import FaturasPage from './pages/FaturasPage';
import LancarLeituraPage from './pages/LancarLeituraPage';
import FaturaDetalhesPage from './pages/FaturaDetalhesPage';
import './App.css';

const basename = import.meta.env.PROD ? '/faturas' : '/';

function App() {
  return (
    <Router basename={basename}>
      <Routes>
        {/* A rota "pai" agora é o Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<PainelPrincipal />} />
          {/* As rotas "filhas" serão renderizadas dentro do <Outlet> do Layout */}
          <Route path="/integrador/:integradorId" element={<IntegradorPage />} />
          <Route path="/cliente/:clienteId/faturas" element={<FaturasPage />} />
          <Route path="/lancar-leitura" element={<LancarLeituraPage />} />
          <Route path="/fatura/:faturaId" element={<FaturaDetalhesPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;