import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import Container from '../components/Container';
import './IntegradorPage.css';
import { FiEye, FiFilePlus } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/faturas/api/';

const IntegradorPage = () => {
  const { integradorId } = useParams();
  const navigate = useNavigate();
  const { openClienteModal, openFaturaModal } = useOutletContext();

  const [integrador, setIntegrador] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // CORREÇÃO: A lógica de busca de dados foi reestruturada e movida para dentro do useEffect.
  useEffect(() => {
    // A função de busca agora vive dentro do useEffect e não precisa de useCallback.
    const fetchData = async () => {
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
        
        // Agrupar clientes e contar instalações
        const clientesAgrupados = {};
        clientesData.forEach(item => {
          if (!clientesAgrupados[item.cliente_id]) {
            clientesAgrupados[item.cliente_id] = {
              cliente_id: item.cliente_id,
              nome: item.nome,
              quantidade_instalacoes: 0
            };
          }
          // Contar apenas se houver uma instalação (id não é null)
          if (item.id) {
            clientesAgrupados[item.cliente_id].quantidade_instalacoes++;
          }
        });
        
        setClientes(Object.values(clientesAgrupados));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [integradorId]); // O efeito agora depende apenas do 'integradorId', que é estável.

  const handleRowClick = (clienteId, event) => {
    if (event.target.closest('button, a')) {
      return;
    }
    navigate(`/cliente/${clienteId}`);
  };

  const handleGerarFaturaClick = (instalacaoId, e) => {
      e.stopPropagation();
      openFaturaModal({
          integradorId: integradorId,
          instalacaoId: instalacaoId
      });
  };

  if (loading) {
    return <Container><p>Carregando informações...</p></Container>;
  }

  if (error) {
    return <Container><p className="error-message">{error}</p></Container>;
  }

  // Adicionamos uma verificação para o caso de o integrador ainda não ter sido carregado
  if (!integrador) {
      return <Container><p>Integrador não encontrado.</p></Container>;
  }

  return (
    <Container>
      <Link to="/" className="back-link">&larr; Voltar </Link>
      <div className="integrador-header">
        <h1>{integrador.nome_do_integrador}</h1>
        <p className="contato">{integrador.numero_de_contato}</p>
      </div>

      <div className="clientes-section-header">
        <h2>Clientes Vinculados</h2>
        <button 
            className="action-btn" 
            onClick={() => openClienteModal({ integradorId: integradorId })}
        >
            + Cadastrar Cliente
        </button>
      </div>
      
      <ul className="clientes-lista-detalhe">
          {clientes.length === 0 ? (
            <li className="cliente-lista-vazia">Nenhum cliente cadastrado</li>
          ) : (
            clientes.map(cliente => (
              <li key={cliente.id} onClick={(e) => handleRowClick(cliente.cliente_id, e)}>
                <div className="cliente-dados">
                  <div className="cliente-nome">{cliente.nome}</div>
                  <small>{cliente.quantidade_instalacoes} {cliente.quantidade_instalacoes === 1 ? 'Instalação' : 'Instalações'}</small>
                </div>
                <div className="cliente-acoes">
                  <Link to={`/cliente/${cliente.cliente_id}`} className="second-action icon-btn ver-faturas-btn" title="Ver Instalações">
                    <FiEye /> Ver Instalações
                  </Link>
                  <button className="second-action icon-btn gerar-fatura-btn" onClick={(e) => handleGerarFaturaClick(cliente.id, e)} title="Gerar Fatura">
                    <FiFilePlus /> Gerar Fatura
                  </button>
                </div>
              </li>
            ))
          )}
      </ul>
      
    </Container>
  );
};

export default IntegradorPage;