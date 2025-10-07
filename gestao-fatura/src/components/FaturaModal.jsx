import React, { useState, useEffect } from 'react'; // Linha corrigida
import './Modal.css';
import './Form.css';

const API_BASE_URL = 'http://localhost/faturas/api/';

const FaturaModal = ({ isOpen, onClose, onFaturaGerada }) => {
  // Estados para o fluxo de seleção
  const [integradores, setIntegradores] = useState([]);
  const [selectedIntegrador, setSelectedIntegrador] = useState('');
  
  const [instalacoes, setInstalacoes] = useState([]);
  const [loadingInstalacoes, setLoadingInstalacoes] = useState(false);

  // Estado para o formulário
  const [formData, setFormData] = useState({
    instalacao_id: '',
    valor_total: '',
    data_vencimento: '',
    mes_referencia: '',
    consumo_kwh: '',
    injecao_kwh: '',
  });

  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  const [enviando, setEnviando] = useState(false);

  // Efeito 1: Busca a lista de integradores quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      // Reseta os estados ao abrir
      setSelectedIntegrador('');
      setInstalacoes([]);
      setFormData({
        instalacao_id: '', valor_total: '', data_vencimento: '',
        mes_referencia: '', consumo_kwh: '', injecao_kwh: ''
      });
      setMensagem({ texto: '', tipo: '' });

      const fetchIntegradores = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}listar_integradores.php`);
          const data = await response.json();
          if (response.ok) {
            setIntegradores(data);
          }
        } catch (error) {
          setMensagem({ texto: 'Erro ao carregar integradores.', tipo: 'error' });
        }
      };
      fetchIntegradores();
    }
  }, [isOpen]);

  // Efeito 2: Busca os clientes/instalações quando um integrador é selecionado
  useEffect(() => {
    if (selectedIntegrador) {
      setLoadingInstalacoes(true);
      const fetchInstalacoesDoIntegrador = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}get_clientes_por_integrador.php?integrador_id=${selectedIntegrador}`);
          const data = await response.json();
          if (response.ok) {
            setInstalacoes(data);
          } else {
            setInstalacoes([]);
          }
        } catch (error) {
          setInstalacoes([]);
        } finally {
          setLoadingInstalacoes(false);
        }
      };
      fetchInstalacoesDoIntegrador();
    } else {
      setInstalacoes([]);
    }
  }, [selectedIntegrador]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensagem({ texto: '', tipo: '' });
    try {
      const response = await fetch(`${API_BASE_URL}gerar_fatura.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      setMensagem({ texto: result.message, tipo: 'success' });
      
      setTimeout(() => {
        if (onFaturaGerada) onFaturaGerada();
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
        <h2>Lançar Nova Fatura</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="integrador-select">1. Selecione o Integrador:</label>
            <select id="integrador-select" value={selectedIntegrador} onChange={(e) => setSelectedIntegrador(e.target.value)} required>
              <option value="">-- Selecione --</option>
              {integradores.map(integrador => (
                <option key={integrador.id} value={integrador.id}>
                  {integrador.nome_do_integrador}
                </option>
              ))}
            </select>
          </div>

          {selectedIntegrador && (
            <div className="form-group">
              <label htmlFor="instalacao_id">2. Selecione o Cliente / Instalação:</label>
              <select id="instalacao_id" value={formData.instalacao_id} onChange={handleChange} required disabled={loadingInstalacoes}>
                <option value="">{loadingInstalacoes ? 'Carregando...' : '-- Selecione --'}</option>
                {instalacoes.map(inst => (
                  <option key={inst.instalacao_id} value={inst.instalacao_id}>
                    {inst.nome} - UC: {inst.codigo_uc}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.instalacao_id && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="valor_total">Valor da Fatura (R$):</label>
                  <input type="number" step="0.01" id="valor_total" value={formData.valor_total} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="data_vencimento">Vencimento:</label>
                  <input type="date" id="data_vencimento" value={formData.data_vencimento} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="mes_referencia">Mês de Referência:</label>
                <input type="month" id="mes_referencia" value={formData.mes_referencia} onChange={handleChange} required />
              </div>
              <fieldset className="optional-fields">
                <legend>Dados de Leitura (Opcional)</legend>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="consumo_kwh">Consumo (kWh):</label><input type="number" step="0.01" id="consumo_kwh" value={formData.consumo_kwh} onChange={handleChange} /></div>
                  <div className="form-group"><label htmlFor="injecao_kwh">Injeção (kWh):</label><input type="number" step="0.01" id="injecao_kwh" value={formData.injecao_kwh} onChange={handleChange} /></div>
                </div>
              </fieldset>
              <button type="submit" className="btn-blue" disabled={enviando}>
                {enviando ? 'Processando...' : 'Gerar Fatura'}
              </button>
              {mensagem.texto && <div className={`message ${mensagem.tipo}`}>{mensagem.texto}</div>}
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default FaturaModal;''