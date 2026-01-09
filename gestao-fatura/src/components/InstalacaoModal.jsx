import React, { useState, useEffect } from 'react';
import './Modal.css'; //
import './Form.css';  //

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/faturas/api/';

const InstalacaoModal = ({ isOpen, onClose, clienteId }) => {
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    
    // Armazena o ID do integrador recuperado do cliente (necessário para o backend)
    const [integradorId, setIntegradorId] = useState(null);

    const [formData, setFormData] = useState({
        endereco_instalacao: '',
        codigo_uc: '',
        tipo_de_ligacao: 'Monofásica',
        tipo_instalacao: 'Beneficiária',
        regra_faturamento: 'Depois da Taxação'
    });

    // Ao abrir o modal, buscamos o integrador_id do cliente automaticamente
    useEffect(() => {
        if (isOpen && clienteId) {
            // Resetar form
            setFormData({
                endereco_instalacao: '',
                codigo_uc: '',
                tipo_de_ligacao: 'Monofásica',
                tipo_instalacao: 'Beneficiária',
                regra_faturamento: 'Depois da Taxação'
            });
            setFeedback({ type: '', message: '' });
            setLoading(false);

            // Fetch para pegar o integrador_id
            fetch(`${API_BASE_URL}get_cliente.php?id=${clienteId}`)
                .then(res => {
                    if (!res.ok) throw new Error('Erro ao buscar cliente');
                    return res.json();
                })
                .then(data => {
                    if (data.integrador_id) {
                        setIntegradorId(data.integrador_id);
                    } else {
                        setFeedback({ type: 'error', message: 'Erro: Cliente sem integrador vinculado.' });
                    }
                })
                .catch(err => {
                    console.error("Erro ao buscar detalhes do cliente:", err);
                    setFeedback({ type: 'error', message: 'Erro ao carregar dados do cliente' });
                });
        }
    }, [isOpen, clienteId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!integradorId) {
            setFeedback({ type: 'error', message: 'Erro interno: ID do Integrador não identificado.' });
            return;
        }

        if (!formData.endereco_instalacao || !formData.codigo_uc) {
            setFeedback({ type: 'error', message: 'Endereço e UC são obrigatórios.' });
            return;
        }

        setLoading(true);
        setFeedback({ type: 'info', message: 'Cadastrando instalação...' });

        try {
            const response = await fetch(`${API_BASE_URL}cadastrar_instalacao.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente_id: clienteId,
                    integrador_id: integradorId, // Campo obrigatório no seu PHP
                    ...formData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao cadastrar instalação.');
            }

            setFeedback({ type: 'success', message: 'Instalação cadastrada com sucesso!' });

            // Fecha o modal após 1.5s
            setTimeout(() => onClose(), 1500);

        } catch (error) {
            setFeedback({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}> {/* */}
            <div className="modal-content" onClick={e => e.stopPropagation()}> {/* */}
                <span className="close-btn" onClick={onClose}>&times;</span> {/* */}

                {/* Título com estilo do Container.css (inline para consistência) */}
                <h2 style={{
                    textAlign: 'center',
                    color: '#212529',
                    marginBottom: '25px',
                    borderBottom: '2px solid #ff9900',
                    paddingBottom: '10px',
                    marginTop: 0
                }}>
                    Nova Instalação
                </h2>

                <form onSubmit={handleSubmit} className="fade-in">
                    {feedback.message && (
                        <div style={{
                            padding: '10px',
                            marginBottom: '15px',
                            borderRadius: '6px',
                            color: '#fff',
                            textAlign: 'center',
                            backgroundColor: feedback.type === 'error' ? '#dc3545' : 
                                             feedback.type === 'success' ? '#28a745' : '#17a2b8'
                        }}>
                            {feedback.message}
                        </div>
                    )}

                    <div className="form-group"> {/* */}
                        <label>Endereço Completo:</label>
                        <input
                            type="text"
                            name="endereco_instalacao"
                            value={formData.endereco_instalacao}
                            onChange={handleChange}
                            placeholder="Rua, Número, Bairro, Cidade"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-row"> {/* */}
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Código da UC:</label>
                            <input
                                type="text"
                                name="codigo_uc"
                                value={formData.codigo_uc}
                                onChange={handleChange}
                                placeholder="Ex: 123456789"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Tipo de Ligação:</label>
                            <select
                                name="tipo_de_ligacao"
                                value={formData.tipo_de_ligacao}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="Monofásica">Monofásica</option>
                                <option value="Bifásica">Bifásica</option>
                                <option value="Trifásica">Trifásica</option>
                            </select>
                        </div>
                    </div>

                    {/* Grupo de Rádio: Tipo de Instalação */}
                    <div className="form-group radio-group"> {/* */}
                        <span className="radio-group-label">Tipo de Instalação:</span>
                        <div className="radio-options"> {/* */}
                            <label>
                                <input
                                    type="radio"
                                    name="tipo_instalacao"
                                    value="Beneficiária"
                                    checked={formData.tipo_instalacao === 'Beneficiária'}
                                    onChange={handleChange}
                                />
                                <span>Beneficiária</span>
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="tipo_instalacao"
                                    value="Geradora"
                                    checked={formData.tipo_instalacao === 'Geradora'}
                                    onChange={handleChange}
                                />
                                <span>Geradora</span>
                            </label>
                        </div>
                    </div>

                    {/* Grupo de Rádio: Regra de Faturamento */}
                    <div className="form-group radio-group"> {/* */}
                        <span className="radio-group-label">Regra de Faturamento:</span>
                        <div className="radio-options"> {/* */}
                            <label>
                                <input
                                    type="radio"
                                    name="regra_faturamento"
                                    value="Depois da Taxação"
                                    checked={formData.regra_faturamento === 'Depois da Taxação'}
                                    onChange={handleChange}
                                />
                                <span>Depois da Taxação</span>
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="regra_faturamento"
                                    value="Antes da Taxação"
                                    checked={formData.regra_faturamento === 'Antes da Taxação'}
                                    onChange={handleChange}
                                />
                                <span>Antes da Taxação</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="btn-secondary"
                            style={{ background: '#6c757d', width: 'auto' }}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ 
                                backgroundColor: '#ff9900', 
                                width: 'auto',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Salvando...' : 'Cadastrar Instalação'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InstalacaoModal;