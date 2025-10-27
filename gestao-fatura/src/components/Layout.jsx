import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import FaturaModal from './FaturaModal';
import ClienteModal from './ClienteModal';
import IntegradorModal from './IntegradorModal';
import InstalacaoModal from './InstalacaoModal';
import SelectionModal from './SelectionModal'; // Modal do fluxo de 3 etapas
import './Layout.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [integradores, setIntegradores] = useState([]);
  const [isFaturaModalOpen, setFaturaModalOpen] = useState(false);
  const [isClienteModalOpen, setClienteModalOpen] = useState(false);
  const [isIntegradorModalOpen, setIntegradorModalOpen] = useState(false);
  const [isSelectionModalOpen, setSelectionModalOpen] = useState(false); 
  const [preSelectedIds, setPreSelectedIds] = useState({});
  
  // <<< MUDANÇA AQUI: Estado para o modal de instalação >>>
  const [instalacaoModalProps, setInstalacaoModalProps] = useState(null); 

  const navigate = useNavigate();

  const handleInstalacaoSave = () => {
    setInstalacaoModalProps(null);
    navigate(0); 
  };

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

  // <<< NOVO: Função para abrir o modal de instalação >>>
  const openInstalacaoModal = useCallback((props = {}) => {
    // props pode ser { preSelectedIds: { integradorId: 123 } } ou { clienteId: 456 }
    setInstalacaoModalProps(props);
  }, []);

  const handleSelectionComplete = (selection) => {
    setSelectionModalOpen(false); 
    openFaturaModal(selection); 
  };

  const contextValue = useMemo(() => (
    // <<< MUDANÇA AQUI: Adiciona a nova função ao contexto >>>
    { openFaturaModal, openClienteModal, openInstalacaoModal }
  ), [openFaturaModal, openClienteModal, openInstalacaoModal]);

  return (
    <>
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
      
      {/* <<< MUDANÇA AQUI: Renderização do InstalacaoModal >>> */}
      <InstalacaoModal
        isOpen={!!instalacaoModalProps} 
        onClose={() => setInstalacaoModalProps(null)}
        onSave={handleInstalacaoSave}
        // Passa as props dinâmicas para o modal
        preSelectedIds={instalacaoModalProps?.preSelectedIds || {}}
        clienteId={instalacaoModalProps?.clienteId || null}
        integradorId={instalacaoModalProps?.integradorId || null}
        
      />

      <div className={`app-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar 
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
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