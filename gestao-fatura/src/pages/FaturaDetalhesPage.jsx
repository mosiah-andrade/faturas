import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Container from '../components/Container';
import './FaturaDetalhesPage.css';
import logoImg from '../assets/homolog.png';
import pixImg from '../assets/pix.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/faturas/api/';

const FaturaDetalhesPage = () => {
    const { faturaId } = useParams();
    const [fatura, setFatura] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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

    const handleExportPDF = async () => {
        try {
            const doc = new jsPDF();
            const page_width = doc.internal.pageSize.getWidth();
            const margin = 14;

            const formatMonthYearFull = (d) => d ? new Date(d).toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
            const formatVencimentoMonth = (d) => d ? new Date(d).toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' }).toUpperCase() : '';
            const formatKwh = (v) => v != null ? parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0';

            // Cabeçalho
            doc.addImage(logoImg, 'PNG', margin, 5, 25, 28);

            const titleX = 80;
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text("DETALHES DA FATURA", titleX, 20);
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(`Competência: ${formatMonthYearFull(fatura.mes_referencia)}`, titleX, 28);
            
            doc.setFont(undefined, 'bold');
            doc.text(`Vencimento em: ${formatVencimentoMonth(fatura.data_vencimento)}`, titleX, 34);

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
            doc.text(fatura.cliente_nome, leftColX + 25, 50);

            doc.setFont(undefined, 'bold');
            doc.text("ENDEREÇO:", leftColX, 56);
            doc.setFont(undefined, 'normal');
            doc.text(fatura.endereco_instalacao, leftColX + 25, 56);

            doc.setFont(undefined, 'bold');
            doc.text("CPF/CNPJ:", rightColX, 50);
            doc.setFont(undefined, 'normal');
            doc.text(fatura.cliente_documento, rightColX + 25, 50);

            doc.setFont(undefined, 'bold');
            doc.text("CÓD. UC:", rightColX, 56);
            doc.setFont(undefined, 'normal');
            doc.text(fatura.codigo_uc, rightColX + 25, 56);

            doc.line(margin, 62, page_width - margin, 62);

            let currentY = 70;
            
            // Tabela de dados
            const consumptionDataBody = [
                ['Data da Leitura', formatDate(fatura.data_leitura)],
                ['Consumo (R$)', formatCurrency(fatura.consumo_kwh)],
                ['Taxa Mínima', formatCurrency(fatura.taxa_minima)],
            ];
            
            consumptionDataBody.push(
                [{ content: 'Valor total sem desconto', styles: { fontStyle: 'bold' } },
                 { content: formatCurrency(fatura.subtotal), styles: { fontStyle: 'bold' } }]
            );
            
            if (parseFloat(fatura.valor_desconto) > 0) {
                consumptionDataBody.push([
                    `Desconto (${formatPercent(fatura.percentual_desconto)})`, 
                    { content: `-${formatCurrency(fatura.valor_desconto)}`, styles: { textColor: [220, 53, 69] } }
                ]);
            }
            
            consumptionDataBody.push(
                [{ content: 'VALOR A PAGAR', styles: { fontStyle: 'bold', fillColor: [220, 235, 255] } },
                 { content: formatCurrency(fatura.valor_total), styles: { fontStyle: 'bold' } }]
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
    
            doc.setFontSize(12);
            doc.text("Pague com PIX:", margin, currentY + 15);
            doc.addImage(pixImg, 'PNG', margin, currentY + 18, 55, 55);
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text("CNPJ: 46.967.661/0001-91", margin, currentY + 78);
            doc.setFontSize(10);
            doc.text("VENCIMENTO", 120, currentY + 15);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(formatDate(fatura.data_vencimento), 120, currentY + 21);
            doc.setFontSize(10);
            doc.text("TOTAL A PAGAR", 120, currentY + 29);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(formatCurrency(fatura.valor_total), 120, currentY + 35);
            
            doc.setFontSize(8);
            doc.setFont(undefined, 'italic');
            const observacao = "*Favor enviar o comprovante via whatsapp +55 81 8987-8175";
            doc.text(observacao, page_width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    
            doc.save(`Fatura-${fatura.id}-${fatura.cliente_nome}.pdf`);
        } catch (error) {
            alert(`Erro ao gerar PDF: ${error.message}`);
        }
    };

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
            <a 
                    className="back-link" 
                    onClick={() => navigate(-1)} 
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                    &larr; Voltar
                </a>
            <div className="detalhes-header-logo">
                <img src={logoImg} alt="Logo" className="header-logo" />
            </div>

            <div className="detalhes-header">
                <h1>Detalhes da Fatura #{fatura.id}</h1>
                <button onClick={handleExportPDF} className="btn-export-pdf">📥 Exportar PDF</button>
            </div>

            <div className="card info-cliente">
                <h2>Dados do Cliente</h2>
                <table className="info-table">
                    <tbody>
                        <tr>
                            <td><strong>Nome:</strong></td>
                            <td>{fatura.cliente_nome}</td>
                        </tr>
                        <tr>
                            <td><strong>Documento:</strong></td>
                            <td>{fatura.cliente_documento}</td>
                        </tr>
                        <tr>
                            <td><strong>Endereço:</strong></td>
                            <td>{fatura.endereco_instalacao}</td>
                        </tr>
                        <tr>
                            <td><strong>Cód. UC:</strong></td>
                            <td>{fatura.codigo_uc}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="card info-fatura">
                <h2>Dados da Fatura</h2>
                <table className="info-table">
                    <tbody>
                        <tr>
                            <td><strong>Mês Referência:</strong></td>
                            <td>{new Date(fatura.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</td>
                        </tr>
                        <tr>
                            <td><strong>Vencimento:</strong></td>
                            <td>{formatDate(fatura.data_vencimento)}</td>
                        </tr>
                        <tr>
                            <td><strong>Data da Leitura:</strong></td>
                            <td>{formatDate(fatura.data_leitura)}</td>
                        </tr>
                        <tr>
                            <td><strong>Tipo de Ligação:</strong></td>
                            <td>{fatura.tipo_de_ligacao}</td>
                        </tr>
                        <tr>
                            <td><strong>Consumo (R$):</strong></td>
                            <td>{formatCurrency(fatura.consumo_kwh)}</td>
                        </tr>
                        <tr>
                            <td><strong>Taxa Mínima:</strong></td>
                            <td>{formatCurrency(fatura.taxa_minima)}</td>
                        </tr>
                        <tr className="subtotal-row">
                            <td><strong>Subtotal:</strong></td>
                            <td className="subtotal">{formatCurrency(fatura.subtotal)}</td>
                        </tr>
                        <tr className="desconto-row">
                            <td><strong>Desconto ({formatPercent(fatura.percentual_desconto)}):</strong></td>
                            <td className="desconto">-{formatCurrency(fatura.valor_desconto)}</td>
                        </tr>
                        <tr className="total-row">
                            <td><strong>Valor Total:</strong></td>
                            <td className="valor-total">{formatCurrency(fatura.valor_total)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            
        </Container>
    );
};

export default FaturaDetalhesPage;