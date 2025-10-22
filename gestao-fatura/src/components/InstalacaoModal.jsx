// faturas/gestao-fatura/src/components/InstalacaoModal.jsx

import React from 'react';
import InstalacaoForm from './InstalacaoForm'; // O formulário que você enviou
import './Modal.css'; // (Ou o CSS que você usa para modais)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Este modal recebe as props da PÁGINA (ClienteInstalacoesPage)
 * e as formata para o FORMULÁRIO (InstalacaoForm).
 */
const InstalacaoModal = ({ isOpen, onClose, onSave, clienteId, integradorId }) => {
    if (!isOpen) return null;

    // 1. Prepara o objeto initialData que o seu formulário espera
    const initialData = {
        cliente_id: clienteId,     // ID vindo da página
        integrador_id: integradorId  // ID vindo da página
    };

    // 2. Cria a função de "salvar" que o formulário vai chamar
    // O formulário passa o (formData) e este modal faz a chamada API.
    const handleSave = async (formData) => {
        try {
            // (Você pode querer mover essa lógica de API para um arquivo 'apiService.js',
            // mas por enquanto, podemos deixar aqui)
            
            const res = await fetch(`${API_BASE_URL}/cadastrar_instalacao.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Erro ao salvar instalação');
            }
            
            // Se chegou aqui, foi sucesso!
            alert('Instalação cadastrada com sucesso!');
            onSave();  // Chama o `fetchData` da página para atualizar a lista
            onClose(); // Fecha o modal


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
                    initialData={initialData} // <--- Passa os IDs pré-definidos
                    onSave={handleSave}       // <--- Passa a função de API
                    onCancel={onClose}        // <--- Passa a função de fechar
                />

            </div>
        </div>
    );
};

export default InstalacaoModal;