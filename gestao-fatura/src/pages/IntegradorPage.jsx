import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import Container from '../components/Container';
import './IntegradorPage.css';
// 1. Remover FiFilePlus (Gerar Fatura), pois não se aplica mais a esta lista
import { FiEye, FiPlusSquare } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const IntegradorPage = () => {
  const { integradorId } = useParams();
  const navigate = useNavigate();
  // Manter openClienteModal e openInstalacaoModal
  const { openFaturaModal, openClienteModal, openInstalacaoModal } = useOutletContext();

  const [integrador, setIntegrador] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [integradorRes, clientesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/get_integrador.php?id=${integradorId}`),
          // Este endpoint agora retorna a lista de clientes ÚNICA
          fetch(`${API_BASE_URL}/get_clientes_por_integrador.php?integrador_id=${integradorId}`)
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
    };

    fetchData();
  }, [integradorId]); // O efeito agora depende apenas do 'integradorId'

  const handleRowClick = (clienteId, event) => {
    if (event.target.closest('button, a')) {
      return;
    }
    // Navega para a página de detalhes/instalações do cliente
    navigate(`/cliente/${clienteId}`);
  };

  // 2. REMOVIDO: handleGerarFaturaClick.
  //    Não faz sentido gerar uma fatura (que é de UMA instalação)
  //    a partir de uma lista de clientes (que têm MÚLTIPLAS instalações).
  //    Este botão deve ficar na página de detalhes do cliente.

  const handleAddInstalacaoClick = (clienteId, e) => {
    e.stopPropagation(); 
    openInstalacaoModal({
      clienteId: clienteId,
      integradorId: integradorId
    });
  };

  if (loading) {
    return <Container><p>Carregando informações...</p></Container>;
  }

  if (error) {
    return <Container><p className="error-message">{error}</p></Container>;
  }

  if (!integrador) {
      return <Container><p>Integrador não encontrado.</p></Container>;
  }

  return (
    <Container>
      <div className="integrador-header">
        <h1>{integrador.nome_do_integrador}</h1>
        <p className="contato">{integrador.numero_de_contato}</p>
      </div>

      <div className="clientes-section-header">
        <h2>Clientes Vinculados</h2>
        <div>
          <button 
              className="action-btn" 
              onClick={() => openClienteModal({ 
                integradorId: integradorId 
              })}
          >
              + Cadastrar Cliente
          </button>
        </div>
      </div>
      
      <ul className="clientes-lista-detalhe">
          {clientes.length === 0 ? (
            <li className="cliente-lista-vazia">Nenhum cliente cadastrado</li>
          ) : (
            clientes.map(cliente => (
              // 3. A 'key' agora é o 'cliente_id' (que é único)
              <li key={cliente.cliente_id} onClick={(e) => handleRowClick(cliente.cliente_id, e)}>
                <div className="cliente-dados">
                  <div className="cliente-nome">{cliente.nome}</div>
                  {/* 4. Exibir o total de instalações */}
                  <small>
                    {cliente.total_instalacoes} 
                    {cliente.total_instalacoes === 1 ? ' instalação' : ' instalações'}
                  </small>
                </div>
                <div className="cliente-acoes">
                  {/* 5. Link para ver detalhes do cliente (faturas, instalações, etc.) */}
                  <Link to={`/cliente/${cliente.cliente_id}`} className=" icon-btn ver-faturas-btn" title="Ver Detalhes do Cliente">
                    <FiEye />
                  </Link>

                  {/* 6. REMOVIDO: Botão Gerar Fatura (FiFilePlus) */}

                  {/* 7. Botão Adicionar Instalação (Correto) */}
                  <button 
                    className=" icon-btn add-instalacao-btn" 
                    onClick={() => openInstalacaoModal({ preSelectedIds: { integradorId: integradorId, clienteId: cliente.cliente_id } })}
                    title="Adicionar Nova Instalação">
                    <FiPlusSquare />
                  </button>

                </div>
              </li>
            ))
          )}
      </ul>
      
      <Link to="/" className="back-link">&larr; Voltar ao Painel Principal</Link>
    </Container>
  );
};

export default IntegradorPage;