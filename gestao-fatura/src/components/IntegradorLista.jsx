import React from 'react';
import { Link } from 'react-router-dom'; // Importa o Link para navegação
import './IntegradorLista.css';

const IntegradorLista = ({ integradores, loading, onDelete }) => {
  if (loading) {
    return <p>Carregando integradores...</p>;
  }

  if (integradores.length === 0) {
    return <li>Nenhum integrador cadastrado.</li>;
  }

  return (
    <ul className="integradores-lista">
      {integradores.map((integrador) => (
        <li key={integrador.id}>
          <Link to={`/integrador/${integrador.id}`} className="integrador-info">
            <div className="nome">{integrador.nome_do_integrador}</div>
          </Link>
          <div className="actions">
            <button className="btn-red" onClick={() => onDelete(integrador.id)}>
              Excluir
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default IntegradorLista;