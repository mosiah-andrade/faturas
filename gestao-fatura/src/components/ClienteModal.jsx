import React from 'react';
import ClienteForm from './ClienteForm';
import './Modal.css';

const ClienteModal = ({ isOpen, onClose, integradores }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>Cadastrar Novo Cliente</h2>
        <ClienteForm integradores={integradores} />
      </div>
    </div>
  );
};

export default ClienteModal;