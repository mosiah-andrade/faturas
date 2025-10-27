import React from 'react';
import InstalacaoForm from './InstalacaoForm'; 
import './Modal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ===================================================================
// CORREÇÃO 1: Adicione 'integradorId = null' às props que 
//             o modal aceita.
// ===================================================================
const InstalacaoModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    preSelectedIds = {}, 
    clienteId = null,
    integradorId = null // <--- ADICIONE ESTA LINHA
}) => {
    if (!isOpen) return null;

    // 1. Prepara o objeto initialData
    const initialData = {
        // Prioriza o ID do cliente vindo da página
        cliente_id: clienteId || preSelectedIds.clienteId, 
        
        // ===================================================================
        // CORREÇÃO 2: Use o 'integradorId' (se existir) ou
        //             busque do 'preSelectedIds'.
        // ===================================================================
        integrador_id: integradorId || preSelectedIds.integradorId // <--- ALTERE ESTA LINHA
    };

    // 2. Cria a função de "salvar" (Restante do arquivo está OK)
    const handleSave = async (formData) => {
        try {
            const res = await fetch(`${API_BASE_URL}cadastrar_instalacao.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Erro ao salvar instalação');
            }
            
            alert('Instalação cadastrada com sucesso!');
            onSave();  
            onClose(); 

        } catch (error) {
            console.error('Erro no handleSave do modal:', error);
            alert(`Erro: ${error.message}`);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={onClose} className="modal-close-btn">&times;</button>
                <h2>Cadastrar Nova Instalação</h2>
                
                <InstalacaoForm
                    initialData={initialData} // <--- Passa AMBOS os IDs pré-definidos
                    onSave={handleSave}       
                    onCancel={onClose}        
                />

            </div>
        </div>
    );
};

export default InstalacaoModal;