import React from 'react';
import './FaturaTemplateHtml.css';
import logo from '../assets/homolog.png';
import pixLogo from '../assets/pix.png';

const formatarData = (data) => {
  if (!data) return '';
  const dataObj = new Date(data + 'T12:00:00');
  return dataObj.toLocaleDateString('pt-BR');
};

const formatarMoeda = (valor) => {
  const num = parseFloat(valor);
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarMesAno = (mesAno, estilo = 'long') => {
  if (!mesAno || !mesAno.includes('-')) return '';
  const [ano, mes] = mesAno.split('-');
  const data = new Date(ano, mes - 1, 15);
  if (estilo === 'short') {
    const nomeMes = data.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
    return `${nomeMes}. DE ${ano}`;
  }
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
};

const FaturaTemplateHtml = ({ fatura, historico }) => {
  const consumoEmReais = parseFloat(fatura.valor_consumo || 0);
  const consumoKwh = parseFloat(fatura.consumo_kwh_registrado || 0);
  const taxaMinima = parseFloat(fatura.taxa_minima || 0);
  const percentualDesconto = parseInt(fatura.percentual_desconto || 0);
  const valorSemDesconto = parseFloat(fatura.subtotal || 0);
  const valorDesconto = parseFloat(fatura.valor_desconto || 0);
  const valorFinal = parseFloat(fatura.valor_total || 0);

  let valorKwh = 0;
  if (consumoKwh > 0) valorKwh = consumoEmReais / consumoKwh;

  const mesVencimento = new Date(fatura.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();

  return (
    <div id="fatura-html" className="pdf-template-container">
      <header className="pdf-header">
        <img src={logo} alt="Logo Homolog Solar" className="pdf-logo" />
        
        <div className="coluna">
        <div className="info-bloco">
            <strong>CLIENTE:</strong>
            <span>{fatura.cliente_nome}</span>
        </div>
        <div className="info-bloco">
            <strong>ENDEREÇO:</strong>
            <span>{fatura.endereco_instalacao}</span>
        </div>
        </div>
        <div className="coluna">
        <div className="info-bloco">
            <strong>CPF/CNPJ:</strong>
            <span>{fatura.cliente_documento}</span>
        </div>
        <div className="info-bloco">
            <strong>CÓD. UC:</strong>
            <span>{fatura.codigo_uc}</span>
        </div>
        </div>
      </header>


          <h2>RELATÓRIO DE CONSUMO</h2>
      <section className="pdf-titulo-secao ">
        <div>
          <p>Competência: {formatarMesAno(fatura.mes_referencia)}</p>
          <p>Vencimento em: {mesVencimento}</p>
        </div>

        <div>
          <p>Data da Leitura {formatarData(fatura.data_leitura)}</p>
          <p>Numero de Dias: {fatura.numero_dias}</p>
        </div>
      </section>

      <section className="pdf-corpo">
        <div className="coluna-detalhes">
          <table className="pdf-detalhes-tabela">
            <tbody>
              
              <tr>
                <td>Consumo do mês atual (kWh)</td>
                <td>{consumoKwh.toFixed(0)}</td>
              </tr>
              {parseFloat(fatura.injecao_kwh || 0) > 0 && (
                <tr>
                  <td>Valor injetado:</td>
                  <td>{parseFloat(fatura.injecao_kwh).toFixed(0)} kWh</td>
                </tr>
              )}
              {/* <tr>
                <td>Valor do kWh (TUSD + TE)</td>
                <td>R$ {valorKwh.toFixed(2)}</td>
              </tr> */}
              <tr>
                <td>Taxa Mínima</td>
                <td>{formatarMoeda(taxaMinima)}</td>
              </tr>
              <tr>
                <td>Valor total sem desconto</td>
                <td>{formatarMoeda(valorSemDesconto)}</td>
              </tr>
              <tr>
                <td>Desconto ({percentualDesconto}%)</td>
                <td>-{formatarMoeda(valorDesconto)}</td>
              </tr>
              <tr className="linha-total">
                <td><strong>VALOR A PAGAR</strong></td>
                <td><strong>{formatarMoeda(valorFinal)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="coluna-historico">
          <strong>Histórico de Consumo</strong>
          <table className="pdf-historico-tabela">
            <thead>
              <tr>
                <th>Mês/Ano</th>
                <th>Consumo</th>
              </tr>
            </thead>
            <tbody>
              {historico.map(item => (
                <tr key={item.id}>
                  <td>{formatarMesAno(item.mes_referencia, 'short')}</td>
                  <td>{parseFloat(item.consumo || 0).toFixed(0)} kWh</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="pdf-footer">
        <div className="pix-info">
          <strong>Pague com PIX:</strong>
          <img src={pixLogo} alt="PIX QR Code" className="pix-qr" />
          <span>CNPJ: 46.967.661/0001-91</span>
        </div>
        <div className="pix-valores">
          <div className="valor-bloco">
            <span>VENCIMENTO</span>
            <strong>{formatarData(fatura.data_vencimento)}</strong>
          </div>
          <div className="valor-bloco">
            <span>TOTAL A PAGAR</span>
            <strong>{formatarMoeda(valorFinal)}</strong>
          </div>
        </div>
      </footer>

      <p className="pdf-aviso-comprovante">*Favor enviar o comprovante via whatsapp +55 81 8987-8175</p>
    </div>
  );
};

export default FaturaTemplateHtml;
