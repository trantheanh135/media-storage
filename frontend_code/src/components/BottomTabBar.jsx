import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotoIcon, ShieldIcon } from './Icons';

const BottomTabBar = ({ active }) => {
  const navigate = useNavigate();

  const tabs = [
    { key: 'library', label: 'Library', icon: PhotoIcon, path: '/' },
    { key: 'admin', label: 'Admin', icon: ShieldIcon, path: '/admin' },
  ];

  return (
    <div
      style={{ borderTop: '0.5px solid #C6C6C8' }}
      className="fixed bottom-0 left-0 right-0 bg-white flex pt-2 pb-1.5 z-30"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center gap-0.5"
            style={{ color: isActive ? '#007AFF' : '#8E8E93' }}
          >
            <Icon size={24} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomTabBar;
