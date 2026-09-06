import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone';
import MediaCard from '../components/MediaCard';
import PreviewModal from '../components/PreviewModal';
import { mediaAPI, groupAPI, adminAPI } from '../services/api';

const DashboardWithGroups = () => {
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [previewFile, setPreviewFile] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadGroups();
    checkSuperAdmin();
  }, []);

  const checkSuperAdmin = async () => {
    try {
      const response = await adminAPI.getAdminInfo();
      setIsSuperAdmin(response.data.isSuperAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      setPage(0);
      loadFiles();
    }
  }, [selectedGroup, filterType]);

  const loadGroups = async () => {
    try {
      const response = await groupAPI.getGroups();
      setGroups(response.data);
      if (response.data.length > 0) {
        setSelectedGroup(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadFiles = async () => {
    if (!selectedGroup) return;

    setLoading(true);
    try {
      let response;
      if (searchActive && searchQuery) {
        response = await mediaAPI.searchGroupFiles(selectedGroup, searchQuery, page, 12);
      } else if (filterType !== 'ALL') {
        response = await mediaAPI.getGroupFilesByType(selectedGroup, filterType, page, 12);
      } else {
        response = await mediaAPI.getGroupFiles(selectedGroup, page, 12);
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

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupAPI.createGroup(newGroupName, newGroupDesc);
      setNewGroupName('');
      setNewGroupDesc('');
      setShowCreateGroup(false);
      loadGroups();
    } catch (error) {
      alert('Error creating group: ' + error.message);
    }
  };

  const handleUploadSuccess = (newFile) => {
    setPage(0);
    setFiles([newFile, ...files]);
  };

  const handleDelete = (fileId) => {
    setFiles(files.filter((f) => f.id !== fileId));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setSearchActive(true);
    loadFiles();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchActive(false);
    setPage(0);
  };

  return (
    <div>
      {/* Group Selector */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex gap-2 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedGroup === group.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {group.name}
              </button>
            ))}
            <button
              onClick={() => setShowCreateGroup(!showCreateGroup)}
              className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              ➕ New Group
            </button>
          </div>

          {/* Admin Button */}
          {isSuperAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              🛡️ Admin Dashboard
            </button>
          )}
        </div>

        {showCreateGroup && (
          <form onSubmit={handleCreateGroup} className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Create
              </button>
            </div>
            <input
              type="text"
              placeholder="Description (optional)"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>
        )}
      </div>

      {selectedGroup && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <UploadZone groupId={selectedGroup} onUploadSuccess={handleUploadSuccess} />

          {/* Search & Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
              <div className="flex-1">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => { setFilterType('IMAGE'); setPage(0); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'IMAGE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  🖼️ Images
                </button>
                <button
                  onClick={() => { setFilterType('VIDEO'); setPage(0); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'VIDEO'
                      ? 'bg-blue-600 text-white'
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
                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 font-medium">Loading...</span>
              </div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-600">Upload your first file to get started!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {files.map((file) => (
                  <MediaCard
                    key={file.id}
                    file={file}
                    groupId={selectedGroup}
                    isAdmin={false}
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          groupId={selectedGroup}
          isAdmin={false}
          onClose={() => setPreviewFile(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default DashboardWithGroups;
