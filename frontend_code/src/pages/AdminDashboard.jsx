import React, { useState, useEffect } from 'react';
import { adminAPI, mediaAPI } from '../services/api';
import MediaCard from '../components/MediaCard';
import PreviewModal from '../components/PreviewModal';

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

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (view === 'files') {
      loadAllFiles();
    }
  }, [view, page, filterType]);

  const loadDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Access denied or error loading dashboard');
    }
  };

  const loadAllFiles = async () => {
    setLoading(true);
    try {
      let response;
      if (searchActive && searchQuery) {
        response = await adminAPI.searchAllFiles(searchQuery, page, 12);
      } else if (filterType !== 'ALL') {
        response = await adminAPI.getFilesByType(filterType, page, 12);
      } else {
        response = await adminAPI.getAllFiles(page, 12);
      }

      if (page === 0) {
        setFiles(response.data.content);
      } else {
        setFiles([...files, ...response.data.content]);
      }
      setHasMore(!response.data.last);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setSearchActive(true);
    loadAllFiles();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchActive(false);
    setPage(0);
  };

  const handleDelete = (fileId) => {
    setFiles(files.filter((f) => f.id !== fileId));
  };

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2">
          <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 mb-6 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">🛡️ Super Admin Dashboard</h2>
            <p className="text-red-100 mt-1">Full access to all files and groups</p>
          </div>
          <div className="text-right">
            <p className="text-red-100">Logged in as: <span className="font-bold">{dashboard.currentUser}</span></p>
            <p className="text-red-100 text-sm">Roles: {dashboard.roles.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('dashboard')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            view === 'dashboard'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-900 border border-gray-300 hover:border-gray-400'
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => { setView('files'); setPage(0); }}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            view === 'files'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-900 border border-gray-300 hover:border-gray-400'
          }`}
        >
          📁 All Files
        </button>
      </div>

      {/* Dashboard View */}
      {view === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Files Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-600 text-sm">Total Files</p>
            <p className="text-3xl font-bold text-gray-900">{dashboard.totalFiles}</p>
          </div>

          {/* Storage Used Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-2">💾</div>
            <p className="text-gray-600 text-sm">Storage Used</p>
            <p className="text-3xl font-bold text-gray-900">
              {(dashboard.totalStorageMB / 1024).toFixed(2)} GB
            </p>
          </div>

          {/* Total Groups Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-600 text-sm">Total Groups</p>
            <p className="text-3xl font-bold text-gray-900">{dashboard.totalGroups}</p>
          </div>

          {/* Admin Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-2">🛡️</div>
            <p className="text-gray-600 text-sm">Access Level</p>
            <p className="text-xl font-bold text-red-600">Super Admin</p>
          </div>
        </div>
      )}

      {/* Files View */}
      {view === 'files' && (
        <div>
          {/* Search & Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
              <div className="flex-1">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search all files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    🔍 Search
                  </button>
                  {searchActive && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setFilterType('ALL'); setPage(0); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'ALL'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => { setFilterType('IMAGE'); setPage(0); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'IMAGE'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  🖼️ Images
                </button>
                <button
                  onClick={() => { setFilterType('VIDEO'); setPage(0); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'VIDEO'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  🎬 Videos
                </button>
              </div>
            </div>
          </div>

          {/* Files Grid */}
          {loading && page === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2">
                <div className="w-6 h-6 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 font-medium">Loading files...</span>
              </div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-600">No files in the system yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {files.map((file) => (
                  <MediaCard
                    key={file.id}
                    file={file}
                    groupId={1}
                    isAdmin={true}
                    files={files}
                    onDelete={handleDelete}
                    onPreview={setPreviewFile}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
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
    </div>
  );
};

export default AdminDashboard;
