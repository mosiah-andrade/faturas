import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importe Link e useNavigate
import './IntegradorTabela.css';

const IntegradorTabela = ({ integradores, loading, onDelete, onSuggestNew }) => {
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const filteredIntegradores = useMemo(() => {
    if (!integradores) return [];
    return integradores.filter(integrador =>
      integrador.nome_do_integrador.toLowerCase().includes(filter.toLowerCase()) ||
      integrador.numero_de_contato.includes(filter)
    );
  }, [integradores, filter]);

  const showSuggestion = filter.length > 0 && filteredIntegradores.length === 0;

  // Função atualizada para lidar com o clique na linha
  const handleRowClick = (integradorId, event) => {
    // Impede a navegação se o clique foi em um botão ou em um link
    if (event.target.closest('button, a')) {
      return;
    }
    navigate(`/integrador/${integradorId}`);
  };

  if (loading) {
    return <p>Carregando integradores...</p>;
  }

  return (
    <div className="table-container">
      <input
        type="text"
        className="filter-input"
        placeholder="Filtrar por nome ou contato..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <table className="integradores-table">
        <thead>
          <tr>
            <th>Nome do Integrador</th>
            <th>Contato</th>
            <th>Clientes Vinculados</th>
            <th style={{ width: '180px' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {showSuggestion ? (
            <tr>
              <td colSpan="4" className="suggestion-cell">
                <span>"{filter}" não encontrado.</span>
                <button className="btn-suggest" onClick={() => onSuggestNew(filter)}>
                  Cadastrar novo integrador?
                </button>
              </td>
            </tr>
          ) : filteredIntegradores.length > 0 ? (
            filteredIntegradores.map((integrador) => (
              <tr key={integrador.id} onClick={(e) => handleRowClick(integrador.id, e)}>
                <td>{integrador.nome_do_integrador}</td>
                <td>{integrador.numero_de_contato}</td>
                <td>{integrador.client_count}</td>
                <td>
                  <div className="actions">
                    {/* Botão "Detalhes" re-adicionado */}
                    <Link to={`/integrador/${integrador.id}`} className="btn-details btn-blue">
                      Detalhes
                    </Link>
                    <button className="btn-red" onClick={() => onDelete(integrador.id)}>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>Nenhum integrador encontrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default IntegradorTabela;