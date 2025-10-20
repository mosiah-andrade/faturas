import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './LoginPage.css';
// Importe os ícones que serão usados
import { FiEye, FiEyeOff } from 'react-icons/fi';

const LoginPage = () => {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // Novo estado para controlar a visibilidade da senha
    const [showPassword, setShowPassword] = useState(false); 
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(usuario, senha);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <img src="/homolog.png" alt="Logo Homolog Solar" className="login-logo" />
                
                <div className="form-group">
                    <label htmlFor="usuario">Usuário</label>
                    <input
                        type="text"
                        id="usuario"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        required
                    />
                </div>

                {/* --- SEÇÃO DA SENHA MODIFICADA --- */}
                <div className="form-group password-wrapper">
                    <label htmlFor="senha">Senha</label>
                    <input
                        // O tipo do input agora muda dinamicamente
                        type={showPassword ? 'text' : 'password'}
                        id="senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                    />
                    {/* Botão para alternar a visibilidade */}
                    <i 
                        type="button" 
                        className="password-toggle-btn" 
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </i>
                </div>
                {/* --- FIM DA SEÇÃO MODIFICADA --- */}
                
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;