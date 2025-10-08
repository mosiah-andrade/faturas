import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Container from '../components/Container';
import FaturaModal from '../components/FaturaModal'; // Reutilizaremos o modal de fatura
import './IntegradorPage.css'; // Estilos específicos para esta página

const API_BASE_URL = 'http://localhost/faturas/api/';

const IntegradorPage = () => {
  // Pega o 'integradorId' da URL (ex: /integrador/123)
  const { integradorId } = useParams();

  const [integrador, setIntegrador] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para o modal
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ instalacaoId: null, clienteNome: '' });
  const [preSelectedData, setPreSelectedData] = useState({});


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Busca os dados do integrador e dos clientes em paralelo
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
    };

    fetchData();
  }, [integradorId]); // Executa sempre que o ID na URL mudar

   const handleOpenModal = (instalacaoId) => {
    setPreSelectedData({
      integradorId: integradorId, // ID do integrador da página atual
      instalacaoId: instalacaoId  // ID da instalação do cliente clicado
    });
    setModalOpen(true);
  };

  if (loading) {
    return <Container><p>Carregando informações...</p></Container>;
  }

  if (error) {
    return <Container><p className="error-message">{error}</p></Container>;
  }

  return (
    <>
      {/* O modal de fatura para esta página */}
       <FaturaModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        preSelectedIds={preSelectedData} // Passa os IDs para o modal
      />

      <Container>
        <div className="integrador-header">
          <h1>{integrador.nome_do_integrador}</h1>
          <p className="contato">{integrador.numero_de_contato}</p>
        </div>

        <div className="clientes-section">
          <h2>Clientes Vinculados</h2>

          <ul className="clientes-lista-detalhe">
            {/* Verifica se o array 'clientes' está vazio */}
            {clientes.length === 0 ? (
              // Se estiver vazio, renderiza este <li>
              <li className="cliente-lista-vazia">Nenhum cliente cadastrado</li>
            ) : (
              // Se não estiver vazio, mapeia e renderiza a lista de clientes
              clientes.map(cliente => (
                <li key={cliente.id}> {/* Alterado de cliente.instalacao_id para cliente.id */}
                  <div className="cliente-dados">
                    <div className="cliente-nome">{cliente.nome}</div>
                    <small>UC: {cliente.codigo_uc}</small>
                  </div>
                  <div className="cliente-acoes">
                    <Link to={`/cliente/${cliente.cliente_id}/faturas`} className="action-btn ver-faturas-btn">
                      Ver Faturas
                    </Link>
                    <button className="action-btn" onClick={() => handleOpenModal(cliente.id)}> {/* Alterado de cliente.instalacao_id para cliente.id */}
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
    </>
  );
};

export default IntegradorPage;