import React, { useState, useEffect } from 'react';
import './Form.css';

const API_BASE_URL = 'http://localhost/faturas/api/';

const IntegradorForm = ({ onCadastroSucesso, initialName = '' }) => {
  // O estado 'nome' agora começa com o valor de initialName
  const [nome, setNome] = useState(initialName);
  const [contato, setContato] = useState('');
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  const [enviando, setEnviando] = useState(false);

  // Efeito para atualizar o nome se o modal for reaberto com um novo nome
  useEffect(() => {
    setNome(initialName);
  }, [initialName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensagem({ texto: '', tipo: '' });

    try {
      const response = await fetch(`${API_BASE_URL}integrador.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_do_integrador: nome,
          numero_de_contato: contato
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Ocorreu um erro ao cadastrar.');
      }

      setMensagem({ texto: result.message, tipo: 'success' });
      setNome('');
      setContato('');
      
      if (onCadastroSucesso) {
        onCadastroSucesso();
      }

    } catch (error) {
      setMensagem({ texto: error.message, tipo: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="nome_do_integrador">Nome Completo:</label>
          <input 
            type="text" 
            id="nome_do_integrador" 
            value={nome} 
            onChange={(e) => setNome(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="numero_de_contato">Telefone:</label>
          <input 
            type="text" 
            id="numero_de_contato" 
            value={contato} 
            onChange={(e) => setContato(e.target.value)} 
            required 
          />
        </div>
      </div>
      <button type="submit" className="btn-orange" disabled={enviando}>
        {enviando ? 'Enviando...' : 'Cadastrar Integrador'}
      </button>
      {mensagem.texto && (
        <div className={`message ${mensagem.tipo}`}>
          {mensagem.texto}
        </div>
      )}
    </form>
  );
};

export default IntegradorForm;