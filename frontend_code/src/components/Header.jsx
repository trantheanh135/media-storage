import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="text-2xl sm:text-3xl shrink-0">📸</div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Media Storage</h1>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <p className="hidden lg:block text-gray-600">Upload and manage your images & videos</p>
            <div className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-gray-300">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userInfo.username}</p>
                <p className="text-xs text-gray-500">{userInfo.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors shrink-0"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
