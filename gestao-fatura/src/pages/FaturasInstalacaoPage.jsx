import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import Container from '../components/Container';
import './FaturasPage.css'; // Certifique-se de adicionar o CSS abaixo neste arquivo
import { FiDownload, FiEye } from 'react-icons/fi';
import logoImg from '../assets/homolog.png';
import pixImg from '../assets/pix.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/faturas/api/';

const FaturasInstalacaoPage = () => {
  const { clienteId, instalacaoId } = useParams();
  const { openFaturaModal } = useOutletContext() || {};

  const [instalacao, setInstalacao] = useState(null);
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Função para buscar dados
  const fetchData = async () => {
    setLoading(true);
    try {
      const [instRes, fatRes] = await Promise.all([
        fetch(`${API_BASE_URL}get_detalhes_instalacao.php?instalacao_id=${instalacaoId}`),
        fetch(`${API_BASE_URL}get_faturas_por_instalacao.php?instalacao_id=${instalacaoId}`)
      ]);

      if (!instRes.ok) throw new Error('Erro ao carregar instalação');
      const instData = await instRes.json();
      setInstalacao(instData);

      if (!fatRes.ok) throw new Error('Erro ao carregar faturas');
      const fatData = await fatRes.json();
      setFaturas(Array.isArray(fatData) ? fatData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instalacaoId) fetchData();
  }, [instalacaoId]);

  // --- NOVA FUNÇÃO: Alterar Status ---
  const handleStatusChange = async (faturaId, newStatus) => {
    // 1. Atualização Otimista (Muda na tela antes de confirmar no banco para ser rápido)
    const oldFaturas = [...faturas];
    setFaturas(prev => prev.map(f => f.id === faturaId ? { ...f, status: newStatus } : f));

    try {
      const response = await fetch(`${API_BASE_URL}atualizar_status_fatura.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: faturaId, status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status');
      }
      // Sucesso silencioso (já atualizamos a tela)
    } catch (error) {
      alert("Erro ao atualizar status: " + error.message);
      setFaturas(oldFaturas); // Reverte em caso de erro
    }
  };

  const formatCurrency = (v) => v != null ? parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';
  const formatPercent = (v) => v != null ? `${parseInt(v)}%` : '0%';

  // ... (Mantenha a função handleExportPDF igualzinha estava) ...
  const handleExportPDF = async (faturaId) => {
    try {
      const response = await fetch(`${API_BASE_URL}get_detalhes_fatura.php?fatura_id=${faturaId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      const fatura = data.fatura;
      const doc = new jsPDF();
      const page_width = doc.internal.pageSize.getWidth();
      const margin = 14;

      const formatMonthYearFull = (d) => d ? new Date(d).toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
      const formatVencimentoMonth = (d) => d ? new Date(d).toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' }).toUpperCase() : '';
      
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
      doc.setLineWidth(0.5);
      doc.line(margin, 42, page_width - margin, 42);

      doc.setFontSize(9);
      const leftColX = margin;
      const rightColX = page_width / 2;

      doc.setFont(undefined, 'bold'); doc.text("CLIENTE:", leftColX, 50);
      doc.setFont(undefined, 'normal'); doc.text(fatura.cliente_nome, leftColX + 25, 50);
      doc.setFont(undefined, 'bold'); doc.text("ENDEREÇO:", leftColX, 56);
      doc.setFont(undefined, 'normal'); doc.text(fatura.endereco_instalacao, leftColX + 25, 56);

      doc.setFont(undefined, 'bold'); doc.text("CPF/CNPJ:", rightColX, 50);
      doc.setFont(undefined, 'normal'); doc.text(fatura.cliente_documento, rightColX + 25, 50);
      doc.setFont(undefined, 'bold'); doc.text("CÓD. UC:", rightColX, 56);
      doc.setFont(undefined, 'normal'); doc.text(fatura.codigo_uc, rightColX + 25, 56);

      doc.line(margin, 62, page_width - margin, 62);

      let currentY = 70;
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
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245] }, 1: { halign: 'right' } },
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
      doc.text("*Favor enviar o comprovante via whatsapp +55 81 8987-8175", page_width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  
      doc.save(`Fatura-${fatura.id}-${fatura.cliente_nome}.pdf`);
    } catch (error) {
      alert(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  const handleGerar = () => {
    if (openFaturaModal) openFaturaModal({ instalacaoId, clienteId });
  };

  if (loading) return <Container><p>Carregando...</p></Container>;
  if (error) return <Container><p className="error-text">{error}</p></Container>;
  if (!instalacao) return <Container><p>Instalação não encontrada.</p></Container>;

  return (
    <Container>
      <Link to={`/cliente/${clienteId}/faturas`} className="back-link">&larr; Voltar para Instalações</Link>
      
      <div style={{ marginBottom: 20 }}>
        <h2>UC: {instalacao.codigo_uc}</h2>
        <p>{instalacao.endereco_instalacao}</p>
      </div>

      <div style={{ marginBottom: 20 , display: 'flex',  justifyContent: 'right' }}>
        <button onClick={handleGerar} className="action-btn" >+ Gerar Nova Fatura</button>
      </div>

      {faturas.length === 0 ? (
        <div style={{ padding: 20, background: '#f8f9fa', borderRadius: 8 }}>Nenhuma fatura encontrada.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f1f1' }}>
              <th style={{ padding: 10 }}>Mês</th>
              <th style={{ padding: 10 }}>Vencimento</th>
              <th style={{ padding: 10 }}>Consumo/Valor</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {faturas.map(f => (
              <tr key={f.id} style={{textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: 10 }}>{new Date(f.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</td>
                <td style={{ padding: 10 }}>{f.data_vencimento ? new Date(f.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
                <td style={{ padding: 10 }}>
                    {f.consumo_kwh ? `${f.consumo_kwh} kWh` : `R$ ${parseFloat(f.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </td>
                
                {/* --- AQUI ESTÁ A MUDANÇA (SELECT DE STATUS) --- */}
                <td style={{ padding: 10 }}>
                    <select 
                        value={f.status_pagamento || f.status || 'Pendente'} // Tenta pegar o status, se não tiver, assume Pendente
                        onChange={(e) => handleStatusChange(f.id, e.target.value)}
                        className={`status-select status-${(f.status_pagamento || f.status || '').toLowerCase()}`}
                    >
                        <option value="Pendente">Pendente</option>
                        <option value="Paga">Paga</option>
                        <option value="Atrasada">Atrasada</option>
                    </select>
                </td>

                <td style={{ padding: 10 , display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button onClick={() => handleExportPDF(f.id)} style={{ marginRight: 8 }} title="Baixar" className='second-action'>
                    <FiDownload size={16} />
                  </button>
                  <Link to={`/fatura/${f.id}`} title="Ver detalhes" className='second-action'>
                    <FiEye />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Container>
  );
};

export default FaturasInstalacaoPage;