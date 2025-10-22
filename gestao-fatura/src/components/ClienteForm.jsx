import React, { useState } from 'react';
import './Form.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- REMOVIDO: Componente Stepper e RadioButtonGroup (não são mais necessários aqui) ---

const ClienteForm = ({ integradores, preSelectedIds = {} }) => {
    // --- MUDANÇA: Remoção do 'step' ---
    const [formData, setFormData] = useState({
        nome: '',
        documento: '',
        telefone: '',
        // --- REMOVIDO: Todos os outros campos (integrador_id, codigo_uc, etc.) ---
    });

    // --- REMOVIDO: useEffect ---
    
    const [errors, setErrors] = useState({});
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    const [enviando, setEnviando] = useState(false);

    const handleChange = (e) => {
        const { id, name, value } = e.target;
        const fieldName = name || id;
        setFormData(prevState => ({ ...prevState, [fieldName]: value }));
        if (errors[fieldName]) {
            setErrors(prevErrors => ({ ...prevErrors, [fieldName]: '' }));
        }
    };

    const validateField = (name, value) => {
        if (!value || String(value).trim() === '') {
            return 'Este campo é obrigatório.';
        }
        return '';
    };

    const handleBlur = (e) => {
        const { id, value } = e.target;
        const error = validateField(id, value);
        setErrors(prevErrors => ({ ...prevErrors, [id]: error }));
    };

    // --- MUDANÇA: Validação de 1 passo ---
    const validateForm = () => {
        let newErrors = {};
        let isValid = true;
        const fieldsToValidate = ['nome', 'documento'];

        fieldsToValidate.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    // --- REMOVIDO: nextStep, prevStep, handleEnderecoChange ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setEnviando(true);
        setMensagem({ texto: '', tipo: '' });

        try {
            // --- MUDANÇA: Chama o 'cadastrar_cliente.php' simplificado ---
            const response = await fetch(`${API_BASE_URL}/cadastrar_cliente.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Ocorreu um erro ao cadastrar.');
            }
            
            setMensagem({ texto: result.message, tipo: 'success' });
            // Limpa o formulário
            setFormData({ nome: '', documento: '', telefone: '' });
            
            // Você pode adicionar uma lógica para fechar o modal
            // ou redirecionar o usuário aqui.

        } catch (error) {
            setMensagem({ texto: error.message, tipo: 'error' });
        } finally {
            setEnviando(false);
        }
    };

    // --- MUDANÇA: renderStep() removido, formulário direto ---
    return (
        <form onSubmit={handleSubmit} noValidate>
            {/* --- REMOVIDO: Stepper --- */}
            {mensagem.texto && !enviando && <div className={`message ${mensagem.tipo}`}>{mensagem.texto}</div>}
            
            <fieldset className="form-section">
                <legend>Dados do Cliente</legend>
                
                {/* --- REMOVIDO: Campo Integrador --- */}

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="nome">Nome Completo:</label>
                        <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} onBlur={handleBlur} className={errors.nome ? 'error-input' : ''} required />
                        <div className="error-text">{errors.nome}</div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="documento">CPF/CNPJ:</label>
                        <input type="text" id="documento" name="documento" value={formData.documento} onChange={handleChange} onBlur={handleBlur} className={errors.documento ? 'error-input' : ''} required />
                        <div className="error-text">{errors.documento}</div>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="telefone">Telefone (Opcional):</label>
                    <input type="text" id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} />
                    <div className="error-text"></div>
                </div>
            </fieldset>

            {/* --- MUDANÇA: Botões de navegação simplificados --- */}
            <div className="form-navigation">
                <button type="submit" className="btn-orange" disabled={enviando} style={{ marginLeft: 'auto' }}>
                    {enviando ? 'Enviando...' : 'Cadastrar Cliente'}
                </button>
            </div>
        </form>
    );
};

export default ClienteForm;