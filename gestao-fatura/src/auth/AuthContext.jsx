import React, { createContext, useState, useContext, useEffect } from 'react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verifica a sessão quando o app carrega
        const verifySession = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/check_session.php`, { credentials: 'include' });
                const data = await response.json();
                if (data.loggedIn) {
                    setUser({ name: data.usuario });
                }
            } catch (error) {
                console.error("Erro ao verificar sessão", error);
            } finally {
                setLoading(false);
            }
        };
        verifySession();
    }, []);

    const login = async (usuario, senha) => {
        const response = await fetch(`${API_BASE_URL}/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha no login');
        }

        const data = await response.json();
        setUser({ name: data.usuario });
        return data;
    };

    const logout = async () => {
        await fetch(`${API_BASE_URL}/logout.php`, { credentials: 'include' });
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};