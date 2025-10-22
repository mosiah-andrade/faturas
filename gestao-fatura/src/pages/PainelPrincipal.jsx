import React, { useState, useEffect } from 'react';
import IntegradorTabela from '../components/IntegradorTabela';
import Container from '../components/Container';
import './PainelPrincipal.css'; // << ADICIONE ESTA LINHA

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PainelPrincipal = () => {
    const [integradores, setIntegradores] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchIntegradores = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/listar_integradores.php`);
            if (!response.ok) throw new Error('Falha ao carregar integradores.');
            const data = await response.json();
            setIntegradores(data);
        } catch (error) {
            console.error(error);
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
            const response = await fetch(`${API_BASE_URL}/delete_integrador.php?id=${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            fetchIntegradores();
        } catch (error) {
            alert(`Erro ao excluir: ${error.message}`);
        }
    };

    return (
        <>
            <Container>
                <IntegradorTabela 
                    integradores={integradores} 
                    loading={loading} 
                    onDelete={handleDelete} 
                />
            </Container>
        </>
    );
};

export default PainelPrincipal;