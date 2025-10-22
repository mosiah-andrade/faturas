import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Container from '../components/Container';
import InstalacaoModal from '../components/InstalacaoModal'; 
import './FaturasPage.css'; // Reutilizando o CSS

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ClienteInstalacoesPage = () => {
    const { clienteId } = useParams(); // Pega o ID da URL
    const navigate = useNavigate();
    const [instalacoes, setInstalacoes] = useState([]);
    const [clienteNome, setClienteNome] = useState('');
    const [integradorId, setIntegradorId] = useState(null); // Estado para o ID do integrador
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/get_instalacoes_por_cliente.php?cliente_id=${clienteId}`);
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Erro ao buscar dados do cliente');
            }
            
            // Verifica se a API está retornando os dados esperados
            setInstalacoes(data.instalacoes || []); // Garante que seja um array
            setClienteNome(data.cliente_nome);
            setIntegradorId(data.integrador_id); // Captura o ID do integrador

        } catch (error) {
            console.error(error);
            alert(error.message);
            setInstalacoes([]); // Em caso de erro, limpa as instalações
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [clienteId]);

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
                        <h1>Instalações de: {clienteNome}</h1>
                        <div className="faturas-actions">
                            <button onClick={() => setIsModalOpen(true)} className="btn-novo">
                                + Criar Instalação
                            </button>
                            <button onClick={handleGerarFatura} className="btn-gerar">
                                Gerar/Ver Faturas
                            </button>
                        </div>
                    </div>

                    {/* ======================================================= */}
                    {/* RESTAURAÇÃO DA TABELA                                 */}
                    {/* ======================================================= */}
                    <table className="faturas-tabela">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cód. UC</th>
                                <th>Endereço</th>
                                <th>Ligação</th> {/* Label atualizada */}
                                <th>Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {instalacoes.length > 0 ? (
                                instalacoes.map(inst => (
                                    <tr key={inst.id} className="linha">
                                        <td>{inst.id}</td>
                                        <td>{inst.codigo_uc}</td>
                                        <td>{inst.endereco_instalacao}</td>
                                        <td>{inst.tipo_contrato}</td> {/* Campo atualizado */}
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
                    {/* ======================================================= */}
                    {/* FIM DA RESTAURAÇÃO DA TABELA                            */}
                    {/* ======================================================= */}
                    
                </>
            )}
            
            {/* Modal de Instalação */}
            <InstalacaoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchData} // Atualiza a lista após salvar
                clienteId={clienteId} // Passa o ID do cliente
                integradorId={integradorId} // Passa o ID do integrador
            />
           <a onClick={() => navigate(-1)} className="back-link">
                &larr; Voltar
            </a>
        </Container>
    );
};

export default ClienteInstalacoesPage;