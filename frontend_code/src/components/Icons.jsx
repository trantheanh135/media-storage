import React from 'react';

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const SearchIcon = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} style={style}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const CloseIcon = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} style={style}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const PlusIcon = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.2} style={style}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const PersonIcon = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} style={style}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

export const ChevronDownIcon = ({ size = 12, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.5} style={style}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const PlayIcon = ({ size = 12, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const PhotoIcon = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

export const ShieldIcon = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const DownloadIcon = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} style={style}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

export const TrashIcon = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} style={style}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

export const CloudIcon = ({ size = 40, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} style={style}>
    <path d="M17.5 19H9a5 5 0 1 1 1.2-9.85A6 6 0 0 1 21 11.5 3.5 3.5 0 0 1 17.5 19z" />
  </svg>
);
