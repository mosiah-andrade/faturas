import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import FaturaModal from './FaturaModal';
import ClienteModal from './ClienteModal';
import IntegradorModal from './IntegradorModal';
import InstalacaoModal from './InstalacaoModal';
import SelectionModal from './SelectionModal'; // <<< NOVO: Importar o novo modal
import './Layout.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [integradores, setIntegradores] = useState([]);
  const [isFaturaModalOpen, setFaturaModalOpen] = useState(false);
  const [isClienteModalOpen, setClienteModalOpen] = useState(false);
  const [isIntegradorModalOpen, setIntegradorModalOpen] = useState(false);
  
  // <<< NOVO: Estado para o modal de seleção
  const [isSelectionModalOpen, setSelectionModalOpen] = useState(false); 
  
  const [preSelectedIds, setPreSelectedIds] = useState({});
  const [instalacaoModalProps, setInstalacaoModalProps] = useState(null); 

  const navigate = useNavigate();

  const handleInstalacaoSave = () => {
    setInstalacaoModalProps(null);
    navigate(0); 
  };

  const fetchIntegradores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/listar_integradores.php`);
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

  // <<< NOVO: Função chamada ao completar a seleção
  const handleSelectionComplete = (selection) => {
    // selection = { integradorId, clienteId, instalacaoId }
    setSelectionModalOpen(false); // Fecha o modal de seleção
    openFaturaModal(selection); // Abre o modal de fatura com os dados
  };

  const contextValue = useMemo(() => (
    { openFaturaModal, openClienteModal }
  ), [openFaturaModal, openClienteModal]);

  return (
    <>
      {/* <<< NOVO: Renderiza o modal de seleção >>> */}
      <SelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setSelectionModalOpen(false)}
        onComplete={handleSelectionComplete}
      />

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

      <div className={`app-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar 
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
          // <<< MUDANÇA: Altera a função chamada pelo botão
          onGerarFatura={() => setSelectionModalOpen(true)}
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