// faturas/gestao-fatura/src/pages/FaturasPage.jsx

import React, { useState, useEffect, useMemo } from 'react'; // 1. Importar useMemo
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import Container from '../components/Container';
import './FaturasPage.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import FaturaTemplateHtml from '../components/FaturaTemplateHtml'; 
import { FiEye } from 'react-icons/fi';
import { FaRegFilePdf, FaSpinner } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- NOVA FUNÇÃO HELPER (FORA DO COMPONENTE) ---
// Converte "MM/YYYY" para um número comparável (ex: "10/2025" -> 202510)
const parseMesReferencia = (mesRef) => {
    if (!mesRef || typeof mesRef !== 'string' || !mesRef.includes('/')) {
        return 0; // Retorna 0 se o formato for inválido
    }
    const parts = mesRef.split('/');
    if (parts.length !== 2) return 0;
    const [mes, ano] = parts;
    // Garante que o mês tenha dois dígitos (ex: '9' vira '09')
    return parseInt(`${ano}${mes.padStart(2, '0')}`, 10);
};


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

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); 
    const [pdfData, setPdfData] = useState(null);

    // --- 2. NOVO ESTADO PARA ORDENAÇÃO ---
    // Padrão: 'mes_referencia' decrescente (mais recente primeiro)
    const [sortConfig, setSortConfig] = useState({ key: 'mes_referencia', direction: 'descending' });


    const fetchData = async () => {
        // ... (seu código fetchData permanece o mesmo)
        if (!clienteId) return;
        setLoading(true);
        try {
            const resFaturas = await fetch(`${API_BASE_URL}/get_faturas.php?cliente_id=${clienteId}`);
            const dataFaturas = await resFaturas.json();
            
            if (!resFaturas.ok) {
                throw new Error(dataFaturas.message || `Erro ao buscar faturas (Status: ${resFaturas.status})`);
            }
            
            setFaturas(dataFaturas.faturas || []);
            setClienteNome(dataFaturas.cliente_nome);
            setIntegradorId(dataFaturas.integrador_id); 

            const resInstalacoes = await fetch(`${API_BASE_URL}/get_instalacoes_por_cliente.php?cliente_id=${clienteId}`);
            const dataInstalacoes = await resInstalacoes.json();
            
            if (resInstalacoes.ok) {
                setListaInstalacoes(dataInstalacoes.instalacoes || []);
            } else {
                console.error("Erro ao buscar instalações:", dataInstalacoes.message);
                setListaInstalacoes([]); 
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

    // --- 3. NOVA LÓGICA DE ORDENAÇÃO COM useMemo ---
    const sortedFaturas = useMemo(() => {
        let sortableItems = [...faturas]; 
        
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // Lida com nulos ou indefinidos
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (aValue === bValue) return 0;

                let comparison = 0;

                // Tratamento especial para colunas específicas
                switch (sortConfig.key) {
                    case 'valor_total':
                        // Comparação numérica
                        comparison = parseFloat(aValue) - parseFloat(bValue);
                        break;
                    case 'data_vencimento':
                        // Comparação de data (string YYYY-MM-DD funciona bem, mas Date é mais seguro)
                        comparison = new Date(aValue) - new Date(bValue);
                        break;
                    case 'mes_referencia':
                        // Comparação de "MM/YYYY" usando a função helper
                        comparison = parseMesReferencia(aValue) - parseMesReferencia(bValue);
                        break;
                    default:
                        // Comparação de string padrão (para 'codigo_uc' e 'status')
                        comparison = aValue.toString().toLowerCase().localeCompare(bValue.toString().toLowerCase());
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return sortableItems;
    }, [faturas, sortConfig]); // Recalcula quando as faturas ou a config de sort mudam

    // --- 4. NOVAS FUNÇÕES PARA PEDIR ORDENAÇÃO E INDICADOR ---
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) {
            return null; 
        }
        return sortConfig.direction === 'ascending' ? ' \u2191' : ' \u2193'; // ↑ ou ↓
    };


    // ... (suas funções handleNovaInstalacao, handleNovaFatura, handleExportPDF permanecem as mesmas) ...
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
        setIsGeneratingPdf(faturaId); 
        setPdfData(null); // Limpa dados anteriores para garantir a re-execução do useEffect

        try {
            const response = await fetch(`${API_BASE_URL}/get_detalhes_fatura.php?fatura_id=${faturaId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            // Apenas define os dados. O useEffect cuidará da geração.
            setPdfData(data);

        } catch (error) {
            alert(`Erro ao buscar dados para o PDF: ${error.message}`);
            setIsGeneratingPdf(false); // Reseta o estado de loading em caso de erro
        }
    };

    // Em faturas/gestao-fatura/src/pages/FaturasPage.jsx
// ... (depois do seu useEffect existente)

    // Novo useEffect para lidar com a geração do PDF APÓS a renderização
    useEffect(() => {
        // Só executa se tivermos dados E estivermos no modo de geração
        if (pdfData && isGeneratingPdf) {
            
            // Usamos um timer curto (ex: 50ms) para garantir que o navegador 
            // "pintou" o template invisível no DOM antes do html2canvas tentar lê-lo.
            const timer = setTimeout(async () => {
                const templateElement = document.getElementById('pdf-template-wrapper');
                
                if (!templateElement) {
                    console.error("Erro: Não foi possível encontrar o elemento #pdf-template-wrapper.");
                    alert("Erro ao gerar PDF: template não encontrado.");
                    setIsGeneratingPdf(false);
                    setPdfData(null);
                    return;
                }

                try {
                    const canvas = await html2canvas(templateElement, {
                        scale: 2, 
                        useCORS: true 
                    });
                    
                    // A linha com o erro de sintaxe "_" foi removida daqui.
                    
                    const imgData = canvas.toDataURL('image/png');
                    const doc = new jsPDF('p', 'pt', 'a4'); 
                    const pdfWidth = doc.internal.pageSize.getWidth();
                    const pdfHeight = doc.internal.pageSize.getHeight();

                    const canvasWidth = canvas.width;
                    const canvasHeight = canvas.height;
                    
                    const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
                    
                    const imgWidth = canvasWidth * ratio;
                    const imgHeight = canvasHeight * ratio;
                    
                    const imgX = (pdfWidth - imgWidth) / 2;
                    const imgY = 0; 

                    doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);
                    
                    const nomeArquivo = `Relatorio_${pdfData.fatura_detalhes.cliente_nome.replace(' ', '_')}_${pdfData.fatura_detalhes.mes_referencia}.pdf`;
                    doc.save(nomeArquivo);

                } catch (genError) {
                    alert(`Erro durante a geração do PDF: ${genError.message}`);
                    console.error("Erro no html2canvas/jsPDF:", genError);
                } finally {
                    // Limpa os estados após a tentativa (sucesso ou falha)
                    setIsGeneratingPdf(false);
                    setPdfData(null);
                }

            }, 50); // 50ms é geralmente suficiente para o DOM atualizar.

            // Limpa o timer se o componente for desmontado
            return () => clearTimeout(timer);
        }
    }, [pdfData, isGeneratingPdf]); // Dependências do hook
    // ... (seu retorno 'if (loading)' e 'if (error)' permanecem os mesmos) ...
    if (loading) return <Container><p>Carregando faturas...</p></Container>;
    if (error) return <Container><p className="error-message">{error}</p></Container>;
    
    return (
        <Container>
            {/* --- Template invisível (sem alterações) --- */}
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
            
            {loading ? (
                <p>Carregando <FaSpinner  stroke="#ffffffff" className="spinner"/></p>
            ) : (
                <>
                    {/* --- Cabeçalho da página (sem alterações) --- */}
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
                        {/* --- 5. CABEÇALHOS ATUALIZADOS --- */}
                        <thead>
                            <tr>
                                <th className="sortable-header" onClick={() => requestSort('codigo_uc')}>
                                    Instalação (UC) {getSortIndicator('codigo_uc')}
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('mes_referencia')}>
                                    Referência {getSortIndicator('mes_referencia')}
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('valor_total')}>
                                    Valor {getSortIndicator('valor_total')}
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('status')}>
                                    Status {getSortIndicator('status')}
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('data_vencimento')}>
                                    Vencimento {getSortIndicator('data_vencimento')}
                                </th>
                                <th>Ações</th> {/* Coluna de ações não é ordenável */}
                            </tr>
                        </thead>
                        
                        {/* --- 6. BODY ATUALIZADO (usando sortedFaturas) --- */}
                        <tbody>
                            {sortedFaturas.length > 0 ? (
                                sortedFaturas.map(fatura => ( // USA A LISTA ORDENADA
                                    <tr key={fatura.id}>
                                        <td>{fatura.codigo_uc}</td>
                                        <td>{fatura.mes_referencia}</td>
                                        <td>R$ {parseFloat(fatura.valor_total).toFixed(2)}</td>
                                        <td><span className={`status-badge status-${fatura.status}`}>{fatura.status}</span></td>
                                        <td>{new Date(fatura.data_vencimento).toLocaleDateString()}</td>
                                        <td>
                                            {/* ... (Botões de ação sem alterações) ... */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    navigate(`/fatura/${fatura.id}`)
                                                }} 
                                                className="btn-blue btn-action"
                                            >
                                                <FiEye />
                                            </button>
                                            
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    handleExportPDF(fatura.id);
                                                }} 
                                                className="btn-red" 
                                                disabled={isGeneratingPdf === fatura.id}
                                            >
                                                {isGeneratingPdf === fatura.id ? <FaSpinner  stroke="#ffffffff" className="spinner"/> : <FaRegFilePdf />}
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