// faturas/gestao-fatura/src/pages/FaturasPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import Container from '../components/Container';
import './FaturasPage.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import FaturaTemplateHtml from '../components/FaturaTemplateHtml'; // Importe o template

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FaturasPage = () => {
    const { clienteId } = useParams();
    const navigate = useNavigate();
    
    const { openFaturaModal, openInstalacaoModal } = useOutletContext();

    const [faturas, setFaturas] = useState([]);
    const [clienteNome, setClienteNome] = useState('');
    const [integradorId, setIntegradorId] = useState(null);
    const [listaInstalacoes, setListaInstalacoes] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);

    // --- NOVOS ESTADOS PARA O PDF ---
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // Armazena o ID da fatura sendo gerada
    const [pdfData, setPdfData] = useState(null);

    const fetchData = async () => {
        if (!clienteId) return;
        setLoading(true);
        try {
            
            // * =======================================================
            // * CORREÇÃO 1: Adicionada a barra "/"
            // * =======================================================
            const resFaturas = await fetch(`${API_BASE_URL}/get_faturas.php?cliente_id=${clienteId}`);
            const dataFaturas = await resFaturas.json();
            
            if (!resFaturas.ok) {
                // Se der 404, o dataFaturas.message pode não existir
                throw new Error(dataFaturas.message || `Erro ao buscar faturas (Status: ${resFaturas.status})`);
            }
            
            setFaturas(dataFaturas.faturas || []);
            setClienteNome(dataFaturas.cliente_nome);
            setIntegradorId(dataFaturas.integrador_id); 

            // * =======================================================
            // * CORREÇÃO 2: Adicionada a barra "/"
            // * =======================================================
            const resInstalacoes = await fetch(`${API_BASE_URL}/get_instalacoes_por_cliente.php?cliente_id=${clienteId}`);
            const dataInstalacoes = await resInstalacoes.json();
            
            if (resInstalacoes.ok) {
                setListaInstalacoes(dataInstalacoes.instalacoes || []);
            } else {
                console.error("Erro ao buscar instalações:", dataInstalacoes.message);
                setListaInstalacoes([]); // <-- Se falhar, define a lista como vazia
            }

        } catch (error) {
            console.error(error);
            alert(error.message); 
            setListaInstalacoes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [clienteId]);

    const handleNovaInstalacao = () => {
        openInstalacaoModal({
            clienteId: clienteId,
            integradorId: integradorId,
            onSave: fetchData 
        });
    };

    const handleNovaFatura = () => {
        openFaturaModal({ 
            clienteId: clienteId, 
            integradorId: integradorId,
            instalacoes: listaInstalacoes, 
            onSave: fetchData 
        });
    };

    const handleExportPDF = async (faturaId) => {
        // ID da fatura que está sendo gerada, para o loading
        setIsGeneratingPdf(faturaId); 
        
        try {
            // 1. Buscar os dados da fatura E do histórico
            // **** O ERRO 500 ESTÁ ACONTECENDO AQUI ****
            const response = await fetch(`${API_BASE_URL}/get_detalhes_fatura.php?fatura_id=${faturaId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            // 2. Colocar os dados no state. Isso fará o template invisível ser renderizado.
            setPdfData(data);

            // 3. Esperar o React renderizar o template no DOM.
            // Usamos setTimeout(..., 100) para garantir que o DOM foi atualizado.
            setTimeout(async () => {
                const templateElement = document.getElementById('pdf-template-wrapper');
                if (!templateElement) {
                    console.error("Erro: Não foi possível encontrar o elemento #pdf-template-wrapper.");
                    alert("Erro ao gerar PDF: template não encontrado.");
                    setIsGeneratingPdf(false);
                    setPdfData(null);
                    return;
                }
                
                // 4. Rodar o html2canvas para "fotografar" o template
                const canvas = await html2canvas(templateElement, {
                    scale: 2, // Aumenta a resolução da imagem
                    useCORS: true // Para carregar imagens (logo, pix)
                });
                
                const imgData = canvas.toDataURL('image/png');

                // 5. Criar o PDF e adicionar a imagem
                const doc = new jsPDF('p', 'pt', 'a4'); // p = portrait, pt = points, a4 = tamanho
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();

                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                
                // Calcular a proporção para a imagem caber na página A4
                const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
                
                const imgWidth = canvasWidth * ratio;
                const imgHeight = canvasHeight * ratio;
                
                // Centralizar a imagem (opcional)
                const imgX = (pdfWidth - imgWidth) / 2;
                const imgY = 0; // Iniciar no topo

                doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);
                
                // 6. Salvar o PDF
                const nomeArquivo = `Relatorio_${data.fatura_detalhes.cliente_nome.replace(' ', '_')}_${data.fatura_detalhes.mes_referencia}.pdf`;
                doc.save(nomeArquivo);

                // 7. Limpar os estados
                setIsGeneratingPdf(false);
                setPdfData(null);

            }, 100); // 100ms de espera para garantir a renderização

        } catch (error) {
            alert(`Erro ao gerar PDF: ${error.message}`);
            setIsGeneratingPdf(false);
            setPdfData(null);
        }
    };

    if (loading) return <Container><p>Carregando faturas...</p></Container>;
    if (error) return <Container><p className="error-message">{error}</p></Container>;
    
    return (
        <Container>
            {/* --- INÍCIO DO TEMPLATE INVISÍVEL --- */}
            {isGeneratingPdf && pdfData && (
                <div 
                    id="pdf-template-wrapper" 
                    style={{
                        position: 'absolute', 
                        left: '-9999px', 
                        top: 0,
                        zIndex: -1,
                        background: 'white'
                    }}
                >
                    <FaturaTemplateHtml 
                        fatura={pdfData.fatura_detalhes} 
                        historico={pdfData.historico_consumo} 
                    />
                </div>
            )}
            {/* --- FIM DO TEMPLATE INVISÍVEL --- */}

            {loading ? (
                <p>Carregando...</p>
            ) : (
                <>
                    <div className="faturas-header">
                        <h1>Faturas de: {clienteNome}</h1>
                        <div className="faturas-actions">
                            <button 
                                onClick={handleNovaInstalacao} 
                                className="btn-novo"
                                disabled={!integradorId}
                                title={!integradorId ? "Não foi possível identificar o integrador." : "Adicionar nova instalação"}
                            >
                                + Criar Instalação
                            </button>
                            
                            <button 
                                onClick={handleNovaFatura}
                                className="btn-gerar"
                            >
                                Gerar Fatura
                            </button>
                        </div>
                    </div>

                    <table className="faturas-tabela">
                        <thead>
                            <tr>
                                <th>Instalação (UC)</th>
                                <th>Referência</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Vencimento</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {faturas.length > 0 ? (
                                faturas.map(fatura => (
                                    <tr key={fatura.id}>
                                        <td>{fatura.codigo_uc}</td>
                                        <td>{fatura.mes_referencia}</td>
                                        <td>R$ {parseFloat(fatura.valor_total).toFixed(2)}</td>
                                        <td><span className={`status-badge status-${fatura.status}`}>{fatura.status}</span></td>
                                        <td>{new Date(fatura.data_vencimento).toLocaleDateString()}</td>
                                        <td>
                                            {/* --- BOTÕES ATUALIZADOS --- */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Previne o clique na linha (tr)
                                                    navigate(`/fatura/${fatura.id}`)
                                                }} 
                                                className="btn-orange"
                                            >
                                                Detalhes
                                            </button>
                                            
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Previne o clique na linha (tr)
                                                    handleExportPDF(fatura.id);
                                                }} 
                                                className="btn-orange" // Classe de estilo
                                                disabled={isGeneratingPdf === fatura.id}
                                            >
                                                {isGeneratingPdf === fatura.id ? 'Gerando...' : 'PDF'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">Nenhuma fatura encontrada para este cliente.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </>
            )}
            <a onClick={() => navigate(-1)} className="back-link">
                &larr; Voltar
            </a>
        </Container>
    );
};

export default FaturasPage;