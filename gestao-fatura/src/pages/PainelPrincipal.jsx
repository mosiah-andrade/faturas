import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Container from '../components/Container';
import IntegradorLista from '../components/IntegradorLista';
import IntegradorForm from '../components/IntegradorForm';
import ClienteForm from '../components/ClienteForm';
import FaturaModal from '../components/FaturaModal';
import './PainelPrincipal.css'

// Defina a URL base da sua API
const API_BASE_URL = 'http://localhost/faturas/api/'; // Ajuste para a URL da sua API

const PainelPrincipal = () => {
    const [integradores, setIntegradores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFaturaModalOpen, setFaturaModalOpen] = useState(false);

    const fetchIntegradores = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}listar_integradores.php`);
            if (!response.ok) throw new Error('Falha ao carregar integradores.');
            const data = await response.json();
            setIntegradores(data);
        } catch (error) {
            console.error(error);
            // Adicionar tratamento de erro na UI
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIntegradores();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este integrador?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}delete_integrador.php?id=${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            // Recarrega a lista após a exclusão
            fetchIntegradores();
        } catch (error) {
            alert(`Erro ao excluir: ${error.message}`);
        }
    };

    return (
        <>
            <section>
                <div>
                    <FaturaModal 
                        isOpen={isFaturaModalOpen} 
                        onClose={() => setFaturaModalOpen(false)} 
                    />  
                    <Container title="Ações Rápidas">
                        <Link className="action-link btn-blue" onClick={() => setFaturaModalOpen(true)}>Gerar Nova Fatura</Link>
                    </Container>
                
                    {/* Aqui você adicionaria os formulários de cadastro como componentes */}
                    <Container title="Cadastrar Novo Cliente">
                        <ClienteForm integradores={integradores} />
                    </Container>
                </div>
                <div>
                    <Container title="Cadastrar Novo Integrador">
                        <IntegradorForm onCadastro={fetchIntegradores} />
                    </Container>

                    <Container title="Integradores Cadastrados">
                        <IntegradorLista 
                            integradores={integradores} 
                            loading={loading} 
                            onDelete={handleDelete} 
                        />
                    </Container>
                </div>
            </section>
        </>
    );
};

export default PainelPrincipal;