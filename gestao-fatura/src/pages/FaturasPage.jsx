import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Container from '../components/Container';
import FaturaModal from '../components/FaturaModal';
import './FaturasPage.css'; // Estilos específicos para esta página

// Bibliotecas para o PDF
import  jsPDF  from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

const API_BASE_URL = 'http://localhost/faturas/api/';

const FaturasPage = () => {
    const { clienteId } = useParams(); // Pega o ID do cliente da URL

    const [cliente, setCliente] = useState(null);
    const [faturas, setFaturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
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
        const right_align_x = page_width - margin;

        const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
        const formatMonthYear = (d) => d ? new Date(d).toLocaleString('pt-BR', { month: '2-digit', year: 'numeric', timeZone: 'UTC' }).toUpperCase() : '';
        const formatCurrency = (v) => v ? parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
        const formatKwh = (v) => v ? parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';
        
        // --- SEÇÃO 1: DADOS DO CLIENTE E DA FATURA ---
        doc.setFontSize(18);
        doc.text("Fatura de Geração de Energia", page_width / 2, 22, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text("CLIENTE", margin, 40);
        doc.setFont(undefined, 'normal');
        doc.text(data.fatura.cliente_nome, margin, 46);
        doc.text(`CPF/CNPJ: ${data.fatura.cliente_documento || ''}`, margin, 52); 
        doc.text(data.fatura.endereco_instalacao, margin, 58);
        doc.setFont(undefined, 'bold');
        doc.text("CÓDIGO DA INSTALAÇÃO", 120, 40);
        doc.setFont(undefined, 'normal');
        doc.text(data.fatura.codigo_uc, 120, 46);
        doc.setLineWidth(0.5);
        doc.line(margin, 65, page_width - margin, 65);

        // --- SEÇÃO 2: DETALHES DA FATURA ATUAL (ITENS E VALORES) ---
        autoTable(doc, {
            head: [['Descrição', 'Valor']],
            body: data.itens.map(item => [item.descricao, formatCurrency(item.valor_total_item)]),
            startY: 70,
            theme: 'striped',
            headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40] },
            styles: { fontSize: 9 },
            columnStyles: { 1: { halign: 'right' } }
        });
        
        let finalY = doc.lastAutoTable.finalY;

        // --- SEÇÃO 3: DADOS DE LEITURA DO MÊS ATUAL ---
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text("Dados da Leitura - " + formatMonthYear(data.fatura.mes_referencia), margin, finalY + 12);
        
        const leituraBody = [
            ['Consumo da Rede (kWh)', formatKwh(data.fatura.consumo_kwh)],
            ['Energia Injetada (kWh)', formatKwh(data.fatura.injecao_kwh)],
        ];
        autoTable(doc, {
            body: leituraBody,
            startY: finalY + 15,
            theme: 'grid',
            styles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
        });

        finalY = doc.lastAutoTable.finalY;

        // --- SEÇÃO 4: HISTÓRICO DE CONSUMO ---
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text("Histórico de Consumo", margin, finalY + 12);

        const historicFaturas = faturas.slice(0, 12);
        const historyRows = historicFaturas.map(f => [
            formatMonthYear(f.mes_referencia),
            `${formatKwh(f.consumo_kwh)} kWh`
        ]);
        autoTable(doc, {
            head: [['Mês/Ano', 'Consumo']],
            body: historyRows,
            startY: finalY + 15,
            theme: 'striped',
            headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40] },
            styles: { fontSize: 8 },
            columnStyles: { 1: { halign: 'right' } }
        });

        finalY = doc.lastAutoTable.finalY;

        // --- SEÇÃO 5: RODAPÉ COM VALOR TOTAL E PIX ---
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("TOTAL A PAGAR:", right_align_x, finalY + 15, { align: 'right' });
        doc.text(formatCurrency(data.fatura.valor_total), right_align_x, finalY + 22, { align: 'right' });
        
        doc.setFontSize(12);
        doc.text("Pague com PIX:", margin, finalY + 20);
        
        doc.addImage('/pix.png', 'PNG', margin, finalY + 23, 60, 60);

        // ** MUDANÇA 1: Adiciona a chave PIX **
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text("CNPJ: 46.967.661/0001-91", margin, finalY + 88); // Posição Y ajustada para ficar abaixo do QR code

        // ** MUDANÇA 2: Adiciona a observação no rodapé **
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        const observacao = "*Favor enviar o comprovante via whatsapp +55 81 8987-8175";
        doc.text(observacao, page_width / 2, doc.internal.pageSize.height - 10, { align: 'center' });

        doc.save(`fatura-${data.fatura.id}-${data.fatura.cliente_nome}.pdf`);
    } catch (error) {
        alert(`Erro ao gerar PDF: ${error.message}`);
    }
};


    if (loading) {
        return <Container><p>Carregando faturas...</p></Container>;
    }

    if (error) {
        return <Container><p className="error-message">{error}</p></Container>;
    }

    return (
        <>
            <FaturaModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onFaturaGerada={fetchData}
                preSelectedIds={preSelectedIdsForModal} 
            />
            <div className="faturaPage">
                <Container >
                    {cliente && (
                        <div className="cliente-header">
                            <h1>{cliente.nome}</h1>
                            <p className="cliente-doc">Documento: {cliente.documento}</p>
                            <p className='cliente-end'>Endereço: {cliente.endereco_cobranca}</p>
                        </div>
                    )}

                    <div className="header-actions">
                        <h2>Histórico de Faturas</h2>
                        <button className="action-btn" onClick={() => setModalOpen(true)}>
                            + Gerar Nova Fatura
                        </button>
                    </div>

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
                                    <tr key={fatura.id}>
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
                                            <button className="pdf-btn" onClick={() => handleExportPDF(fatura.id)}>
                                                Exportar PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-data">Nenhuma fatura encontrada para este cliente.</p>
                    )}
                    <Link to={`/integrador/${cliente?.integrador_id || ''}`} className="back-link">&larr; Voltar para o Integrador</Link>
                </Container>
            </div>
        </>
    );
};

export default FaturasPage;