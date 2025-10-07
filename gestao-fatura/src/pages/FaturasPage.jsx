import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Container from '../components/Container';
import FaturaModal from '../components/FaturaModal';
import './FaturasPage.css'; // Estilos específicos para esta página

// Bibliotecas para o PDF
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const API_BASE_URL = 'http://localhost/faturas/api/';

const FaturasPage = () => {
  const { clienteId } = useParams(); // Pega o ID do cliente da URL

  const [cliente, setCliente] = useState(null);
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);

  // Função para buscar os dados da página
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

  const handleStatusChange = async (faturaId, novoStatus) => {
    try {
        const response = await fetch(`${API_BASE_URL}atualizar_status_fatura.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fatura_id: faturaId, status: novoStatus })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        
        // Atualiza o status na lista localmente para refletir a mudança na UI
        setFaturas(faturas.map(f => f.id === faturaId ? { ...f, status: novoStatus } : f));
    } catch (error) {
        alert(`Erro ao atualizar status: ${error.message}`);
    }
  };

  const handleExportPDF = async (faturaId) => {
    // A lógica para exportar PDF que você já tem
    // (Pode ser transformada em um hook ou helper no futuro)
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
        onFaturaGerada={fetchData} // Recarrega os dados após gerar nova fatura
      />

      <Container>
        <div className="cliente-header">
          <h1>{cliente.nome}</h1>
          <p className="cliente-doc">Documento: {cliente.documento}</p>
        </div>

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
                  <td>{new Date(fatura.mes_referencia).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}</td>
                  <td>{new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}</td>
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
        <Link to={`/integrador/${cliente.integrador_id || ''}`} className="back-link">&larr; Voltar para o Integrador</Link>
      </Container>
    </>
  );
};

export default FaturasPage;