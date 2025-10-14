import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Container from '../components/Container';
import './FaturaDetalhesPage.css';

const API_BASE_URL = 'http://localhost/faturas/api/';

const FaturaDetalhesPage = () => {
    const { faturaId } = useParams();
    const [fatura, setFatura] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}get_detalhes_fatura.php?fatura_id=${faturaId}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Fatura não encontrada ou falha ao carregar dados.');
            }
            setFatura(data.fatura);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [faturaId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (v) => v != null ? parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';
    const formatPercent = (v) => v != null ? `${parseInt(v)}%` : '0%';

    if (loading) {
        return <Container><p>Carregando detalhes da fatura...</p></Container>;
    }

    if (error) {
        return <Container><p className="error-message">{error}</p></Container>;
    }

    if (!fatura) {
        return <Container><p>Nenhum dado de fatura encontrado.</p></Container>;
    }

    return (
        <Container>
            <div className="detalhes-header">
                <h1>Detalhes da Fatura #{fatura.id}</h1>
            </div>

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
                    <p><strong>Mês Referência:</strong> {new Date(fatura.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>
                    <p><strong>Vencimento:</strong> {formatDate(fatura.data_vencimento)}</p>
                    <p><strong>Data da Leitura:</strong> {formatDate(fatura.data_leitura)}</p>
                    <p><strong>Tipo de Ligação:</strong> {fatura.tipo_de_ligacao}</p>
                    <p><strong>Consumo (R$):</strong> {formatCurrency(fatura.consumo_kwh)}</p>
                    <p><strong>Taxa Mínima:</strong> {formatCurrency(fatura.taxa_minima)}</p>
                    <p className="subtotal"><strong>Subtotal:</strong> {formatCurrency(fatura.subtotal)}</p>
                    <p className="desconto"><strong>Desconto ({formatPercent(fatura.percentual_desconto)}):</strong> -{formatCurrency(fatura.valor_desconto)}</p>
                    <p className="valor-total"><strong>Valor Total:</strong> {formatCurrency(fatura.valor_total)}</p>
                </div>
            </div>
            
            {/* CORREÇÃO: O link de voltar agora usa o 'cliente_id' que vem da API */}
            <Link to={`/cliente/${fatura.cliente_id}/faturas`} className="back-link">&larr; Voltar para o Histórico</Link>
        </Container>
    );
};

export default FaturaDetalhesPage;