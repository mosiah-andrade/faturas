import React, { useState } from 'react';
import './Form.css'; //

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/faturas/api/';

const ClienteForm = ({ integradores = [], preSelectedIds = {} }) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Estado apenas com dados do CLIENTE
  const [formData, setFormData] = useState({
    integrador_id: preSelectedIds.integradorId || '',
    nome: '',
    documento: '',
    telefone: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    // Validação básica
    if (!formData.integrador_id || !formData.nome || !formData.documento) {
      setFeedback({ type: 'error', message: 'Preencha Integrador, Nome e CPF/CNPJ.' });
      return;
    }

    setLoading(true);
    setFeedback({ type: 'info', message: 'Salvando cliente...' });

    try {
      const response = await fetch(`${API_BASE_URL}cadastrar_cliente.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao cadastrar cliente.');
      }

      // Sucesso
      setFeedback({ 
        type: 'success', 
        message: `Cliente cadastrado com sucesso! (ID: ${data.cliente_id})` 
      });

      // Limpar formulário (opcional)
      setFormData({
        integrador_id: '',
        nome: '',
        documento: '',
        telefone: ''
      });

      // Opcional: Se quiser recarregar a página após um tempo
      // setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="fade-in">
      
      {/* Exibição de Mensagens (Erro/Sucesso) */}
      {feedback.message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '6px',
          color: '#fff',
          fontWeight: '500',
          textAlign: 'center',
          backgroundColor: feedback.type === 'error' ? '#dc3545' : // Vermelho
                           feedback.type === 'success' ? '#28a745' : // Verde
                           '#17a2b8' // Azul (Info)
        }}>
          {feedback.message}
        </div>
      )}

      {/* --- CAMPOS DO FORMULÁRIO (Usando classes do Form.css) --- */}
      
      <div className="form-group"> {/* */}
        <label htmlFor="integrador_id">Integrador Responsável:</label>
        <select
          id="integrador_id"
          name="integrador_id"
          value={formData.integrador_id}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">Selecione...</option>
          {integradores.map((integ) => (
            <option key={integ.id} value={integ.id}>
              {integ.nome_do_integrador || integ.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row"> {/* */}
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="nome">Nome Completo:</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Ex: João da Silva"
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="documento">CPF/CNPJ:</label>
          <input
            type="text"
            id="documento"
            name="documento"
            value={formData.documento}
            onChange={handleChange}
            placeholder="Apenas números"
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="telefone">Telefone (Opcional):</label>
        <input
          type="text"
          id="telefone"
          name="telefone"
          value={formData.telefone}
          onChange={handleChange}
          placeholder="(00) 00000-0000"
          disabled={loading}
        />
      </div>

      {/* Botão de Envio */}
      <div style={{ marginTop: '25px' }}>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            backgroundColor: '#ff9900', /* Laranja do tema */
            opacity: loading ? 0.7 : 1 
          }}
        >
          {loading ? 'Salvando...' : 'Cadastrar Cliente'}
        </button>
      </div>

    </form>
  );
};

export default ClienteForm;