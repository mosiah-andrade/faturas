import React from 'react';
import ClienteForm from './ClienteForm';
import './Modal.css';

// 1. Receber 'preSelectedIds'
const ClienteModal = ({ isOpen, onClose, integradores, preSelectedIds }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>Cadastrar Novo Cliente</h2>
        {/* 2. Passar 'preSelectedIds' para o ClienteForm */}
        <ClienteForm 
            integradores={integradores} 
            preSelectedIds={preSelectedIds} 
        />
      </div>
    </div>
  );
};

export default ClienteModal;