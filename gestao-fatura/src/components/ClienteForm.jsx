import React, { useState, useEffect } from 'react';
import './Form.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ClienteForm = ({ integradores, preSelectedIds = {} }) => {
    const [formData, setFormData] = useState({
        nome: '',
        documento: '',
        telefone: '',
    });

    // 1. Gerenciar o integradorId separadamente
    const [integradorId, setIntegradorId] = useState(preSelectedIds.integradorId || '');
    
    // 2. Atualizar o ID do integrador se a prop mudar
    useEffect(() => {
        setIntegradorId(preSelectedIds.integradorId || '');
    }, [preSelectedIds]);

    const [errors, setErrors] = useState({});
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    const [enviando, setEnviando] = useState(false);

    const handleChange = (e) => {
        const { id, name, value } = e.target;
        const fieldName = name || id;

        // 3. Tratar a mudança do integrador ou dos outros campos
        if (fieldName === 'integrador_id') {
            setIntegradorId(value);
            if (errors[fieldName]) {
                setErrors(prevErrors => ({ ...prevErrors, [fieldName]: '' }));
            }
        } else {
            setFormData(prevState => ({ ...prevState, [fieldName]: value }));
            if (errors[fieldName]) {
                setErrors(prevErrors => ({ ...prevErrors, [fieldName]: '' }));
            }
        }
    };

    const validateField = (name, value) => {
        if (!value || String(value).trim() === '') {
            // Mensagem específica para integrador
            if (name === 'integrador_id') {
                return 'É obrigatório selecionar um integrador.';
            }
            return 'Este campo é obrigatório.';
        }
        return '';
    };

    const handleBlur = (e) => {
        const { id, name, value } = e.target;
        const fieldName = name || id;
        
        // Não valida o select do integrador no blur
        if (fieldName === 'integrador_id') return;

        const error = validateField(fieldName, value);
        setErrors(prevErrors => ({ ...prevErrors, [fieldName]: error }));
    };

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
        
        // 4. Validar o integradorId (que está em state separado)
        //    Só valida se NÃO estiver pré-selecionado
        if (!preSelectedIds.integradorId) {
            const integradorError = validateField('integrador_id', integradorId);
            if (integradorError) {
                newErrors['integrador_id'] = integradorError;
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setEnviando(true);
        setMensagem({ texto: '', tipo: '' });

        // 5. Combinar formData e integradorId para o envio
        const dataToSend = {
            ...formData,
            integrador_id: integradorId 
        };

        try {
            const response = await fetch(`${API_BASE_URL}/cadastrar_cliente.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 6. Enviar os dados combinados
                body: JSON.stringify(dataToSend) 
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Ocorreu um erro ao cadastrar.');
            }
            
            setMensagem({ texto: result.message, tipo: 'success' });
            // Limpa o formulário
            setFormData({ nome: '', documento: '', telefone: '' });
            // Limpa o integrador SOMENTE SE não estiver pré-selecionado
            if (!preSelectedIds.integradorId) {
                setIntegradorId('');
            }

        } catch (error) {
            setMensagem({ texto: error.message, tipo: 'error' });
        } finally {
            setEnviando(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} noValidate>
            {mensagem.texto && !enviando && <div className={`message ${mensagem.tipo}`}>{mensagem.texto}</div>}
            
            <fieldset className="form-section">
                <legend>Dados do Cliente</legend>
                
                <div className="form-group">
                    <label htmlFor="integrador_id">Integrador:</label>
                    <select
                        id="integrador_id"
                        name="integrador_id"
                        value={integradorId}
                        // 7. Usar o handleChange universal
                        onChange={handleChange} 
                        // 8. Aplicar classe de erro
                        className={errors.integrador_id ? 'error-input' : ''} 
                        required
                        disabled={!!preSelectedIds.integradorId} 
                    >
                        <option value="">Selecione o integrador...</option>
                        {integradores.map(int => (
                            <option key={int.id} value={int.id}>
                                {int.nome_do_integrador || int.nome}
                            </option>
                        ))}
                    </select>
                    {/* 9. Exibir erro do integrador */}
                    <div className="error-text">{errors.integrador_id}</div>
                </div>

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

            <div className="form-navigation">
                <button type="submit" className="btn-orange" disabled={enviando} style={{ marginLeft: 'auto' }}>
                    {enviando ? 'Enviando...' : 'Cadastrar Cliente'}
                </button>
            </div>
        </form>
    );
};

export default ClienteForm;