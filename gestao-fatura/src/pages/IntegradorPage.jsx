import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import Container from '../components/Container';
import './IntegradorPage.css';

const API_BASE_URL = 'http://localhost/faturas/api/';

const IntegradorPage = () => {
  const { integradorId } = useParams();
  const navigate = useNavigate();
  const { openFaturaModal } = useOutletContext();

  const [integrador, setIntegrador] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // MUDANÇA 1: A função de busca de dados agora é "memorizada" com useCallback
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [integradorRes, clientesRes] = await Promise.all([
        fetch(`${API_BASE_URL}get_integrador.php?id=${integradorId}`),
        fetch(`${API_BASE_URL}get_clientes_por_integrador.php?integrador_id=${integradorId}`)
      ]);

      if (!integradorRes.ok) throw new Error('Falha ao buscar dados do integrador.');
      const integradorData = await integradorRes.json();
      setIntegrador(integradorData);

      if (!clientesRes.ok) throw new Error('Falha ao buscar clientes.');
      const clientesData = await clientesRes.json();
      setClientes(clientesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [integradorId]); // A função só será recriada se o 'integradorId' mudar

  // MUDANÇA 2: O useEffect agora apenas chama a função memorizada
  useEffect(() => {
    fetchData();
  }, [fetchData]); // O efeito roda quando a função fetchData é (re)criada

  const handleGerarFaturaClick = (instalacaoId) => {
    openFaturaModal({
      integradorId: integradorId,
      instalacaoId: instalacaoId
    });
  };

  const handleRowClick = (clienteId, event) => {
    if (event.target.closest('button, a')) {
      return;
    }
    navigate(`/cliente/${clienteId}/faturas`);
  };

  if (loading) {
    return <Container><p>Carregando informações...</p></Container>;
  }

  if (error) {
    return <Container><p className="error-message">{error}</p></Container>;
  }

  return (
    <Container>
      <div className="integrador-header">
        <h1>{integrador.nome_do_integrador}</h1>
        <p className="contato">{integrador.numero_de_contato}</p>
      </div>

      <div className="clientes-section">
        <h2>Clientes Vinculados</h2>
        <ul className="clientes-lista-detalhe">
          {clientes.length === 0 ? (
            <li className="cliente-lista-vazia">Nenhum cliente cadastrado</li>
          ) : (
            clientes.map(cliente => (
              <li key={cliente.id} onClick={(e) => handleRowClick(cliente.cliente_id, e)}>
                <div className="cliente-dados">
                  <div className="cliente-nome">{cliente.nome}</div>
                  <small>UC: {cliente.codigo_uc}</small>
                </div>
                <div className="cliente-acoes">
                  <Link to={`/cliente/${cliente.cliente_id}/faturas`} className="action-btn ver-faturas-btn">
                    Ver Faturas
                  </Link>
                  <button className="action-btn" onClick={() => handleGerarFaturaClick(cliente.id)}>
                    Gerar Fatura
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      <Link to="/" className="back-link">&larr; Voltar ao Painel Principal</Link>
    </Container>
  );
};

export default IntegradorPage;