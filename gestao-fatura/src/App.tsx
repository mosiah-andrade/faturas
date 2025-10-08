import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PainelPrincipal from './pages/PainelPrincipal'
import IntegradorPage from './pages/IntegradorPage';
import FaturasPage from './pages/FaturasPage';
import LancarLeituraPage from './pages/LancarLeituraPage';
import './App.css'; // Um bom lugar para estilos globais

const basename = import.meta.env.PROD ? '/faturas' : '/';

function App() {
  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<PainelPrincipal />} />
        <Route path="/integrador/:integradorId" element={<IntegradorPage />} />
        <Route path="/cliente/:clienteId/faturas" element={<FaturasPage />} />
        <Route path="/lancar-leitura" element={<LancarLeituraPage />} />
      </Routes>
    </Router>
  );
}

export default App;