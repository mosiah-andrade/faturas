import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import FaturaModal from './FaturaModal';
import ClienteModal from './ClienteModal';
import IntegradorModal from './IntegradorModal';
import './Layout.css';

const API_BASE_URL = 'http://localhost/faturas/api/';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [integradores, setIntegradores] = useState([]);
  const [isFaturaModalOpen, setFaturaModalOpen] = useState(false);
  const [isClienteModalOpen, setClienteModalOpen] = useState(false);
  const [isIntegradorModalOpen, setIntegradorModalOpen] = useState(false);
  const [preSelectedIds, setPreSelectedIds] = useState({});

  const fetchIntegradores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}listar_integradores.php`);
      if (!response.ok) throw new Error("Falha ao buscar integradores");
      const data = await response.json();
      if (Array.isArray(data)) {
        setIntegradores(data);
      }
    } catch (error) {
      console.error(error);
      setIntegradores([]);
    }
  };

  useEffect(() => {
    fetchIntegradores();
  }, []);

  const handleCadastroIntegrador = () => {
    setIntegradorModalOpen(false);
    window.location.reload(); 
  };

  // "Memoriza" a função para que ela não seja recriada a cada renderização
  const openFaturaModal = useCallback((ids = {}) => {
    setPreSelectedIds(ids);
    setFaturaModalOpen(true);
  }, []);

  const closeFaturaModal = useCallback(() => {
    setFaturaModalOpen(false);
    setPreSelectedIds({});
  }, []);

  // "Memoriza" o objeto de contexto para evitar re-renderizações nas páginas filhas
  const contextValue = useMemo(() => ({ openFaturaModal }), [openFaturaModal]);

  return (
    <>
      <FaturaModal 
        isOpen={isFaturaModalOpen} 
        onClose={closeFaturaModal} 
        onFaturaGerada={fetchIntegradores}
        integradores={integradores}
        preSelectedIds={preSelectedIds}
      />
      <ClienteModal
        isOpen={isClienteModalOpen}
        onClose={() => setClienteModalOpen(false)}
        integradores={integradores}
      />
      <IntegradorModal
        isOpen={isIntegradorModalOpen}
        onClose={() => setIntegradorModalOpen(false)}
        onCadastroSucesso={handleCadastroIntegrador}
      />

      <div className={`app-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar 
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
          onGerarFatura={openFaturaModal}
          onCadastrarCliente={() => setClienteModalOpen(true)}
          onCadastrarIntegrador={() => setIntegradorModalOpen(true)}
        />
        <main className="app-content">
          <Outlet context={contextValue} />
        </main>
      </div>
    </>
  );
};

export default Layout;