// faturas/gestao-fatura/src/pages/FaturaDetalhesPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '../components/Container';
import './FaturaDetalhesPage.css'; 
import GerarFaturaPdf from '../utils/pdfGenerator';
import { FiEye } from 'react-icons/fi';
import { FaRegFilePdf, FaSpinner } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FaturaDetalhesPage = () => {
    const { faturaId } = useParams();
    const navigate = useNavigate();
    const [fatura, setFatura] = useState(null);
    
    // --- NOVO ESTADO PARA O HISTÓRICO ---
    const [historico, setHistorico] = useState([]); 
    
    const [loading, setLoading] = useState(true);
    const [statusAtual, setStatusAtual] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}get_detalhes_fatura.php?fatura_id=${faturaId}`);
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Erro ao buscar dados da fatura');
            }
            
            // --- ATUALIZADO PARA O NOVO FORMATO DO JSON ---
            setFatura(data.fatura_detalhes);
            setHistorico(data.historico_consumo || []); // Salva o histórico
            setStatusAtual(data.fatura_detalhes.status); 

        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [faturaId]);

    // (handleStatusChange não muda)
    const handleStatusChange = async (e) => {
        const novoStatus = e.target.value;
        if (!confirm(`Tem certeza que deseja alterar o status para "${novoStatus}"?`)) {
            e.target.value = statusAtual;
            return;
        }
        setIsUpdating(true);
        setStatusAtual(novoStatus); 
        try {
            const res = await fetch(`${API_BASE_URL}atualizar_status_fatura.php`, { //
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fatura_id: faturaId, novo_status: novoStatus })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Erro ao atualizar status');
            alert(result.message);
            fetchData(); 
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert(`Erro: ${error.message}`);
            setStatusAtual(fatura.status); 
        } finally {
            setIsUpdating(false);
        }
    };

    const handleExportPDF = () => {
        if (!fatura) return;
        setIsGeneratingPDF(true);
        try {
            // --- ATUALIZADO: Passa o histórico para o gerador ---
            GerarFaturaPdf(fatura, historico);
        } catch (error) {
            console.error("Falha ao iniciar a geração do PDF.", error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // (O JSX/return permanece o mesmo da resposta anterior)
    if (loading) {
        return <Container><p>Carregando detalhes da fatura...</p></Container>;
    }
    if (!fatura) {
        return <Container><p>Fatura não encontrada.</p></Container>;
    }
    return (
        <Container>
            <div className="fatura-detalhes-header">
                <h1>Detalhes da Fatura: {fatura.mes_referencia}</h1>
                <div className="header-actions">
                    <button 
                        onClick={handleExportPDF} 
                        className="btn-pdf btn-red"
                        disabled={isGeneratingPDF}
                    >
                        {isGeneratingPDF ? <FaSpinner  stroke="#ffffffff" className="spinner"/> : <FaRegFilePdf />}
                    </button>
                    
                </div>
            </div>
            <div className="detalhes-card status-card">
                <h3>Status da Fatura</h3>
                <div className="form-group">
                    <label htmlFor="status-select">Alterar Status:</label>
                    <select 
                        id="status-select" 
                        value={statusAtual} 
                        onChange={handleStatusChange}
                        disabled={isUpdating}
                        className={`status-badge status-${statusAtual.toLowerCase()}`}
                    >
                        <option value="Pendente">Pendente</option>
                        <option value="Pago">Pago</option>
                        <option value="Vencida">Vencida</option>
                        <option value="Cancelada">Cancelada</option>
                    </select>
                    {isUpdating && <p>Atualizando...</p>}
                </div>
            </div>
            <div className="detalhes-grid">
                <div className="detalhes-card">
                    <h4>Informações do Cliente</h4>
                    <p><strong>Cliente:</strong> {fatura.cliente_nome}</p>
                    <p><strong>Integrador:</strong> {fatura.nome_do_integrador}</p>
                    <p><strong>Documento:</strong> {fatura.cliente_documento}</p>
                </div>
                <div className="detalhes-card">
                    <h4>Informações da Instalação</h4>
                    <p><strong>Código UC:</strong> {fatura.codigo_uc}</p>
                    <p><strong>Endereço:</strong> {fatura.endereco_instalacao}</p>
                    <p><strong>Contrato:</strong> {fatura.tipo_contrato}</p>
                </div>
            </div>
            <a onClick={() => navigate(-1)} className="back-link" style={{margin: 0}}>&larr; Voltar</a>
        </Container>
    );
};

export default FaturaDetalhesPage;