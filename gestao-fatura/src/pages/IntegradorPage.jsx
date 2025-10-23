import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import Container from '../components/Container';
import './IntegradorPage.css';
// 1. Importar o novo ícone
import { FiEye, FiFilePlus, FiPlusSquare } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const IntegradorPage = () => {
  const { integradorId } = useParams();
  const navigate = useNavigate();
  // 2. Obter a nova função do contexto
  const { openClienteModal, openFaturaModal, openInstalacaoModal } = useOutletContext();

  const [integrador, setIntegrador] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);

  // A lógica de busca de dados (fetchData) está correta
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [integradorRes, clientesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/get_integrador.php?id=${integradorId}`),
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
    navigate(`/cliente/${clienteId}`);
  };

  const handleGerarFaturaClick = (instalacaoId, e) => {
      e.stopPropagation();
      openFaturaModal({
          integradorId: integradorId,
          instalacaoId: instalacaoId
          // Assumindo que seu Layout.jsx lidará com o 'onSave'
          // para recarregar os dados se necessário.
      });
  };

  // 3. Criar o handler para o novo botão
  const handleAddInstalacaoClick = (clienteId, e) => {
    e.stopPropagation(); // Impede o clique na linha
    openInstalacaoModal({
      clienteId: clienteId,
      integradorId: integradorId
      // Assumindo que seu Layout.jsx lidará com o 'onSave'
      // para recarregar os dados se necessário.
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
          
          <button onClick={() => setIsModalOpen(true)} className="btn-novo">
                                  + Criar Instalação
                              </button>
          <button 
              className="action-btn" 
              onClick={() => openClienteModal({ 
                integradorId: integradorId 
                // Assumindo que seu Layout.jsx lidará com o 'onSave'
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
              // A 'key' é o ID da instalação (cliente.id), o que está correto
              <li key={cliente.id} onClick={(e) => handleRowClick(cliente.cliente_id, e)}>
                <div className="cliente-dados">
                  <div className="cliente-nome">{cliente.nome}</div>
                  <small>UC: {cliente.codigo_uc}</small>
                </div>
                <div className="cliente-acoes">
                  <Link to={`/cliente/${cliente.cliente_id}/faturas`} className=" icon-btn ver-faturas-btn" title="Ver Faturas">
                    <FiEye />
                  </Link>
                  <button className=" icon-btn gerar-fatura-btn" onClick={(e) => handleGerarFaturaClick(cliente.id, e)} title="Gerar Fatura">
                    <FiFilePlus />
                  </button>

                  {/* 4. Adicionar o novo botão de "Adicionar Instalação" */}
                  <button 
                    className=" icon-btn add-instalacao-btn" 
                    onClick={(e) => handleAddInstalacaoClick(cliente.cliente_id, e)} 
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