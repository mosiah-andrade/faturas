import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import Container from '../components/Container';
import './ClientePage.css'; // Importando o novo CSS
import { FiZap, FiFilePlus, FiMapPin, FiUser, FiPlus } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/faturas/api/';

const ClientePage = () => {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  
  const { openFaturaModal, openInstalacaoModal } = useOutletContext() || {};

  const [cliente, setCliente] = useState(null);
  const [instalacoes, setInstalacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [clienteRes, instalacoesRes] = await Promise.all([
          fetch(`${API_BASE_URL}get_cliente.php?id=${clienteId}`),
          fetch(`${API_BASE_URL}get_instalacoes_por_cliente.php?cliente_id=${clienteId}`)
        ]);

        if (!clienteRes.ok) throw new Error('Erro ao carregar dados do cliente.');
        const clienteData = await clienteRes.json();
        setCliente(clienteData);

        if (!instalacoesRes.ok) throw new Error('Erro ao carregar instalações.');
        const instalacoesData = await instalacoesRes.json();
        setInstalacoes(instalacoesData);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (clienteId) fetchData();
  }, [clienteId]);

  const handleGerarFatura = (instalacaoId) => {
    if (openFaturaModal) {
      openFaturaModal({ instalacaoId, clienteId });
    } else {
      alert("O modal de gerar fatura não foi configurado no layout principal.");
    }
  };

  const handleNovaInstalacao = () => {
    if (openInstalacaoModal) {
      openInstalacaoModal({ clienteId });
    } else {
      alert("O modal de nova instalação não foi configurado no layout principal.");
    }
  };

  const handleRowClick = (instalacaoId, event) => {
    if (event.target.closest('button, a')) return;
    navigate(`/cliente/${clienteId}/instalacao/${instalacaoId}/faturas`);
  };

  if (loading) return <Container><p>Carregando...</p></Container>;
  if (error) return <Container><p className="error-text">{error}</p></Container>;
  if (!cliente) return <Container><p>Cliente não encontrado.</p></Container>;

  return (
    <Container>
      <Link to={`/integrador/${cliente?.integrador_id}`} className="back-link">
        &larr; Voltar
      </Link>
      {/* --- CABEÇALHO DO CLIENTE --- */}
      <div className="cliente-header">
        <div className="cliente-header-content">
          
            <div className="cliente-icon-wrapper">
              <FiUser size={28} color="#ff9900" />
            </div>
            <div className="cliente-info">
              <h2>{cliente.nome}</h2>
              <div className="cliente-meta">
                <span><strong>Documento:</strong> {cliente.documento}</span>
                {cliente.telefone && <span><strong>Tel:</strong> {cliente.telefone}</span>}
              </div>
            </div>
        </div>
      </div>

      {/* --- TÍTULO E BOTÃO "NOVA INSTALAÇÃO" --- */}
      <div className="installations-section-header">
        <h3>Instalações (UCs)</h3>
        <button onClick={handleNovaInstalacao} className="action-btn">
            <FiPlus size={18} /> Nova Instalação
        </button>
      </div>

      {/* --- LISTA DE INSTALAÇÕES --- */}
      {instalacoes.length === 0 ? (
        <div className="empty-state">
            <p>Nenhuma instalação cadastrada para este cliente.</p>
            <button onClick={handleNovaInstalacao} className="btn-link-action">
              Cadastrar a primeira agora
            </button>
        </div>
      ) : (
        <ul className="installations-list">
          {instalacoes.map(inst => (
            <li
              key={inst.id}
              onClick={(e) => handleRowClick(inst.id, e)}
              className="installation-card"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRowClick(inst.id, e); }}
            >
              
              {/* Informações da Instalação */}
              <div className="installation-info">
                <div className="uc-header">
                    <FiZap color="#ff9900" fill="#ff9900" /> UC: {inst.codigo_uc}
                </div>
                
                <div className="address-row">
                    <FiMapPin color="#6c757d" /> {inst.endereco_instalacao}
                </div>
                
                <div className="badges-container">
                    <span className="badge badge-ligacao">
                        {inst.tipo_de_ligacao}
                    </span>
                    <span className="badge badge-tipo">
                        {inst.tipo_instalacao}
                    </span>
                    <span className="badge badge-regra">
                        {inst.regra_faturamento || 'Padrão'}
                    </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="card-actions">
                  <button
                    onClick={() => navigate(`/cliente/${clienteId}/instalacao/${inst.id}/faturas`)}
                    className="second-action btn-secondary"
                  >
                    Ver Faturas
                  </button>

                  <button 
                    onClick={() => handleGerarFatura(inst.id)}
                    className="second-action"
                  >
                    <FiFilePlus size={18} /> Gerar Fatura
                  </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      
    </Container>
  );
};

export default ClientePage;