import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-20">
        {children}
      </main>
    </div>
  );
};

export default Layout;
