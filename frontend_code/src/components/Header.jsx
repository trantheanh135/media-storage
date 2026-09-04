import React from 'react';
import { Link } from 'react-router-dom';
import { logout, getUserInfo } from '../services/keycloak';

const Header = () => {
  const userInfo = getUserInfo();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-3xl">📸</div>
            <h1 className="text-2xl font-bold text-gray-900">Media Storage</h1>
          </Link>
          <div className="flex items-center gap-4">
            <p className="text-gray-600">Upload and manage your images & videos</p>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-300">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userInfo.username}</p>
                <p className="text-xs text-gray-500">{userInfo.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
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
