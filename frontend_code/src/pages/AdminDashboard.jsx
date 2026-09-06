import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';
import MediaCard from '../components/MediaCard';
import PreviewModal from '../components/PreviewModal';
import BottomTabBar from '../components/BottomTabBar';
import { SearchIcon, CloseIcon, ShieldIcon, CloudIcon } from '../components/Icons';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [view, setView] = useState('dashboard'); // dashboard or files
  const [previewFile, setPreviewFile] = useState(null);

  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  // pageToLoad/isSearch/query/type are passed explicitly (not read from
  // component state) so callers never race against React's async state
  // updates - e.g. calling this right after setSearchActive(true) would
  // otherwise still see the old searchActive value.
  const loadAllFiles = async (pageToLoad, isSearch, query, type) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      let response;
      if (isSearch && query) {
        response = await adminAPI.searchAllFiles(query, pageToLoad, 12);
      } else if (type !== 'ALL') {
        response = await adminAPI.getFilesByType(type, pageToLoad, 12);
      } else {
        response = await adminAPI.getAllFiles(pageToLoad, 12);
      }

      setFiles((prev) => (pageToLoad === 0 ? response.data.content : [...prev, ...response.data.content]));
      setHasMore(!response.data.last);
      setPage(pageToLoad);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    if (view === 'files') {
      loadAllFiles(0, searchActive, searchQuery, filterType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, filterType]);

  // Infinite scroll: load the next page once the sentinel below the grid
  // becomes visible.
  useEffect(() => {
    if (view !== 'files' || !hasMore) return undefined;

    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadAllFiles(page + 1, searchActive, searchQuery, filterType);
        }
      },
      { rootMargin: '600px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, page, hasMore, files.length]);

  const loadDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Access denied or error loading dashboard');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchActive(true);
    loadAllFiles(0, true, searchQuery, filterType);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchActive(false);
    loadAllFiles(0, false, '', filterType);
  };

  const handleDelete = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const segments = [
    { key: 'ALL', label: 'All' },
    { key: 'IMAGE', label: 'Photos' },
    { key: 'VIDEO', label: 'Videos' },
  ];

  if (!dashboard) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-2">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: '#007AFF', borderTopColor: 'transparent' }}
          ></div>
          <span style={{ color: '#8E8E93' }} className="text-sm">Loading admin dashboard</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Large title */}
      <div className="px-4 pt-1 pb-3">
        <div className="flex items-center gap-2">
          <div style={{ color: '#FF3B30' }}><ShieldIcon size={26} /></div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.3px', color: '#000' }}>Admin</h1>
        </div>
        <p style={{ color: '#8E8E93' }} className="text-[15px] mt-0.5">
          {dashboard.currentUser} &middot; {dashboard.roles.join(', ')}
        </p>
      </div>

      {/* Tab Navigation (segmented) */}
      <div className="px-4 pb-4">
        <div style={{ background: '#E5E5EA' }} className="flex rounded-[9px] p-0.5 h-8">
          {[
            { key: 'dashboard', label: 'Overview' },
            { key: 'files', label: 'All Files' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={
                view === tab.key
                  ? { background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', color: '#000', fontWeight: 600 }
                  : { color: '#3C3C43', fontWeight: 500 }
              }
              className="flex-1 rounded-[7px] text-[13px]"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {view === 'dashboard' && (
        <div className="px-4 grid grid-cols-2 gap-3">
          <div style={{ background: '#F2F2F7' }} className="rounded-2xl p-4">
            <p style={{ color: '#8E8E93' }} className="text-xs font-medium mb-1">Total Files</p>
            <p style={{ color: '#000' }} className="text-2xl font-bold">{dashboard.totalFiles}</p>
          </div>
          <div style={{ background: '#F2F2F7' }} className="rounded-2xl p-4">
            <p style={{ color: '#8E8E93' }} className="text-xs font-medium mb-1">Storage Used</p>
            <p style={{ color: '#000' }} className="text-2xl font-bold">{(dashboard.totalStorageMB / 1024).toFixed(2)} GB</p>
          </div>
          <div style={{ background: '#F2F2F7' }} className="rounded-2xl p-4">
            <p style={{ color: '#8E8E93' }} className="text-xs font-medium mb-1">Total Groups</p>
            <p style={{ color: '#000' }} className="text-2xl font-bold">{dashboard.totalGroups}</p>
          </div>
          <div style={{ background: '#FFEBEA' }} className="rounded-2xl p-4">
            <p style={{ color: '#FF3B30' }} className="text-xs font-medium mb-1">Access Level</p>
            <p style={{ color: '#FF3B30' }} className="text-lg font-bold">Super Admin</p>
          </div>
        </div>
      )}

      {/* Files View */}
      {view === 'files' && (
        <div>
          {/* Search */}
          <div className="px-4 pb-2.5">
            <form onSubmit={handleSearch}>
              <div style={{ background: '#F2F2F7' }} className="flex items-center gap-1.5 rounded-[10px] h-9 px-2.5">
                <SearchIcon size={16} style={{ color: '#8E8E93', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search all files"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ color: '#000' }}
                  className="flex-1 min-w-0 bg-transparent text-[15px] outline-none"
                />
                {searchQuery && (
                  <button type="button" onClick={clearSearch} style={{ color: '#8E8E93' }} className="flex-shrink-0">
                    <CloseIcon size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Filter segmented control */}
          <div className="px-4 pb-4">
            <div style={{ background: '#E5E5EA' }} className="flex rounded-[9px] p-0.5 h-8">
              {segments.map((seg) => (
                <button
                  key={seg.key}
                  onClick={() => setFilterType(seg.key)}
                  style={
                    filterType === seg.key
                      ? { background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', color: '#000', fontWeight: 600 }
                      : { color: '#3C3C43', fontWeight: 500 }
                  }
                  className="flex-1 rounded-[7px] text-[13px]"
                >
                  {seg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Files Grid */}
          {loading && page === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center gap-2">
                <div
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{ borderColor: '#FF3B30', borderTopColor: 'transparent' }}
                ></div>
                <span style={{ color: '#8E8E93' }} className="text-sm">Loading</span>
              </div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div style={{ color: '#C7C7CC' }} className="flex justify-center mb-3">
                <CloudIcon size={44} />
              </div>
              <h3 style={{ color: '#000' }} className="text-base font-semibold mb-1">No files found</h3>
              <p style={{ color: '#8E8E93' }} className="text-sm">Nothing in the system yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-0.5">
                {files.map((file) => (
                  <MediaCard
                    key={file.id}
                    file={file}
                    groupId={1}
                    isAdmin={true}
                    onPreview={setPreviewFile}
                  />
                ))}
              </div>

              <div ref={sentinelRef} className="h-1" />

              {loading && page > 0 && (
                <div className="text-center py-6">
                  <div
                    className="inline-block w-5 h-5 border-2 rounded-full animate-spin"
                    style={{ borderColor: '#FF3B30', borderTopColor: 'transparent' }}
                  ></div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <PreviewModal
          file={previewFile}
          files={files}
          groupId={1}
          isAdmin={true}
          onClose={() => setPreviewFile(null)}
          onDelete={handleDelete}
        />
      )}

      <BottomTabBar active="admin" />
    </div>
  );
};

export default AdminDashboard;
