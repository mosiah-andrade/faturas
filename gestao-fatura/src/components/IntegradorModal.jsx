import React from 'react';
import IntegradorForm from './IntegradorForm';
import './Modal.css';

const IntegradorModal = ({ isOpen, onClose, onCadastroSucesso }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>Cadastrar Novo Integrador</h2>
        <IntegradorForm onCadastroSucesso={onCadastroSucesso} />
      </div>
    </div>
  );
};

export default IntegradorModal;