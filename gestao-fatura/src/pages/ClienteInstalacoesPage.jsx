import React, { useState, useEffect, useMemo } from 'react'; // Importe o useMemo
import { useParams, Link, useNavigate } from 'react-router-dom';
import Container from '../components/Container';
import InstalacaoModal from '../components/InstalacaoModal'; 
import './FaturasPage.css'; // Reutilizando o CSS

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ClienteInstalacoesPage = () => {
    const { clienteId } = useParams(); 
    const navigate = useNavigate();
    const [instalacoes, setInstalacoes] = useState([]);
    const [clienteNome, setClienteNome] = useState('');
    const [integradorId, setIntegradorId] = useState(null); 
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- NOVO ESTADO PARA ORDENAÇÃO ---
    // key: a propriedade do objeto pela qual ordenar (ex: 'id', 'codigo_uc')
    // direction: 'ascending' (crescente) ou 'descending' (decrescente)
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });

    const fetchData = async () => {
        // ... (seu código fetchData permanece o mesmo)
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}get_instalacoes_por_cliente.php?cliente_id=${clienteId}`);
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Erro ao buscar dados do cliente');
            }
            
            setInstalacoes(data.instalacoes || []); 
            setClienteNome(data.cliente_nome);
            setIntegradorId(data.integrador_id); 

        } catch (error) {
            console.error(error);
            alert(error.message);
            setInstalacoes([]); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [clienteId]);

    // --- NOVA LÓGICA DE ORDENAÇÃO COM useMemo ---
    const sortedInstalacoes = useMemo(() => {
        let sortableItems = [...instalacoes]; // Cria uma cópia para não mutar o estado original
        
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // Lida com nulos ou indefinidos
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (aValue === bValue) return 0;

                // Tenta comparar como números se possível, senão como strings
                let numA = parseFloat(aValue);
                let numB = parseFloat(bValue);

                let comparison = 0;
                if (!isNaN(numA) && !isNaN(numB)) {
                    // Comparação numérica
                    comparison = numA > numB ? 1 : -1;
                } else {
                    // Comparação de string (ignorando maiúsculas/minúsculas)
                    comparison = aValue.toString().toLowerCase().localeCompare(bValue.toString().toLowerCase());
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return sortableItems;
    }, [instalacoes, sortConfig]); // Recalcula quando as instalações ou a config de sort mudam

    // --- NOVA FUNÇÃO PARA PEDIR ORDENAÇÃO ---
    const requestSort = (key) => {
        let direction = 'ascending';
        // Se já está ordenando por esta chave, inverte a direção
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        // Se for uma nova chave, começa com 'ascending'
        setSortConfig({ key, direction });
    };

    // --- NOVA FUNÇÃO AUXILIAR PARA RENDERIZAR A SETA ---
    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) {
            return null; // Nenhuma seta se não for a coluna ativa
        }
        // Retorna a seta correspondente à direção
        return sortConfig.direction === 'ascending' ? ' \u2191' : ' \u2193'; // ↑ ou ↓
    };

    const handleGerarFatura = () => {
        navigate(`/cliente/${clienteId}/faturas`);
    };

    return (
        <Container>
            {loading ? (
                <p>Carregando...</p>
            ) : (
                <>
                    <div className="faturas-header">
                        {/* ... (cabeçalho da página sem alterações) ... */}
                        <h1>Instalações de: {clienteNome}</h1>
                        <div className="faturas-actions">
                            <button onClick={() => setIsModalOpen(true)} className="btn-novo">
                                + Criar Instalação
                            </button>
                            <button onClick={handleGerarFatura} className="btn-gerar">
                                Ver Faturas
                            </button>
                        </div>
                    </div>

                    <table className="faturas-tabela">
                        <thead>
                            <tr>
                                {/* --- CABEÇALHOS ATUALIZADOS --- */}
                                <th className="sortable-header" onClick={() => requestSort('id')}>
                                    ID {getSortIndicator('id')}
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('codigo_uc')}>
                                    Cód. UC {getSortIndicator('codigo_uc')}
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('endereco_instalacao')}>
                                    Endereço {getSortIndicator('endereco_instalacao')}
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('tipo_contrato')}>
                                    Ligação {getSortIndicator('tipo_contrato')}
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('tipo_instalacao')}>
                                    Tipo {getSortIndicator('tipo_instalacao')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* --- USA A LISTA ORDENADA --- */}
                            {sortedInstalacoes.length > 0 ? (
                                sortedInstalacoes.map(inst => ( // Usa sortedInstalacoes
                                    <tr key={inst.id} className="linha">
                                        <td>{inst.id}</td>
                                        <td>{inst.codigo_uc}</td>
                                        <td>{inst.endereco_instalacao}</td>
                                        <td>{inst.tipo_contrato}</td> 
                                        <td>{inst.tipo_instalacao}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5">Nenhuma instalação encontrada para este cliente.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </>
            )}
            
            <InstalacaoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchData} 
                clienteId={clienteId} 
                integradorId={integradorId} 
            />
            <a onClick={() => navigate(-1)} className="back-link">
                &larr; Voltar
            </a>
        </Container>
    );
};

export default ClienteInstalacoesPage;