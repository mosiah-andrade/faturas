// faturas/gestao-fatura/src/components/InstalacaoForm.jsx

import React, { useState, useEffect } from 'react';
import './Form.css'; // Reutilizando o CSS

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const InstalacaoForm = ({ onSave, onCancel, initialData }) => {
    
    // Normaliza os IDs (aceita camelCase OU snake_case)
    const vIntegradorId = initialData?.integradorId || initialData?.integrador_id;
    const vClienteId = initialData?.clienteId || initialData?.cliente_id;

    const [formData, setFormData] = useState({
        integrador_id: vIntegradorId || '',
        cliente_id: vClienteId || '',
        codigo_uc: initialData?.codigo_uc || '',
        endereco_instalacao: initialData?.endereco_instalacao || '',
        tipo_contrato: initialData?.tipo_contrato || 'Monofásico', 
        tipo_instalacao: initialData?.tipo_instalacao || 'Geradora', 
        regra_faturamento: initialData?.regra_faturamento || 'geracao',
    });

    const [integradores, setIntegradores] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loadingIntegradores, setLoadingIntegradores] = useState(false);
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [error, setError] = useState('');

    // Efeito para buscar integradores (para preencher o nome ou o select)
    useEffect(() => {
        const fetchIntegradores = async () => {
            setLoadingIntegradores(true);
            try {
                // Se vIntegradorId existir, busca só ele (para preencher o estado)
                // Se não, busca todos (para o select)
                const url = vIntegradorId 
                    ? `${API_BASE_URL}get_integrador.php?id=${vIntegradorId}` // Busca 1
                    : `${API_BASE_URL}listar_integradores.php`; // Busca todos
                    
                const res = await fetch(url);
                const data = await res.json();
                
                if (res.ok) {
                    setIntegradores(Array.isArray(data) ? data : [data]);
                } else {
                    throw new Error(data.message || 'Erro ao buscar integradores');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoadingIntegradores(false);
            }
        };
        fetchIntegradores();
    }, [vIntegradorId]);

    // Efeito para buscar clientes (baseado no integrador)
    useEffect(() => {
        if (formData.integrador_id) {
            setLoadingClientes(true);
            const fetchClientes = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}get_clientes_por_integrador.php?integrador_id=${formData.integrador_id}`);
                    const data = await res.json();
                    if (res.ok) {
                        // Lógica para remover duplicados
                        const clientesUnicos = data.reduce((acc, current) => {
                            if (!acc.find(item => item.cliente_id === current.cliente_id)) {
                                acc.push({ cliente_id: current.cliente_id, nome: current.nome });
                            }
                            return acc;
                        }, []);
                        setClientes(clientesUnicos);
                    } else {
                        throw new Error(data.message || 'Erro ao buscar clientes');
                    }
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoadingClientes(false);
                }
            };
            fetchClientes();
        } else {
            setClientes([]); 
        }
    }, [formData.integrador_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'integrador_id') {
            setFormData(prev => ({ ...prev, cliente_id: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        // Envia o formData completo (incluindo os IDs que vieram da pagina)
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="modal-form">
            {error && <p className="error-message">{error}</p>}
            
            {/* * =============================================
              * CORREÇÃO: Oculta o grupo se o ID já foi fornecido
              * =============================================
            */}
            {!vIntegradorId && (
                <div className="form-group">
                    <label htmlFor="integrador_id">Integrador:</label>
                    <select
                        id="integrador_id"
                        name="integrador_id"
                        value={formData.integrador_id}
                        onChange={handleChange}
                        disabled={loadingIntegradores}
                        required
                    >
                        <option value="">{loadingIntegradores ? 'Carregando...' : 'Selecione...'}</option>
                        {integradores.map(int => (
                            <option key={int.id} value={int.id}>{int.nome || int.nome_do_integrador}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* * =============================================
              * CORREÇÃO: Oculta o grupo se o ID já foi fornecido
              * =============================================
            */}
            {!vClienteId && (
                <div className="form-group">
                    <label htmlFor="cliente_id">Cliente:</label>
                    <select
                        id="cliente_id"
                        name="cliente_id"
                        value={formData.cliente_id}
                        onChange={handleChange}
                        disabled={loadingClientes || !formData.integrador_id}
                        required
                    >
                        <option value="">{loadingClientes ? 'Carregando...' : 'Selecione...'}</option>
                        {clientes.map(cli => (
                            <option key={cli.cliente_id} value={cli.cliente_id}>{cli.nome}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* O restante do formulário permanece igual */}

            <div className="form-group">
                <label htmlFor="codigo_uc">Código UC (Unid. Consumidora):</label>
                <input
                    type="text"
                    id="codigo_uc"
                    name="codigo_uc"
                    value={formData.codigo_uc}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="endereco_instalacao">Endereço da Instalação:</label>
                <input
                    type="text"
                    id="endereco_instalacao"
                    name="endereco_instalacao"
                    value={formData.endereco_instalacao}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="tipo_contrato">Tipo de Ligação:</label>
                <select id="tipo_contrato" name="tipo_contrato" value={formData.tipo_contrato} onChange={handleChange}>
                    <option value="Monofásico">Monofásico</option>
                    <option value="Bifásico">Bifásico</option>
                    <option value="Trifásico">Trifásico</option>
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="tipo_instalacao">Tipo de Instalação:</label>
                <select id="tipo_instalacao" name="tipo_instalacao" value={formData.tipo_instalacao} onChange={handleChange}>
                    <option value="Geradora">Geradora</option>
                    <option value="Beneficiária">Beneficiária</option>
                </select>
            </div>
            
            <div className="form-group">
                <label htmlFor="regra_faturamento">Regra de Faturamento:</label>
                <select id="regra_faturamento" name="regra_faturamento" value={formData.regra_faturamento} onChange={handleChange}>
                    <option value="Antes da Taxação">Antes da Taxação </option>
                    <option value="Depois da Taxação">Depois da Taxação</option>
                </select>
            </div>

            <div className="form-actions">
                <button type="button" onClick={onCancel} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-save">Salvar</button>
            </div>
        </form>
    );
};

export default InstalacaoForm;