import React, { useState, useEffect } from 'react';
import './Modal.css';
import './Form.css';

const API_BASE_URL = 'http://localhost/faturas/api/';

const InstalacaoModal = ({ isOpen, onClose, clienteId, onInstalacaoAdicionada }) => {
  const [integradores, setIntegradores] = useState([]);
  const [formData, setFormData] = useState({
    integrador_id: '',
    codigo_uc: '',
    endereco_instalacao: '',
  });
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Limpa o formulário e busca os integradores ao abrir o modal
      setFormData({ integrador_id: '', codigo_uc: '', endereco_instalacao: '' });
      setMensagem({ texto: '', tipo: '' });

      const fetchIntegradores = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}listar_integradores.php`);
          const data = await response.json();
          if (response.ok) {
            setIntegradores(data);
          }
        } catch (error) {
          console.error("Erro ao carregar integradores:", error);
        }
      };
      fetchIntegradores();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensagem({ texto: '', tipo: '' });

    const dataToSend = { ...formData, cliente_id: clienteId };

    try {
      const response = await fetch(`${API_BASE_URL}adicionar_instalacao.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      setMensagem({ texto: result.message, tipo: 'success' });
      
      setTimeout(() => {
        if (onInstalacaoAdicionada) {
          onInstalacaoAdicionada(); // Avisa a página pai para recarregar
        }
        onClose();
      }, 2000);

    } catch (error) {
      setMensagem({ texto: error.message, tipo: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>Adicionar Nova Instalação</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="integrador_id">Selecione o Integrador:</label>
            <select id="integrador_id" value={formData.integrador_id} onChange={handleChange} required>
              <option value="">-- Selecione --</option>
              {integradores.map(integrador => (
                <option key={integrador.id} value={integrador.id}>
                  {integrador.nome_do_integrador}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="codigo_uc">Código da Unidade Consumidora (UC):</label>
            <input type="text" id="codigo_uc" value={formData.codigo_uc} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="endereco_instalacao">Endereço da Instalação:</label>
            <input type="text" id="endereco_instalacao" value={formData.endereco_instalacao} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn-green" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar Instalação'}
          </button>
          {mensagem.texto && <div className={`message ${mensagem.tipo}`}>{mensagem.texto}</div>}
        </form>
      </div>
    </div>
  );
};

export default InstalacaoModal;