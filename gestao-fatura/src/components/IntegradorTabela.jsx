import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// 1. Importar os ícones de seta
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import './IntegradorTabela.css';

const IntegradorTabela = ({ integradores, loading, onDelete, onSuggestNew }) => {
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nome_do_integrador', direction: 'ascending' });
  
  const navigate = useNavigate();

  const filteredAndSortedIntegradores = useMemo(() => {
    if (!integradores) return [];

    let filtered = integradores.filter(integrador =>
      integrador.nome_do_integrador.toLowerCase().includes(filter.toLowerCase()) ||
      integrador.numero_de_contato.includes(filter)
    );

    if (sortConfig.key !== null) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        let compareResult = 0;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          compareResult = aValue - bValue;
        } else {
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
          compareResult = aValue.localeCompare(bValue);
        }

        return sortConfig.direction === 'ascending' ? compareResult : -compareResult;
      });
    }

    return filtered;
  }, [integradores, filter, sortConfig]); 

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // 2. Função atualizada para retornar o componente do ícone
  const getSortArrow = (key) => {
    if (sortConfig.key !== key) {
      return null; // Sem ícone
    }
    // Retorna o componente do ícone com um pequeno ajuste de estilo
    const style = { marginLeft: '5px', verticalAlign: 'middle' };
    if (sortConfig.direction === 'ascending') {
      return <FiArrowUp style={style} />;
    } else {
      return <FiArrowDown style={style} />;
    }
  };

  const showSuggestion = filter.length > 0 && filteredAndSortedIntegradores.length === 0;

  const handleRowClick = (integradorId, event) => {
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
        {/* 3. Cabeçalhos renderizam o texto e o ícone (retornado pela função) */}
        <thead>
          <tr>
            <th onClick={() => requestSort('nome_do_integrador')} style={{ cursor: 'pointer' }}>
              Nome do Integrador
              {getSortArrow('nome_do_integrador')}
            </th>
            <th onClick={() => requestSort('numero_de_contato')} style={{ cursor: 'pointer' }}>
              Contato
              {getSortArrow('numero_de_contato')}
            </th>
            <th onClick={() => requestSort('total_clientes')} style={{ cursor: 'pointer' }}>
              Clientes Vinculados
              {getSortArrow('total_clientes')}
            </th>
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
          ) : filteredAndSortedIntegradores.length > 0 ? (
            filteredAndSortedIntegradores.map((integrador) => (
              <tr key={integrador.id} onClick={(e) => handleRowClick(integrador.id, e)}>
                <td>{integrador.nome_do_integrador}</td>
                <td>{integrador.numero_de_contato}</td>
                <td>{integrador.total_clientes}</td>
                <td>
                  <div className="actions">
                    <Link to={`/integrador/${integrador.id}`} className="btn-details btn-blue">
                      Detalhes
                    </Link>
                    <button className="btn-red" onClick={(e) => { e.stopPropagation(); onDelete(integrador.id); }}>
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