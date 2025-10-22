import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PainelPrincipal from './pages/PainelPrincipal';
import IntegradorPage from './pages/IntegradorPage';
import FaturasPage from './pages/FaturasPage';
import FaturaDetalhesPage from './pages/FaturaDetalhesPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './auth/ProtectedRoute';
// IMPORTE A NOVA PÁGINA
import ClienteInstalacoesPage from './pages/ClienteInstalacoesPage'; 
import './App.css';


function App() {
  return (
    <Router >
      <Routes>
        {/* Rota pública de login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<PainelPrincipal />} />
            <Route path="/integrador/:integradorId" element={<IntegradorPage />} />
            <Route path="/cliente/:clienteId" element={<ClienteInstalacoesPage />} />
            <Route path="/cliente/:clienteId/faturas" element={<FaturasPage />} />
            <Route path="/fatura/:faturaId" element={<FaturaDetalhesPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;