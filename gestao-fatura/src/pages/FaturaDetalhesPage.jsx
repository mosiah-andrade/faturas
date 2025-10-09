import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './FaturaDetalhesPage.css';

const API_BASE_URL = 'http://localhost/faturas/api/';

const FaturaDetalhesPage = () => {
    const { faturaId } = useParams();
    const [fatura, setFatura] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetalhes = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}get_detalhes_fatura.php?fatura_id=${faturaId}`);
                if (!response.ok) {
                    throw new Error('Fatura não encontrada ou falha ao carregar dados.');
                }
                const data = await response.json();
                setFatura(data.fatura);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetalhes();
    }, [faturaId]);

    const formatValue = (value, type) => {
        if (value == null) return '-';
        switch (type) {
            case 'currency':
                return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            case 'date':
                return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            case 'percent':
                return `${parseInt(value)}%`;
            default:
                return value;
        }
    };

    if (loading) {
        return <div className="detalhes-container"><p>Carregando detalhes...</p></div>;
    }

    if (error) {
        return <div className="detalhes-container"><p className="error-message">{error}</p></div>;
    }

    return (
        <div className="detalhes-container">
            <h1>Detalhes da Fatura #{fatura.id}</h1>

            <div className="card info-cliente">
                <h2>Dados do Cliente</h2>
                <div className="info-grid">
                    <p><strong>Nome:</strong> {fatura.cliente_nome}</p>
                    <p><strong>Documento:</strong> {fatura.cliente_documento}</p>
                    <p><strong>Endereço:</strong> {fatura.endereco_instalacao}</p>
                    <p><strong>Cód. UC:</strong> {fatura.codigo_uc}</p>
                </div>
            </div>

            <div className="card info-fatura">
                <h2>Dados da Fatura</h2>
                <div className="info-grid">
                    <p><strong>Mês Referência:</strong> {formatValue(fatura.mes_referencia, 'date').substring(3)}</p>
                    <p><strong>Vencimento:</strong> {formatValue(fatura.data_vencimento, 'date')}</p>
                    <p><strong>Data da Leitura:</strong> {formatValue(fatura.data_leitura, 'date')}</p>
                    <p><strong>Tipo de Ligação:</strong> {fatura.tipo_de_ligacao}</p>
                    <p><strong>Consumo (kWh):</strong> {fatura.consumo_kwh}</p>
                    <p><strong>Valor kWh:</strong> {formatValue(fatura.valor_kwh, 'currency')}</p>
                    <p><strong>Taxa Mínima:</strong> {formatValue(fatura.taxa_minima, 'currency')}</p>
                    <p><strong>Desconto:</strong> {formatValue(fatura.percentual_desconto, 'percent')}</p>
                    <p className="valor-total"><strong>Valor Total:</strong> {formatValue(fatura.valor_total, 'currency')}</p>
                </div>
            </div>
            
            <Link to={`/cliente/${fatura.cliente_id}/faturas`} className="back-link">&larr; Voltar para o Histórico</Link>
        </div>
    );
};

export default FaturaDetalhesPage;