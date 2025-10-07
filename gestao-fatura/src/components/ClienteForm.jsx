import React, { useState } from 'react';
import './Form.css'; // Reutilizando o mesmo CSS do formulário de integrador

// Defina a URL base da sua API aqui
const API_BASE_URL = 'http://localhost/faturas/api/';

const ClienteForm = ({ integradores }) => {
  // Estado para cada campo do formulário
  const [formData, setFormData] = useState({
    integrador_id: '',
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    endereco_instalacao: '',
    codigo_uc: ''
  });

  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  const [enviando, setEnviando] = useState(false);

  // Função para atualizar o estado quando um campo muda
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        throw new Error(result.message || 'Ocorreu um erro ao cadastrar o cliente.');
      }

      setMensagem({ texto: result.message, tipo: 'success' });
      // Limpa o formulário após o sucesso
      setFormData({
        integrador_id: '', nome: '', documento: '', email: '',
        telefone: '', endereco_instalacao: '', codigo_uc: ''
      });

    } catch (error) {
      setMensagem({ texto: error.message, tipo: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="integrador_id">Selecione o Integrador Responsável:</label>
        <select id="integrador_id" value={formData.integrador_id} onChange={handleChange} required>
          <option value="">-- Selecione um integrador --</option>
          {integradores.map(integrador => (
            <option key={integrador.id} value={integrador.id}>
              {integrador.nome_do_integrador}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group"><label htmlFor="nome">Nome Completo do Cliente:</label><input type="text" id="nome" value={formData.nome} onChange={handleChange} required /></div>
        <div className="form-group"><label htmlFor="documento">CPF/CNPJ:</label><input type="text" id="documento" value={formData.documento} onChange={handleChange} required /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label htmlFor="email">Email:</label><input type="email" id="email" value={formData.email} onChange={handleChange} required /></div>
        <div className="form-group"><label htmlFor="telefone">Telefone (Opcional):</label><input type="text" id="telefone" value={formData.telefone} onChange={handleChange} /></div>
      </div>
      <div className="form-group"><label htmlFor="endereco_instalacao">Endereço da Instalação:</label><input type="text" id="endereco_instalacao" value={formData.endereco_instalacao} onChange={handleChange} required /></div>
      <div className="form-group"><label htmlFor="codigo_uc">Código da Unidade Consumidora (UC):</label><input type="text" id="codigo_uc" value={formData.codigo_uc} onChange={handleChange} required /></div>
      
      <button type="submit" className="btn-orange" disabled={enviando}>
        {enviando ? 'Enviando...' : 'Cadastrar Cliente'}
      </button>

      {mensagem.texto && (
        <div className={`message ${mensagem.tipo}`}>
          {mensagem.texto}
        </div>
      )}
    </form>
  );
};

export default ClienteForm;