import React, { useState, useEffect } from 'react';
import './Modal.css';
import './Form.css';

// Estilo simples para os botões de navegação (opcional, pode adicionar ao Modal.css ou Form.css)
const navButtonStyle = {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: '20px'
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SelectionModal = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Listas para os dropdowns
    const [integradores, setIntegradores] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [instalacoes, setInstalacoes] = useState([]);

    // IDs selecionados
    const [selectedIntegrador, setSelectedIntegrador] = useState('');
    const [selectedCliente, setSelectedCliente] = useState('');
    const [selectedInstalacao, setSelectedInstalacao] = useState('');

    // Efeito para buscar integradores quando o modal abre
    useEffect(() => {
        if (isOpen) {
            // Reseta o estado ao abrir
            setStep(1);
            setClientes([]);
            setInstalacoes([]);
            setSelectedIntegrador('');
            setSelectedCliente('');
            setSelectedInstalacao('');
            
            const fetchIntegradores = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`${API_BASE_URL}/listar_integradores.php`);
                    const data = await response.json();
                    setIntegradores(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error("Erro ao buscar integradores:", error);
                    setIntegradores([]);
                }
                setLoading(false);
            };
            fetchIntegradores();
        }
    }, [isOpen]);

    // Limpa o estado interno ao fechar
    const handleClose = () => {
        onClose();
    };

    // ETAPA 1 -> 2: Chamado ao selecionar Integrador
    const handleIntegradorSelect = async (e) => {
        const integradorId = e.target.value;
        if (!integradorId) return;
        
        setSelectedIntegrador(integradorId);
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/get_clientes_por_integrador.php?integrador_id=${integradorId}`);
            const data = await response.json();
            
            // <<< CORREÇÃO AQUI >>>
            // A API retorna um array direto de clientes, não um objeto.
            setClientes(Array.isArray(data) ? data : []);
            
            setStep(2);
        } catch (error) {
            console.error("Erro ao buscar clientes:", error);
            setClientes([]);
        }
        setLoading(false);
    };

    // ETAPA 2 -> 3: Chamado ao selecionar Cliente
    const handleClienteSelect = async (e) => {
        const clienteId = e.target.value;
        if (!clienteId) return;

        setSelectedCliente(clienteId);
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/get_instalacoes_por_cliente.php?cliente_id=${clienteId}`);
            const data = await response.json();
            setInstalacoes(Array.isArray(data.instalacoes) ? data.instalacoes : []);
            setStep(3);
        } catch (error) {
            console.error("Erro ao buscar instalações:", error);
            setInstalacoes([]);
        }
        setLoading(false);
    };
    
    // ETAPA 3 -> FIM: Chamado ao selecionar Instalação
    const handleInstalacaoSelect = (e) => {
        const instalacaoId = e.target.value;
        if (!instalacaoId) return;

        setSelectedInstalacao(instalacaoId);
        
        // Finaliza
        onComplete({
            integradorId: selectedIntegrador,
            clienteId: selectedCliente,
            instalacaoId: instalacaoId
        });
        handleClose();
    };

    // <<< NOVO: Função para voltar etapas
    const handleBack = () => {
        setStep(prevStep => {
            const newStep = prevStep - 1;
            
            if (newStep === 1) {
                // Voltando para a seleção de Integrador
                setSelectedCliente('');
                setClientes([]);
                setSelectedInstalacao('');
                setInstalacoes([]);
            }
            if (newStep === 2) {
                // Voltando para a seleção de Cliente
                setSelectedInstalacao('');
                setInstalacoes([]);
            }
            
            return newStep;
        });
    };


    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <span className="close-btn" onClick={handleClose}>&times;</span>
                <h2>Gerar Nova Fatura</h2>
                
                {/* ETAPA 1: SELECIONAR INTEGRADOR */}
                {step === 1 && (
                    <div className="form-group">
                        <label htmlFor="integrador-select">1. Selecione o Integrador:</label>
                        <select id="integrador-select" value={selectedIntegrador} onChange={handleIntegradorSelect} disabled={loading}>
                            <option value="">{loading ? "Carregando..." : "-- Selecione --"}</option>
                            {integradores.map(integrador => (
                                <option key={integrador.id} value={integrador.id}>{integrador.nome_do_integrador}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* ETAPA 2: SELECIONAR CLIENTE */}
                {step === 2 && (
                    <div className="form-group">
                        <label htmlFor="cliente-select">2. Selecione o Cliente:</label>
                        <select id="cliente-select" value={selectedCliente} onChange={handleClienteSelect} disabled={loading}>
                            <option value="">{loading ? "Carregando..." : "-- Selecione --"}</option>
                            {/* <<< CORREÇÃO AQUI (key, value, nome) >>> */}
                            {clientes.length > 0 ? clientes.map(cli => (
                                <option key={cli.cliente_id} value={cli.cliente_id}>
                                    {cli.nome} (Instalações: {cli.total_instalacoes})
                                </option>
                            )) : <option value="">Nenhum cliente encontrado</option>}
                        </select>
                    </div>
                )}

                {/* ETAPA 3: SELECIONAR INSTALAÇÃO */}
                {step === 3 && (
                    <div className="form-group">
                        <label htmlFor="instalacao-select">3. Selecione a Instalação:</label>
                        <select id="instalacao-select" value={selectedInstalacao} onChange={handleInstalacaoSelect} disabled={loading}>
                            <option value="">{loading ? "Carregando..." : "-- Selecione --"}</option>
                            {instalacoes.length > 0 ? instalacoes.map(inst => (
                                <option key={inst.id} value={inst.id}>
                                    {inst.codigo_uc} - {inst.endereco_instalacao}
                                </option>
                            )) : <option value="">Nenhuma instalação encontrada</option>}
                        </select>
                    </div>
                )}

                {/* <<< NOVO: Botão Voltar >>> */}
                {step > 1 && (
                    <div style={navButtonStyle}>
                        <button type="button" onClick={handleBack} className="btn-secondary">
                            Voltar
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SelectionModal;