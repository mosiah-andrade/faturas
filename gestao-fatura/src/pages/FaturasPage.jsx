import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import Container from '../components/Container';
import FaturaModal from '../components/FaturaModal';
import './FaturasPage.css';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = 'http://localhost/faturas/api/';

const FaturasPage = () => {
    const { clienteId } = useParams();
    const navigate = useNavigate();
    const { openFaturaModal } = useOutletContext() || {};

    const [cliente, setCliente] = useState(null);
    const [faturas, setFaturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}get_faturas.php?cliente_id=${clienteId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            setCliente(data.cliente);
            setFaturas(data.faturas);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clienteId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const preSelectedIdsForModal = useMemo(() => ({
        clienteId: clienteId,
        integradorId: cliente?.integrador_id
    }), [clienteId, cliente?.integrador_id]);

    const formatCurrency = (v, fractionDigits = 2) => v != null ? parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: fractionDigits }) : 'R$ 0,00';
    
    const handleStatusChange = async (faturaId, novoStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}atualizar_status_fatura.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fatura_id: faturaId, status: novoStatus })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            setFaturas(faturas.map(f => f.id === faturaId ? { ...f, status: novoStatus } : f));
        } catch (error) {
            alert(`Erro ao atualizar status: ${error.message}`);
        }
    };
    
    const handleExportPDF = async (faturaId) => {
        try {
            const response = await fetch(`${API_BASE_URL}get_detalhes_fatura.php?fatura_id=${faturaId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
    
            const doc = new jsPDF();
            autoTable(doc, {}); 
    
            const page_width = doc.internal.pageSize.getWidth();
            const margin = 14;
    
            // Funções de formatação
            const formatMonthYearFull = (d) => d ? new Date(d).toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
            const formatVencimentoMonth = (d) => d ? new Date(d).toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' }).toUpperCase() : '';
            const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
            const formatKwh = (v) => v != null ? parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0';
            const formatPercent = (v) => v != null ? `${parseInt(v)}%` : '0%';

            // --- NOVO CABEÇALHO ---
            doc.addImage('/homolog.png', 'PNG', margin, 5, 25, 28);

            const titleX = 80; // Posição X para o início dos títulos
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text("RELATÓRIO DE CONSUMO", titleX, 20);
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(`Competência: ${formatMonthYearFull(data.fatura.mes_referencia)}`, titleX, 28);
            
            doc.setFont(undefined, 'bold');
            doc.text(`Vencimento em: ${formatVencimentoMonth(data.fatura.data_vencimento)}`, titleX, 34);

            // Linha separadora
            doc.setLineWidth(0.5);
            doc.line(margin, 42, page_width - margin, 42);

            // Informações do cliente
            doc.setFontSize(9);
            const leftColX = margin;
            const rightColX = page_width / 2;

            doc.setFont(undefined, 'bold');
            doc.text("CLIENTE:", leftColX, 50);
            doc.setFont(undefined, 'normal');
            doc.text(data.fatura.cliente_nome, leftColX + 25, 50);

            doc.setFont(undefined, 'bold');
            doc.text("ENDEREÇO:", leftColX, 56);
            doc.setFont(undefined, 'normal');
            doc.text(data.fatura.endereco_instalacao, leftColX + 25, 56);

            doc.setFont(undefined, 'bold');
            doc.text("CPF/CNPJ:", rightColX, 50);
            doc.setFont(undefined, 'normal');
            doc.text(data.fatura.cliente_documento, rightColX + 25, 50);

            doc.setFont(undefined, 'bold');
            doc.text("CÓD. UC:", rightColX, 56);
            doc.setFont(undefined, 'normal');
            doc.text(data.fatura.codigo_uc, rightColX + 25, 56);

            doc.line(margin, 62, page_width - margin, 62);

            let currentY = 70;
            
            // --- TABELAS (O restante do código permanece o mesmo) ---
            const consumptionDataBody = [
                ['Data da Leitura', formatDate(data.fatura.data_leitura)],
                ['Consumo (R$)', formatCurrency(data.fatura.consumo_kwh)],
                ['Taxa Mínima', formatCurrency(data.fatura.taxa_minima)],
            ];
            if (data.fatura.tipo_contrato === 'Investimento') {
                consumptionDataBody.push(
                    [{ content: 'Valor total sem desconto', styles: { fontStyle: 'bold' } },
                     { content: formatCurrency(data.fatura.subtotal), styles: { fontStyle: 'bold' } }]
                );
                if (parseFloat(data.fatura.valor_desconto) > 0) {
                    consumptionDataBody.push([
                        `Desconto (${formatPercent(data.fatura.percentual_desconto)})`, 
                        { content: `-${formatCurrency(data.fatura.valor_desconto)}`, styles: { textColor: [220, 53, 69] } }
                    ]);
                }
            }
            consumptionDataBody.push(
                [{ content: 'VALOR A PAGAR', styles: { fontStyle: 'bold', fillColor: [220, 235, 255] } },
                 { content: formatCurrency(data.fatura.valor_total), styles: { fontStyle: 'bold' } }]
            );
            
            autoTable(doc, {
                body: consumptionDataBody,
                startY: currentY,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: { 
                    0: { fontStyle: 'bold', fillColor: [245, 245, 245] },
                    1: { halign: 'right' }
                },
            });
            currentY = doc.lastAutoTable.finalY;

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text("Histórico de Consumo", margin, currentY + 12);
            const historicFaturas = faturas.slice(0, 6);
            const historyRows = historicFaturas.map(f => [
                new Date(f.mes_referencia).toLocaleString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase(),
                `${formatKwh(f.consumo_kwh)} kWh`
            ]);
            autoTable(doc, {
                head: [['Mês/Ano', 'Consumo']],
                body: historyRows,
                startY: currentY + 15,
                theme: 'striped',
                headStyles: { fillColor: [220, 220, 220], textColor: [40, 40, 40] },
                styles: { fontSize: 8 },
                columnStyles: { 1: { halign: 'right' } }
            });
            currentY = doc.lastAutoTable.finalY;
    
            doc.setFontSize(12);
            doc.text("Pague com PIX:", margin, currentY + 15);
            doc.addImage('/pix.png', 'PNG', margin, currentY + 18, 55, 55);
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text("CNPJ: 46.967.661/0001-91", margin, currentY + 78);
            doc.setFontSize(10);
            doc.text("VENCIMENTO", 120, currentY + 15);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(formatDate(data.fatura.data_vencimento), 120, currentY + 21);
            doc.setFontSize(10);
            doc.text("TOTAL A PAGAR", 120, currentY + 29);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(formatCurrency(data.fatura.valor_total), 120, currentY + 35);
            
            doc.setFontSize(8);
            doc.setFont(undefined, 'italic');
            const observacao = "*Favor enviar o comprovante via whatsapp +55 81 8987-8175";
            doc.text(observacao, page_width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    
            doc.save(`Relatorio-${data.fatura.id}-${data.fatura.cliente_nome}.pdf`);
        } catch (error) {
            alert(`Erro ao gerar PDF: ${error.message}`);
        }
    };

    if (loading) return <Container><p>Carregando faturas...</p></Container>;
    if (error) return <Container><p className="error-message">{error}</p></Container>;

    return (
        <>
            <FaturaModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onFaturaGerada={fetchData}
                preSelectedIds={preSelectedIdsForModal}
            />
            <div className="container">
                {cliente && (
                    <div className="cliente-header">
                        <h1>{cliente.nome}</h1>
                        <p className="cliente-doc">Documento: {cliente.documento}</p>
                        <div className="cliente-details-grid">
                            <div className="detail-item"><strong>Tipo de Contrato:</strong><span>{cliente.tipo_contrato}</span></div>
                            <div className="detail-item"><strong>Tipo de Instalação:</strong><span>{cliente.tipo_instalacao}</span></div>
                            <div className="detail-item"><strong>Tipo de Ligação:</strong><span>{cliente.tipo_de_ligacao}</span></div>
                        </div>
                    </div>
                )}
                <div className="header-actions">
                    <h2>Histórico de Faturas</h2>
                    <button className="action-btn" onClick={() => openFaturaModal ? openFaturaModal({ clienteId: clienteId, integradorId: cliente.integrador_id }) : setModalOpen(true)}>
                        + Gerar Nova Fatura
                    </button>
                </div>
                <div className="table-wrapper">
                    {faturas.length > 0 ? (
                        <table className="faturas-table">
                            <thead>
                                <tr>
                                    <th>Mês Ref.</th>
                                    <th>Vencimento</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {faturas.map((fatura) => (
                                    <tr key={fatura.id} onClick={(e) => { if (!e.target.closest('select, button, a')) navigate(`/fatura/${fatura.id}`)}}>
                                        <td>{new Date(fatura.mes_referencia).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric', timeZone: 'UTC' })}</td>
                                        <td>{new Date(fatura.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valor_total)}</td>
                                        <td>
                                            <select
                                                className={`status-select status-${fatura.status}`}
                                                value={fatura.status}
                                                onChange={(e) => handleStatusChange(fatura.id, e.target.value)}
                                            >
                                                <option value="pendente">Pendente</option>
                                                <option value="paga">Paga</option>
                                                <option value="vencida">Vencida</option>
                                                <option value="cancelada">Cancelada</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <Link to={`/fatura/${fatura.id}`} className="btn-details">Ver Detalhes</Link>
                                                <button className="pdf-btn" onClick={(e) => { e.stopPropagation(); handleExportPDF(fatura.id); }}>
                                                    Exportar PDF
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-data">Nenhuma fatura encontrada para este cliente.</p>
                    )}
                </div>
                <Link to={`/integrador/${cliente?.integrador_id || ''}`} className="back-link">&larr; Voltar para o Integrador</Link>
            </div>
        </>
    );
};

export default FaturasPage;