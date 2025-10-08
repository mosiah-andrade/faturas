import React, { useState, useEffect } from 'react';
import './Modal.css';
import './Form.css';

const API_BASE_URL = 'http://localhost/faturas/api/';

const FaturaModal = ({ isOpen, onClose, onFaturaGerada, preSelectedIds = {} }) => {
 const [integradores, setIntegradores] = useState([]);
  const [selectedIntegrador, setSelectedIntegrador] = useState('');
  const [instalacoes, setInstalacoes] = useState([]);
  const [loadingInstalacoes, setLoadingInstalacoes] = useState(false);
  const [formData, setFormData] = useState({});
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  const [enviando, setEnviando] = useState(false);

  const { clienteId, integradorId, instalacaoId } = preSelectedIds;

   useEffect(() => {
    if (isOpen) {
      setMensagem({ texto: '', tipo: '' });
      setSelectedIntegrador(integradorId || '');
      setFormData({
        instalacao_id: instalacaoId || '',
        valor_total: '', data_vencimento: '', mes_referencia: '',
        consumo_kwh: '', injecao_kwh: ''
      });
    }
  }, [isOpen, integradorId, instalacaoId]);

  useEffect(() => {
    if (isOpen && !integradorId && !clienteId) {
      const fetchIntegradores = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}listar_integradores.php`);
          const data = await response.json();
          if (response.ok) setIntegradores(data);
        } catch (error) { console.error("Erro ao carregar integradores", error); }
      };
      fetchIntegradores();
    }
  }, [isOpen, integradorId, clienteId]);

  useEffect(() => {
    const fetchInstalacoes = async (url) => {
      setLoadingInstalacoes(true);
      setInstalacoes([]);
      try {
        const response = await fetch(url);
        const data = await response.json();
        setInstalacoes(response.ok ? data : []);
      } catch (error) {
        setInstalacoes([]);
      } finally {
        setLoadingInstalacoes(false);
      }
    };

    if (isOpen && clienteId) {
      fetchInstalacoes(`${API_BASE_URL}get_instalacoes_por_cliente.php?cliente_id=${clienteId}`);
    } else if (isOpen && selectedIntegrador) {
      fetchInstalacoes(`${API_BASE_URL}get_clientes_por_integrador.php?integrador_id=${selectedIntegrador}`);
    } else {
      setInstalacoes([]);
    }
  }, [isOpen, clienteId, selectedIntegrador]);


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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  // Determina se o resto do formulário deve ser exibido
  const showFormFields = formData.instalacao_id || (preSelectedIds.integradorId && preSelectedIds.instalacaoId);

  return (
     <div className="modal-overlay">
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>Lançar Nova Fatura</h2>
        <form onSubmit={handleSubmit}>

          {/* O seletor de integrador só aparece se NÃO for pré-selecionado E NÃO estiver na página do cliente */}
          {!preSelectedIds.integradorId && !preSelectedIds.clienteId && (
            <div className="form-group">
              <label htmlFor="integrador-select">1. Selecione o Integrador:</label>
              <select id="integrador-select" value={selectedIntegrador} onChange={(e) => setSelectedIntegrador(e.target.value)} required>
                <option value="">-- Selecione --</option>
                {integradores.map(integrador => ( <option key={integrador.id} value={integrador.id}>{integrador.nome_do_integrador}</option> ))}
              </select>
            </div>
          )}

          {/* O seletor de cliente/instalação aparece se um integrador for selecionado OU se estivermos na página do cliente, mas a instalação não for pré-selecionada */}
          {(selectedIntegrador || preSelectedIds.clienteId) && !preSelectedIds.instalacaoId && (
            <div className="form-group">
              <label htmlFor="instalacao_id">Selecione a Instalação:</label>
              <select id="instalacao_id" value={formData.instalacao_id} onChange={handleChange} required disabled={loadingInstalacoes}>
                <option value="">{loadingInstalacoes ? 'Carregando...' : '-- Selecione --'}</option>
                {instalacoes.map(inst => (
                  <option key={inst.instalacao_id || inst.id} value={inst.instalacao_id || inst.id}>
                    {/* Mostra o nome do cliente apenas se não estivermos no contexto de um cliente específico */}
                    {!preSelectedIds.clienteId && `${inst.nome} - `}UC: {inst.codigo_uc}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showFormFields && (
            <>
              {/* O resto do seu formulário... */}
              <div className="form-row">
                  <div className="form-group"><label htmlFor="valor_total">Valor da Fatura (R$):</label><input type="number" step="0.01" id="valor_total" value={formData.valor_total} onChange={handleChange} required /></div>
                  <div className="form-group"><label htmlFor="data_vencimento">Vencimento:</label><input type="date" id="data_vencimento" value={formData.data_vencimento} onChange={handleChange} required /></div>
              </div>
              <div className="form-group"><label htmlFor="mes_referencia">Mês de Referência:</label><input type="month" id="mes_referencia" value={formData.mes_referencia} onChange={handleChange} required /></div>
              <fieldset className="optional-fields">
                  <legend>Dados de Leitura (Opcional)</legend>
                  <div className="form-row">
                      <div className="form-group"><label htmlFor="consumo_kwh">Consumo (kWh):</label><input type="number" step="0.01" id="consumo_kwh" value={formData.consumo_kwh} onChange={handleChange} /></div>
                      <div className="form-group"><label htmlFor="injecao_kwh">Injeção (kWh):</label><input type="number" step="0.01" id="injecao_kwh" value={formData.injecao_kwh} onChange={handleChange} /></div>
                  </div>
              </fieldset>
              <button type="submit" className="btn-blue" disabled={enviando}>{enviando ? 'Processando...' : 'Gerar Fatura'}</button>
              {mensagem.texto && <div className={`message ${mensagem.tipo}`}>{mensagem.texto}</div>}
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default FaturaModal;