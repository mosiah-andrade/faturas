import React, { useState, useEffect } from 'react';
import './Modal.css'; //
import './Form.css';  //

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/faturas/api/';

const FaturaModal = ({ isOpen, onClose, onFaturaGerada, preSelectedIds = {}, integradores = [] }) => {
    // Estados de Seleção
    const [selectedIntegrador, setSelectedIntegrador] = useState('');
    const [selectedCliente, setSelectedCliente] = useState('');
    
    // Estados de Dados
    const [clientes, setClientes] = useState([]);
    const [instalacoes, setInstalacoes] = useState([]);
    
    // Estados de Controle
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [loadingInstalacoes, setLoadingInstalacoes] = useState(false);
    
    // Estados do Formulário
    const [selectedInstalacaoInfo, setSelectedInstalacaoInfo] = useState(null);
    const [formData, setFormData] = useState({});
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    const [enviando, setEnviando] = useState(false);

    // --- CONTROLE DE VISIBILIDADE (COMPACTAÇÃO) ---
    const showIntegradorSelect = !preSelectedIds.integradorId;
    const showClienteSelect = !preSelectedIds.clienteId;
    const showInstalacaoSelect = !preSelectedIds.instalacaoId;

    // --- 1. RESET INICIAL ---
    useEffect(() => {
        if (isOpen) {
            setMensagem({ texto: '', tipo: '' });
            setSelectedIntegrador(preSelectedIds.integradorId || '');
            setSelectedCliente(preSelectedIds.clienteId || '');
            
            setClientes([]);
            setInstalacoes([]);
            setSelectedInstalacaoInfo(null);
            resetForm(preSelectedIds);

            if (preSelectedIds.instalacaoId) {
                carregarDetalhesInstalacao(preSelectedIds.instalacaoId);
            }
        }
    }, [isOpen, preSelectedIds]);

    // --- 2. BUSCAR CLIENTES ---
    useEffect(() => {
        if (!selectedIntegrador) {
            setClientes([]);
            return;
        }
        const fetchClientes = async () => {
            setLoadingClientes(true);
            try {
                const response = await fetch(`${API_BASE_URL}get_clientes_por_integrador.php?integrador_id=${selectedIntegrador}`);
                const data = await response.json();
                setClientes(response.ok ? data : []);
            } catch (error) {
                console.error("Erro ao buscar clientes", error);
                setClientes([]);
            } finally {
                setLoadingClientes(false);
            }
        };
        fetchClientes();
    }, [selectedIntegrador]);

    // --- 3. BUSCAR INSTALAÇÕES ---
    useEffect(() => {
        if (!selectedCliente) {
            setInstalacoes([]);
            return;
        }

        const fetchInstalacoes = async () => {
            setLoadingInstalacoes(true);
            try {
                const response = await fetch(`${API_BASE_URL}get_instalacoes_por_cliente.php?cliente_id=${selectedCliente}`);
                const data = await response.json();
                const lista = response.ok ? data : [];
                setInstalacoes(lista);

                if (showInstalacaoSelect && preSelectedIds.clienteId && lista.length > 0) {
                     handleInstalacaoSelecionada(lista[0].id, lista);
                }

            } catch (error) {
                console.error("Erro ao buscar instalações", error);
                setInstalacoes([]);
            } finally {
                setLoadingInstalacoes(false);
            }
        };
        fetchInstalacoes();
    }, [selectedCliente, preSelectedIds.clienteId, showInstalacaoSelect]);

    // --- FUNÇÕES AUXILIARES ---
    const carregarDetalhesInstalacao = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}get_detalhes_instalacao.php?instalacao_id=${id}`);
            const data = await response.json();
            
            setSelectedIntegrador(data.integrador_id);
            if (data.cliente_id) setSelectedCliente(data.cliente_id);
            
            setSelectedInstalacaoInfo(data);
            setFormData(prev => ({ ...prev, instalacao_id: id }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleInstalacaoSelecionada = (idInstalacao, listaOrigem = instalacoes) => {
        const info = listaOrigem.find(i => String(i.id) === String(idInstalacao));
        if (info) {
            setSelectedInstalacaoInfo(info);
            setFormData(prev => ({ ...prev, instalacao_id: idInstalacao }));
        }
    };

    const resetForm = (ids = {}) => {
        setFormData({
            instalacao_id: ids.instalacaoId || '',
            valor_total: '', data_vencimento: '', mes_referencia: '',
            consumo_kwh: '', injecao_kwh: '', data_leitura: '',
            numero_dias: '', creditos: '', taxa_minima: '', percentual_desconto: ''
        });
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevState => ({ ...prevState, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setMensagem({ texto: '', tipo: '' });
        try {
            const response = await fetch(`${API_BASE_URL}gerar_fatura.php`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setMensagem({ texto: result.message, tipo: 'success' });
            setTimeout(() => { if (onFaturaGerada) onFaturaGerada(); onClose(); }, 2000);
        } catch (error) {
            setMensagem({ texto: error.message, tipo: 'error' });
        } finally {
            setEnviando(false);
        }
    };

    const getNomeIntegrador = () => integradores.find(i => String(i.id) === String(selectedIntegrador))?.nome_do_integrador || '...';
    const getNomeCliente = () => clientes.find(c => String(c.cliente_id || c.id) === String(selectedCliente))?.nome || '...';
    const getNomeUC = () => selectedInstalacaoInfo?.codigo_uc || '...';

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            {/* ADICIONADO: style={{ maxHeight: '90vh', overflowY: 'auto' }}
               Isso garante que o modal não ultrapasse 90% da altura da tela e crie scroll se necessário.
            */}
            <div 
                className="modal-content large" 
                onClick={e => e.stopPropagation()} 
                style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
                <span className="close-btn" onClick={onClose}>&times;</span>
                
                <h2>
                    {!showInstalacaoSelect ? `Lançar Fatura - UC: ${getNomeUC()}` : 'Nova Fatura Manual'}
                </h2>

                {/* Barra de Contexto Compacta */}
                {(!showIntegradorSelect || !showClienteSelect) && (
                    <div className="context-summary" style={{ 
                        background: '#f8f9fa', padding: '8px 12px', borderRadius: '4px', 
                        fontSize: '0.9rem', color: '#666', marginBottom: '15px', border: '1px solid #e9ecef' 
                    }}>
                        <span><strong>Integrador:</strong> {getNomeIntegrador()}</span>
                        {!showClienteSelect && <span style={{ margin: '0 8px' }}>&rsaquo;</span>}
                        {!showClienteSelect && <span><strong>Cliente:</strong> {getNomeCliente()}</span>}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    
                    {/* Área de Seleção */}
                    <div className="selection-area" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        
                        {showIntegradorSelect && (
                            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                                <label>Integrador</label>
                                <select 
                                    value={selectedIntegrador} 
                                    onChange={(e) => {
                                        setSelectedIntegrador(e.target.value);
                                        setSelectedCliente(''); setSelectedInstalacaoInfo(null);
                                    }} 
                                    required
                                >
                                    <option value="">-- Selecione --</option>
                                    {integradores.map(i => <option key={i.id} value={i.id}>{i.nome_do_integrador}</option>)}
                                </select>
                            </div>
                        )}

                        {showClienteSelect && selectedIntegrador && (
                            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                                <label>Cliente</label>
                                <select 
                                    value={selectedCliente} 
                                    onChange={(e) => {
                                        setSelectedCliente(e.target.value);
                                        setSelectedInstalacaoInfo(null);
                                    }}
                                    required
                                >
                                    <option value="">{loadingClientes ? 'Carregando...' : '-- Selecione --'}</option>
                                    {clientes.map(c => <option key={c.cliente_id || c.id} value={c.cliente_id || c.id}>{c.nome}</option>)}
                                </select>
                            </div>
                        )}

                        {showInstalacaoSelect && selectedCliente && (
                            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                                <label>Instalação</label>
                                <select 
                                    value={formData.instalacao_id || ''} 
                                    onChange={(e) => handleInstalacaoSelecionada(e.target.value)}
                                    required
                                >
                                    <option value="">{loadingInstalacoes ? 'Carregando...' : '-- Selecione --'}</option>
                                    {instalacoes.map(inst => (
                                        <option key={inst.id} value={inst.id}>
                                            {inst.nome ? `${inst.nome} - ` : ''}UC: {inst.codigo_uc}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {(showInstalacaoSelect || showClienteSelect) && <hr className="divider" />}

                    {/* Formulário Principal */}
                    {selectedInstalacaoInfo && (
                        <div className="fatura-form-body fade-in">
                            <div className="badge-tipo" style={{ marginBottom: '15px', background: '#e3f2fd', color: '#0d47a1', padding: '6px 10px', borderRadius: '4px', fontSize: '0.85rem', display: 'inline-block' }}>
                                Contrato: <strong>{selectedInstalacaoInfo.tipo_contrato}</strong> &bull; 
                                Tipo: <strong>{selectedInstalacaoInfo.tipo_instalacao}</strong>
                            </div>

                            <div className="form-group">
                                <label htmlFor="mes_referencia">Mês Referência</label>
                                <input type="month" id="mes_referencia" value={formData.mes_referencia || ''} onChange={handleChange} required />
                            </div>

                            {selectedInstalacaoInfo.tipo_contrato === 'Investimento' ? (
                                <fieldset className="form-section">
                                    <legend>Financeiro (Investimento)</legend>
                                    <div className="form-row">
                                        <div className="form-group"><label>Consumo (R$)</label><input type="number" step="0.01" id="consumo_kwh" value={formData.consumo_kwh || ''} onChange={handleChange} required /></div>
                                        <div className="form-group"><label>Taxa Mín. (R$)</label><input type="number" step="0.01" id="taxa_minima" value={formData.taxa_minima || ''} onChange={handleChange} placeholder="Ex: 30.00" /></div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label>Data Leitura</label><input type="date" id="data_leitura" value={formData.data_leitura || ''} onChange={handleChange} required /></div>
                                        <div className="form-group"><label>Nº Dias</label><input type="number" id="numero_dias" value={formData.numero_dias || ''} onChange={handleChange} required /></div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label>Vencimento</label><input type="date" id="data_vencimento" value={formData.data_vencimento || ''} onChange={handleChange} required /></div>
                                        <div className="form-group"><label>Desconto (%)</label><input type="number" id="percentual_desconto" value={formData.percentual_desconto || ''} onChange={handleChange} placeholder="Ex: 30" /></div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label>Créditos (kWh)</label><input type="number" step="0.01" id="creditos" value={formData.creditos || ''} onChange={handleChange} /></div>
                                        {selectedInstalacaoInfo.tipo_instalacao === 'Geradora' && (
                                            <div className="form-group"><label>Injeção (kWh)</label><input type="number" step="0.01" id="injecao_kwh" value={formData.injecao_kwh || ''} onChange={handleChange} /></div>
                                        )}
                                    </div>
                                </fieldset>
                            ) : (
                                <fieldset className="form-section">
                                    <legend>Monitoramento</legend>
                                    <div className="form-row">
                                        <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" id="valor_total" value={formData.valor_total || ''} onChange={handleChange} required /></div>
                                        <div className="form-group"><label>Vencimento</label><input type="date" id="data_vencimento" value={formData.data_vencimento || ''} onChange={handleChange} required /></div>
                                    </div>
                                    <div className="form-group">
                                        <label>Data Leitura</label><input type="date" id="data_leitura" value={formData.data_leitura || ''} onChange={handleChange} required />
                                    </div>
                                </fieldset>
                            )}

                            <button type="submit" className="btn-blue" disabled={enviando} style={{ marginTop: '10px' }}>
                                {enviando ? 'Processando...' : 'Confirmar Lançamento'}
                            </button>
                        </div>
                    )}

                    {mensagem.texto && <div className={`message ${mensagem.tipo}`} style={{ marginTop: '15px' }}>{mensagem.texto}</div>}
                </form>
            </div>
        </div>
    );
};

export default FaturaModal;