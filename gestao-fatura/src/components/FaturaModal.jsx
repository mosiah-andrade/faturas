import React, { useState, useEffect } from 'react';
import './Modal.css';
import './Form.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FaturaModal = ({ isOpen, onClose, onFaturaGerada, preSelectedIds = {}, integradores = [] }) => {
    const [selectedIntegrador, setSelectedIntegrador] = useState('');
    const [instalacoes, setInstalacoes] = useState([]);
    const [loadingInstalacoes, setLoadingInstalacoes] = useState(false);
    const [selectedInstalacaoInfo, setSelectedInstalacaoInfo] = useState(null);
    const [formData, setFormData] = useState({});
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    const [enviando, setEnviando] = useState(false);

    // Efeito para buscar instalações
    useEffect(() => {
        const fetchInstalacoes = async (url) => {
            setLoadingInstalacoes(true);
            setInstalacoes([]);
            try {
                const response = await fetch(url);
                const data = await response.json();
                setInstalacoes(response.ok ? data.instalacoes : []);
            } catch (error) {
                setInstalacoes([]);
            } finally {
                setLoadingInstalacoes(false);
            }
        };
        const targetIntegrador = preSelectedIds.integradorId || selectedIntegrador;
        
        // <<< MUDANÇA: Prioriza o ID do cliente vindo do Wizard
        if (isOpen && preSelectedIds.clienteId) {
            fetchInstalacoes(`${API_BASE_URL}get_instalacoes_por_cliente.php?cliente_id=${preSelectedIds.clienteId}`);
        } else if (isOpen && targetIntegrador) {
            fetchInstalacoes(`${API_BASE_URL}get_clientes_por_integrador.php?integrador_id=${targetIntegrador}`);
        } else {
            setInstalacoes([]);
        }
    }, [isOpen, preSelectedIds.clienteId, preSelectedIds.integradorId, selectedIntegrador]);

    // Efeito para resetar o formulário
    useEffect(() => {
        if (isOpen) {
            setMensagem({ texto: '', tipo: '' });
            setSelectedIntegrador(preSelectedIds.integradorId || '');
            setSelectedInstalacaoInfo(null);
            setInstalacoes([]); // Limpa instalações ao abrir
            resetForm(preSelectedIds);
        }
    }, [isOpen, preSelectedIds]);

    // <<< NOVO: Efeito para auto-selecionar a instalação se vier do Wizard
    useEffect(() => {
        if (preSelectedIds.instalacaoId && instalacoes.length > 0) {
            const info = instalacoes.find(inst => String(inst.id) === String(preSelectedIds.instalacaoId));
            setSelectedInstalacaoInfo(info);
            // Garante que o ID da instalação está no form
            setFormData(prev => ({ ...prev, instalacao_id: preSelectedIds.instalacaoId }));
        }
    }, [preSelectedIds.instalacaoId, instalacoes]);


    const resetForm = (ids = {}) => {
        setFormData({
            instalacao_id: ids.instalacaoId || '',
            valor_total: '',
            data_vencimento: '',
            mes_referencia: '',
            consumo_kwh: '',
            injecao_kwh: '',
            data_leitura: '',
            numero_dias: '',
            creditos: '',
            taxa_minima: '',
            percentual_desconto: ''
        });
    };

    // Esta função ainda é útil caso o usuário venha de outro fluxo
    const handleInstalacaoChange = (e) => {
        const instalacaoId = e.target.value;
        resetForm({ ...preSelectedIds, instalacaoId });
        setFormData(prev => ({ ...prev, instalacao_id: instalacaoId }));
        const info = instalacoes.find(inst => String(inst.id) === String(instalacaoId));
        setSelectedInstalacaoInfo(info);
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevState => ({ ...prevState, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setMensagem({ texto: '', tipo: '' });

        // --- LÓGICA DE LOG NO CONSOLE (CORRIGIDA) ---
        console.clear();
        console.log("%c--- INÍCIO DO CÁLCULO DA FATURA (FRONTEND) ---", "color: blue; font-weight: bold;");

        const consumoEmReais = parseFloat(formData.consumo_kwh || 0);
        const taxaMinima = parseFloat(formData.taxa_minima || 0);
        const percentualDesconto = parseInt(formData.percentual_desconto || 0);

        if (selectedInstalacaoInfo.tipo_contrato === 'Investimento') {
            console.log("Tipo de Contrato: Investimento");
            console.log(`Regra de Faturamento: ${selectedInstalacaoInfo.regra_faturamento}`);
            
            let subtotal, valorDesconto, valorFinal;

            if (selectedInstalacaoInfo.regra_faturamento === 'Antes da Taxação') {
                console.log("Cálculo ANTES da Taxação:");
                console.log("1. Subtotal = Consumo (R$) + Taxa Mínima");
                subtotal = consumoEmReais + taxaMinima;
                console.log(`   ${consumoEmReais.toFixed(2)} + ${taxaMinima.toFixed(2)} = ${subtotal.toFixed(2)}`);

                console.log("2. Valor do Desconto = Subtotal * (Percentual / 100)");
                valorDesconto = subtotal * (percentualDesconto / 100);
                console.log(`   ${subtotal.toFixed(2)} * (${percentualDesconto} / 100) = ${valorDesconto.toFixed(2)}`);
                
                console.log("3. Valor Final = Subtotal - Valor do Desconto");
                valorFinal = subtotal - valorDesconto;
                console.log(`   ${subtotal.toFixed(2)} - ${valorDesconto.toFixed(2)} = ${valorFinal.toFixed(2)}`);
            } else { // Depois da Taxação
                console.log("Cálculo DEPOIS da Taxação:");
                subtotal = consumoEmReais;
                console.log("1. Valor do Desconto = Consumo (R$) * (Percentual / 100)");
                valorDesconto = consumoEmReais * (percentualDesconto / 100);
                console.log(`   ${consumoEmReais.toFixed(2)} * (${percentualDesconto} / 100) = ${valorDesconto.toFixed(2)}`);

                console.log("2. Valor Final = (Consumo (R$) - Valor do Desconto) + Taxa Mínima");
                valorFinal = (consumoEmReais - valorDesconto) + taxaMinima;
                console.log(`   (${consumoEmReais.toFixed(2)} - ${valorDesconto.toFixed(2)}) + ${taxaMinima.toFixed(2)} = ${valorFinal.toFixed(2)}`);
            }
            console.log(`%cVALOR FINAL CALCULADO: R$ ${valorFinal.toFixed(2)}`, "color: green; font-weight: bold;");

        } else {
            console.log("Tipo de Contrato: Monitoramento");
            const valorFinal = parseFloat(formData.valor_total || 0);
            console.log(`VALOR FINAL (Informado Manualmente): R$ ${valorFinal.toFixed(2)}`);
        }
        console.log("%c--- FIM DO CÁLCULO (FRONTEND) ---", "color: blue; font-weight: bold;");
        // --- FIM DA LÓGICA DE LOG ---

        try {
            const response = await fetch(`${API_BASE_URL}gerar_fatura.php`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setMensagem({ texto: result.message, tipo: 'success' });
            setTimeout(() => {
                if (onFaturaGerada) onFaturaGerada();
                onClose();
            }, 2000);
        } catch (error) {
            setMensagem({ texto: error.message, tipo: 'error' });
        } finally {
            setEnviando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content large">
                <span className="close-btn" onClick={onClose}>&times;</span>
                <h2>Lançar Nova Fatura</h2>
                <form onSubmit={handleSubmit}>
                    
                    {/* <<< MUDANÇA: Oculta se já veio do wizard >>> */}
                    {!preSelectedIds.clienteId && !preSelectedIds.integradorId && (
                        <div className="form-group">
                            <label htmlFor="integrador-select">1. Selecione o Integrador:</label>
                            <select id="integrador-select" value={selectedIntegrador} onChange={(e) => setSelectedIntegrador(e.target.value)} required>
                                <option value="">-- Selecione --</option>
                                {integradores.map(integrador => (
                                    <option key={integrador.id} value={integrador.id}>{integrador.nome_do_integrador}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* <<< MUDANÇA: Oculta se já veio do wizard (instalacaoId está presente) >>> */}
                    {(!preSelectedIds.instalacaoId && (selectedIntegrador || preSelectedIds.integradorId || preSelectedIds.clienteId)) && (
                        <div className="form-group">
                            <label htmlFor="instalacao_id_select">2. Selecione a Instalação:</label>
                            <select id="instalacao_id_select" value={formData.instalacao_id} onChange={handleInstalacaoChange} required disabled={loadingInstalacoes}>
                                <option value="">{loadingInstalacoes ? "Carregando..." : "-- Selecione --"}</option>
                                {Array.isArray(instalacoes) && instalacoes.map(inst => (
                                    <option key={inst.id} value={inst.id}>
                                        {inst.codigo_uc} - {inst.endereco_instalacao}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Se a instalação foi selecionada (pelo wizard ou manualmente), mostra o formulário */}
                    {selectedInstalacaoInfo && (
                        <>
                            <div className="form-group">
                                <label htmlFor="mes_referencia">Mês de Referência:</label>
                                <input type="month" id="mes_referencia" value={formData.mes_referencia || ''} onChange={handleChange} required />
                            </div>

                            {selectedInstalacaoInfo.tipo_contrato === 'Investimento' ? (
                                <fieldset className="form-section">
                                    <legend>Dados de Investimento</legend>
                                    <div className="form-row">
                                        <div className="form-group"><label htmlFor="consumo_kwh">Consumo (R$):</label><input type="number" step="0.01" id="consumo_kwh" value={formData.consumo_kwh || ''} onChange={handleChange} required /></div>
                                        <div className="form-group"><label htmlFor="taxa_minima">Taxa Mínima (R$):</label><input type="number" step="0.01" id="taxa_minima" value={formData.taxa_minima || ''} onChange={handleChange} placeholder="Ex: 30.00" /></div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label htmlFor="data_leitura">Data da Leitura:</label><input type="date" id="data_leitura" value={formData.data_leitura || ''} onChange={handleChange} required /></div>
                                        <div className="form-group"><label htmlFor="numero_dias">Nº de Dias de Leitura:</label><input type="number" id="numero_dias" value={formData.numero_dias || ''} onChange={handleChange} required /></div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label htmlFor="data_vencimento">Vencimento:</label><input type="date" id="data_vencimento" value={formData.data_vencimento || ''} onChange={handleChange} required /></div>
                                        <div className="form-group">
                                            <label htmlFor="percentual_desconto">Desconto (%):</label>
                                            <input type="number" id="percentual_desconto" value={formData.percentual_desconto || ''} onChange={handleChange} placeholder="Ex: 30" />
                                        </div>
                                    </div>
                                    {selectedInstalacaoInfo.tipo_instalacao === 'Geradora' && (
                                        <div className="form-group">
                                            <label htmlFor="injecao_kwh">Energia Injetada (kWh):</label>
                                            <input type="number" step="0.01" id="injecao_kwh" value={formData.injecao_kwh || ''} onChange={handleChange} />
                                        </div>
                                    )}
                                </fieldset>
                            ) : (
                                <fieldset className="form-section">
                                    <legend>Dados de Monitoramento</legend>
                                    <div className="form-row">
                                        <div className="form-group"><label htmlFor="valor_total">Valor da Fatura (R$):</label><input type="number" step="0.01" id="valor_total" value={formData.valor_total || ''} onChange={handleChange} required /></div>
                                        <div className="form-group"><label htmlFor="data_vencimento">Vencimento:</label><input type="date" id="data_vencimento" value={formData.data_vencimento || ''} onChange={handleChange} required /></div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="data_leitura">Data da Leitura:</label><input type="date" id="data_leitura" value={formData.data_leitura || ''} onChange={handleChange} required />
                                    </div>
                                </fieldset>
                            )}
                            <button type="submit" className="btn-blue" disabled={enviando}>{enviando ? 'Processando...' : 'Gerar Fatura'}</button>
                        </>
                    )}
                    {mensagem.texto && <div className={`message ${mensagem.tipo}`}>{mensagem.texto}</div>}
                </form>
            </div>
        </div>
    );
};

export default FaturaModal;