import React, { useState } from 'react';
import './Form.css';

const API_BASE_URL = 'http://localhost/faturas/api/';

const Stepper = ({ currentStep }) => {
    const steps = ["Dados do Cliente", "Dados da Instalação", "Dados do Contrato"];
    return (
        <div className="form-stepper">
            {steps.map((label, index) => (
                <div key={label} className={`step ${index + 1 === currentStep ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}>
                    <div className="step-indicator">{index + 1}</div>
                    <div className="step-label">{label}</div>
                </div>
            ))}
        </div>
    );
};

const ClienteForm = ({ integradores }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        integrador_id: '', nome: '', documento: '', telefone: '',
        endereco_instalacao: '', codigo_uc: '', tipo_de_ligacao: 'Monofásica',
        valor_tusd: '', valor_te: '', tipo_contrato: 'Monitoramento', tipo_instalacao: 'Beneficiária'
    });
    const [errors, setErrors] = useState({});
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    const [enviando, setEnviando] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevState => ({ ...prevState, [id]: value }));
        if (errors[id]) {
            setErrors(prevErrors => ({ ...prevErrors, [id]: '' }));
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

    const validateStep = () => {
        let newErrors = {};
        let isValid = true;
        const fieldsToValidate = {
            1: ['integrador_id', 'nome', 'documento'],
            2: ['endereco_instalacao', 'codigo_uc', 'tipo_de_ligacao'],
            3: ['tipo_contrato', 'tipo_instalacao', 'valor_tusd', 'valor_te']
        };

        fieldsToValidate[step].forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep(prev => prev + 1);
        }
    };
    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep()) {
            return;
        }
        setEnviando(true);
        setMensagem({ texto: '', tipo: '' });

        try {
            const response = await fetch(`${API_BASE_URL}cadastrar_cliente.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Ocorreu um erro ao cadastrar.');
            }
            
            setMensagem({ texto: result.message, tipo: 'success' });
            setStep(1);
            setFormData({
                integrador_id: '', nome: '', documento: '', telefone: '',
                endereco_instalacao: '', codigo_uc: '', tipo_de_ligacao: 'Monofásica',
                valor_tusd: '', valor_te: '', tipo_contrato: 'Monitoramento', tipo_instalacao: 'Beneficiária'
            });

        } catch (error) {
            // CORREÇÃO: Bloco catch agora está sintaticamente correto
            setMensagem({ texto: error.message, tipo: 'error' });
        } finally {
            // Este bloco agora será executado sempre, mesmo em caso de erro
            setEnviando(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <fieldset className="form-section">
                        <legend>Passo 1: Dados do Cliente</legend>
                        <div className="form-group">
                          <label htmlFor="integrador_id">Integrador Responsável:</label>
                          <select id="integrador_id" value={formData.integrador_id} onChange={handleChange} onBlur={handleBlur} className={errors.integrador_id ? 'error-input' : ''} required>
                            <option value="">-- Selecione --</option>
                            {Array.isArray(integradores) && integradores.map(integrador => (
                              <option key={integrador.id} value={integrador.id}>{integrador.nome_do_integrador}</option>
                            ))}
                          </select>
                          <div className="error-text">{errors.integrador_id}</div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                              <label htmlFor="nome">Nome Completo:</label>
                              <input type="text" id="nome" value={formData.nome} onChange={handleChange} onBlur={handleBlur} className={errors.nome ? 'error-input' : ''} required />
                              <div className="error-text">{errors.nome}</div>
                          </div>
                          <div className="form-group">
                              <label htmlFor="documento">CPF/CNPJ:</label>
                              <input type="text" id="documento" value={formData.documento} onChange={handleChange} onBlur={handleBlur} className={errors.documento ? 'error-input' : ''} required />
                              <div className="error-text">{errors.documento}</div>
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="telefone">Telefone (Opcional):</label>
                          <input type="text" id="telefone" value={formData.telefone} onChange={handleChange} />
                          <div className="error-text"></div>
                        </div>
                    </fieldset>
                );
            case 2:
                return (
                    <fieldset className="form-section">
                        <legend>Passo 2: Dados da Instalação</legend>
                        <div className="form-group">
                            <label htmlFor="endereco_instalacao">Endereço da Instalação:</label>
                            <input type="text" id="endereco_instalacao" value={formData.endereco_instalacao} onChange={handleChange} onBlur={handleBlur} className={errors.endereco_instalacao ? 'error-input' : ''} required />
                            <div className="error-text">{errors.endereco_instalacao}</div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                              <label htmlFor="codigo_uc">Cód. Unidade Consumidora (UC):</label>
                              <input type="text" id="codigo_uc" value={formData.codigo_uc} onChange={handleChange} onBlur={handleBlur} className={errors.codigo_uc ? 'error-input' : ''} required />
                              <div className="error-text">{errors.codigo_uc}</div>
                          </div>
                          <div className="form-group">
                              <label htmlFor="tipo_de_ligacao">Tipo de Ligação:</label>
                              <select id="tipo_de_ligacao" value={formData.tipo_de_ligacao} onChange={handleChange} onBlur={handleBlur} className={errors.tipo_de_ligacao ? 'error-input' : ''} required>
                                <option value="Monofásica">Monofásica</option>
                                <option value="Bifásica">Bifásica</option>
                                <option value="Trifásica">Trifásica</option>
                              </select>
                              <div className="error-text">{errors.tipo_de_ligacao}</div>
                          </div>
                        </div>
                    </fieldset>
                );
            case 3:
                return (
                    <fieldset className="form-section">
                        <legend>Passo 3: Dados do Contrato</legend>
                        <div className="form-row">
                          <div className="form-group">
                              <label htmlFor="tipo_contrato">Tipo de Contrato:</label>
                              <select id="tipo_contrato" value={formData.tipo_contrato} onChange={handleChange} onBlur={handleBlur} className={errors.tipo_contrato ? 'error-input' : ''} required>
                                <option value="Monitoramento">Monitoramento</option>
                                <option value="Investimento">Investimento</option>
                              </select>
                              <div className="error-text">{errors.tipo_contrato}</div>
                          </div>
                          <div className="form-group">
                              <label htmlFor="tipo_instalacao">Tipo de Instalação:</label>
                              <select id="tipo_instalacao" value={formData.tipo_instalacao} onChange={handleChange} onBlur={handleBlur} className={errors.tipo_instalacao ? 'error-input' : ''} required>
                                <option value="Beneficiária">Beneficiária</option>
                                <option value="Geradora">Geradora</option>
                              </select>
                              <div className="error-text">{errors.tipo_instalacao}</div>
                          </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="valor_tusd">Valor TUSD (R$):</label>
                                <input type="number" step="0.000001" id="valor_tusd" value={formData.valor_tusd} onChange={handleChange} onBlur={handleBlur} className={errors.valor_tusd ? 'error-input' : ''} placeholder="Ex: 0.567890" required />
                                <div className="error-text">{errors.valor_tusd}</div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="valor_te">Valor TE (R$):</label>
                                <input type="number" step="0.000001" id="valor_te" value={formData.valor_te} onChange={handleChange} onBlur={handleBlur} className={errors.valor_te ? 'error-input' : ''} placeholder="Ex: 0.432109" required />
                                <div className="error-text">{errors.valor_te}</div>
                            </div>
                        </div>
                    </fieldset>
                );
            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <Stepper currentStep={step} />
            {mensagem.texto && !enviando && <div className={`message ${mensagem.tipo}`}>{mensagem.texto}</div>}
            {renderStep()}
            <div className="form-navigation">
                {step > 1 && (
                    <button type="button" className="btn-secondary" onClick={prevStep}>
                        Voltar
                    </button>
                )}
                {step < 3 && (
                    <button type="button" className="btn-blue" onClick={nextStep} style={{ marginLeft: 'auto' }}>
                        Avançar
                    </button>
                )}
                {step === 3 && (
                    <button type="submit" className="btn-orange" disabled={enviando} style={{ marginLeft: 'auto' }}>
                        {enviando ? 'Enviando...' : 'Cadastrar Cliente'}
                    </button>
                )}
            </div>
        </form>
    );
};

export default ClienteForm;