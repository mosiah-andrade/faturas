import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from '../components/Container';
import '../components/Form.css'; // Reutilizando o CSS dos formulários

const API_BASE_URL = 'http://localhost/faturas/api/';

const LancarLeituraPage = () => {
  const navigate = useNavigate(); // Hook para navegação
  const [instalacoes, setInstalacoes] = useState([]);
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

  // Busca a lista de todas as instalações ao carregar a página
  useEffect(() => {
    const fetchInstalacoes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}listar_instalacoes.php`);
        const data = await response.json();
        if (response.ok) {
          setInstalacoes(data);
        } else {
          throw new Error(data.message || 'Falha ao carregar instalações.');
        }
      } catch (error) {
        setMensagem({ texto: error.message, tipo: 'error' });
      }
    };
    fetchInstalacoes();
  }, []);

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
      
      // Limpa formulário e redireciona para a página inicial após 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      setMensagem({ texto: error.message, tipo: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Container title="Lançar Nova Fatura">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="instalacao_id">Selecione a Instalação do Cliente:</label>
          <select id="instalacao_id" value={formData.instalacao_id} onChange={handleChange} required>
            <option value="">-- Selecione uma instalação --</option>
            {instalacoes.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.nome} - UC: {inst.codigo_uc}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="valor_total">Valor da Fatura (R$):</label>
            <input type="number" step="0.01" id="valor_total" value={formData.valor_total} onChange={handleChange} placeholder="Ex: 150.00" required />
          </div>
          <div className="form-group">
            <label htmlFor="data_vencimento">Data de Vencimento:</label>
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
            <div className="form-group">
              <label htmlFor="consumo_kwh">Consumo da Rede (kWh):</label>
              <input type="number" step="0.01" id="consumo_kwh" value={formData.consumo_kwh} onChange={handleChange} placeholder="Para histórico" />
            </div>
            <div className="form-group">
              <label htmlFor="injecao_kwh">Energia Injetada (kWh):</label>
              <input type="number" step="0.01" id="injecao_kwh" value={formData.injecao_kwh} onChange={handleChange} placeholder="Para histórico" />
            </div>
          </div>
        </fieldset>

        <button type="submit" className="btn-blue" disabled={enviando}>
          {enviando ? 'Processando...' : 'Gerar Fatura'}
        </button>
        {mensagem.texto && <div className={`message ${mensagem.tipo}`}>{mensagem.texto}</div>}
      </form>
      <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: '20px' }}>
        Voltar ao Painel Principal
      </Link>
    </Container>
  );
};

export default LancarLeituraPage;