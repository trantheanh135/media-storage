import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonIcon } from './Icons';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex justify-end px-4 pt-3.5">
      <button
        onClick={handleLogout}
        style={{ background: '#F2F2F7', color: '#8E8E93' }}
        className="w-9 h-9 rounded-full flex items-center justify-center"
      >
        <PersonIcon size={18} />
      </button>
    </div>
  );
};

export default Header;
