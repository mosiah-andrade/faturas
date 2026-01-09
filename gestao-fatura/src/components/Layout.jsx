import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import FaturaModal from './FaturaModal';
import ClienteModal from './ClienteModal';
import IntegradorModal from './IntegradorModal';
import InstalacaoModal from '../components/InstalacaoModal';
import './Layout.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/faturas/api/';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [integradores, setIntegradores] = useState([]);
  const [isFaturaModalOpen, setFaturaModalOpen] = useState(false);
  const [isClienteModalOpen, setClienteModalOpen] = useState(false);
  const [isIntegradorModalOpen, setIntegradorModalOpen] = useState(false);
  const [preSelectedIds, setPreSelectedIds] = useState({});
  const [isInstalacaoModalOpen, setIsInstalacaoModalOpen] = useState(false);
  const [instalacaoClienteId, setInstalacaoClienteId] = useState(null);

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
    fetchIntegradores();
  };

  const openFaturaModal = useCallback((ids = {}) => {
    setPreSelectedIds(ids);
    setFaturaModalOpen(true);
  }, []);

  const closeFaturaModal = useCallback(() => {
    setFaturaModalOpen(false);
    setPreSelectedIds({});
  }, []);
  
  const openClienteModal = useCallback((ids = {}) => {
    setPreSelectedIds(ids);
    setClienteModalOpen(true);
  }, []);

  const closeClienteModal = useCallback(() => {
    setClienteModalOpen(false);
    setPreSelectedIds({});
  }, []);

  const openInstalacaoModal = useCallback(({ clienteId }) => {
    setInstalacaoClienteId(clienteId);
    setIsInstalacaoModalOpen(true);
  }, []);

  const closeInstalacaoModal = useCallback(() => {
    setIsInstalacaoModalOpen(false);
    setInstalacaoClienteId(null);
  }, []);

  const contextValue = useMemo(() => ({ openFaturaModal, openClienteModal, openInstalacaoModal }), [openFaturaModal, openClienteModal, openInstalacaoModal]);

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
        onClose={closeClienteModal}
        integradores={integradores}
        preSelectedIds={preSelectedIds}
      />
      <IntegradorModal
        isOpen={isIntegradorModalOpen}
        onClose={() => setIntegradorModalOpen(false)}
        onCadastroSucesso={handleCadastroIntegrador}
      />
      <InstalacaoModal
        isOpen={isInstalacaoModalOpen}
        onClose={closeInstalacaoModal}
        clienteId={instalacaoClienteId}
      />

      <div className={`app-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar 
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
          onGerarFatura={openFaturaModal}
          onCadastrarCliente={openClienteModal}
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