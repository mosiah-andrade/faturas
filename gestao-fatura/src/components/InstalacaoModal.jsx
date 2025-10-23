// faturas/gestao-fatura/src/components/InstalacaoModal.jsx

import React from 'react';
import InstalacaoForm from './InstalacaoForm'; 
import './Modal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * --- CORREÇÃO AQUI ---
 * Agora o modal lê AMBOS os IDs de dentro do objeto `preSelectedIds`.
 * A prop `clienteId` separada ainda é mantida para compatibilidade
 * com outras páginas (como a ClienteInstalacoesPage).
 */
const InstalacaoModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    preSelectedIds = {}, // Objeto vindo do Layout
    clienteId = null      // ID avulso (para outras páginas)
}) => {
    if (!isOpen) return null;

    // 1. Prepara o objeto initialData
    // O InstalacaoForm já sabe lidar com 'clienteId' ou 'cliente_id'
    const initialData = {
        // Prioriza o ID vindo da página do Cliente,
        // senão, busca de dentro do preSelectedIds
        cliente_id: clienteId || preSelectedIds.clienteId, 
        
        // Busca o ID do integrador de dentro do preSelectedIds
        integrador_id: preSelectedIds.integradorId 
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