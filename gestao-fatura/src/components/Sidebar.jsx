import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import { useAuth } from '../auth/AuthContext';
import { 
    FiHome, FiFilePlus, FiUserPlus, FiUsers, FiChevronsLeft, FiChevronsRight, FiLogOut 
} from 'react-icons/fi';

const Sidebar = ({ 
    isCollapsed, 
    toggleSidebar,
    onGerarFatura, 
    onCadastrarCliente, 
    onCadastrarIntegrador 
}) => {
  const { logout } = useAuth(); 

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {/* MUDANÇA: O logo agora é referenciado diretamente da pasta public */}
        
        
        {!isCollapsed && <img src="/homolog.png" alt="Logo" className="sidebar-logo" />}
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isCollapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
        </button>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className='nav-link'>
            <FiHome className="nav-icon" />
            {!isCollapsed && <span className="nav-text">Home</span>}
        </Link>
        <button onClick={onGerarFatura} className='nav-link'>
            <FiFilePlus className="nav-icon" />
            {!isCollapsed && <span className="nav-text">Gerar Nova Fatura</span>}
        </button>
        <button onClick={onCadastrarCliente} className='nav-link'>
            <FiUserPlus className="nav-icon" />
            {!isCollapsed && <span className="nav-text">Cadastrar Cliente</span>}
        </button>
        <button onClick={onCadastrarIntegrador} className='nav-link'>
            <FiUsers className="nav-icon" />
            {!isCollapsed && <span className="nav-text">Cadastrar Integrador</span>}
        </button>
      </nav>
      <div className="sidebar-footer">
            <button onClick={logout} className='nav-link'>
                <FiLogOut className="nav-icon" />
                {!isCollapsed && <span className="nav-text">Sair</span>}
            </button>
        </div>
    </aside>
  );
};

export default Sidebar;