import React, { useState, useEffect, useRef } from 'react';
import UploadZone from '../components/UploadZone';
import MediaCard from '../components/MediaCard';
import PreviewModal from '../components/PreviewModal';
import BottomTabBar from '../components/BottomTabBar';
import { SearchIcon, CloseIcon, PlusIcon, ChevronDownIcon, CloudIcon } from '../components/Icons';
import { mediaAPI, groupAPI, adminAPI } from '../services/api';

const DashboardWithGroups = () => {
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
  const [showGroupSwitcher, setShowGroupSwitcher] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

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

  // pageToLoad/isSearch/query/type are passed explicitly (not read from
  // component state) so callers never race against React's async state
  // updates - e.g. calling this right after setSearchActive(true) would
  // otherwise still see the old searchActive value.
  const loadFiles = async (pageToLoad, isSearch, query, type) => {
    if (!selectedGroup || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      let response;
      if (isSearch && query) {
        response = await mediaAPI.searchGroupFiles(selectedGroup, query, pageToLoad, 12);
      } else if (type !== 'ALL') {
        response = await mediaAPI.getGroupFilesByType(selectedGroup, type, pageToLoad, 12);
      } else {
        response = await mediaAPI.getGroupFiles(selectedGroup, pageToLoad, 12);
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
    if (selectedGroup) {
      loadFiles(0, searchActive, searchQuery, filterType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, filterType]);

  // Infinite scroll: load the next page once the sentinel below the grid
  // becomes visible.
  useEffect(() => {
    if (!hasMore) return undefined;

    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadFiles(page + 1, searchActive, searchQuery, filterType);
        }
      },
      { rootMargin: '600px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, files.length]);

  const loadGroups = async () => {
    try {
      const response = await groupAPI.getGroups();
      setGroups(response.data);
      if (response.data.length > 0) {
        setSelectedGroup((prev) => prev ?? response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupAPI.createGroup(newGroupName, newGroupDesc);
      setNewGroupName('');
      setNewGroupDesc('');
      setShowCreateGroup(false);
      setShowGroupSwitcher(false);
      loadGroups();
    } catch (error) {
      alert('Error creating group: ' + error.message);
    }
  };

  const handleUploadSuccess = (newFile) => {
    setPage(0);
    setFiles((prev) => [newFile, ...prev]);
  };

  const handleDelete = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchActive(true);
    loadFiles(0, true, searchQuery, filterType);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchActive(false);
    loadFiles(0, false, '', filterType);
  };

  const currentGroup = groups.find((g) => g.id === selectedGroup);

  const segments = [
    { key: 'ALL', label: 'All' },
    { key: 'IMAGE', label: 'Photos' },
    { key: 'VIDEO', label: 'Videos' },
  ];

  return (
    <div>
      {/* Large title + group switcher + upload action */}
      <div className="px-4 pt-1 pb-3 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1
              style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.3px', color: '#000' }}
              className="truncate"
            >
              Media Storage
            </h1>
            <button
              onClick={() => setShowGroupSwitcher((v) => !v)}
              style={{ color: '#007AFF' }}
              className="flex items-center gap-1 text-[15px] font-medium mt-0.5"
            >
              <span className="truncate max-w-[220px]">{currentGroup?.name || 'Select a group'}</span>
              <ChevronDownIcon size={12} style={{ marginTop: 2, flexShrink: 0 }} />
            </button>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{ background: '#F2F2F7', color: '#007AFF' }}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
          >
            <PlusIcon size={18} />
          </button>
        </div>

        {showGroupSwitcher && (
          <div
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '0.5px solid #E5E5EA' }}
            className="absolute left-4 right-4 top-full mt-1 bg-white rounded-xl overflow-hidden z-20"
          >
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedGroup(group.id);
                  setShowGroupSwitcher(false);
                }}
                style={{
                  borderBottom: '0.5px solid #E5E5EA',
                  color: group.id === selectedGroup ? '#007AFF' : '#000',
                }}
                className="w-full text-left px-4 py-3 text-[15px] font-medium"
              >
                {group.name}
              </button>
            ))}
            {!showCreateGroup ? (
              <button
                onClick={() => setShowCreateGroup(true)}
                style={{ color: '#007AFF' }}
                className="w-full text-left px-4 py-3 text-[15px] font-medium flex items-center gap-2"
              >
                <PlusIcon size={15} />
                New Group
              </button>
            ) : (
              <form onSubmit={handleCreateGroup} className="p-3 space-y-2">
                <input
                  type="text"
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  style={{ background: '#F2F2F7' }}
                  className="w-full px-3 py-2 rounded-lg text-[15px] outline-none"
                  required
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  style={{ background: '#F2F2F7' }}
                  className="w-full px-3 py-2 rounded-lg text-[15px] outline-none"
                />
                <button
                  type="submit"
                  style={{ background: '#007AFF' }}
                  className="w-full text-white py-2 rounded-lg text-[15px] font-semibold"
                >
                  Create
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {selectedGroup && (
        <div>
          {/* Search */}
          <div className="px-4 pb-2.5">
            <form onSubmit={handleSearch}>
              <div style={{ background: '#F2F2F7' }} className="flex items-center gap-1.5 rounded-[10px] h-9 px-2.5">
                <SearchIcon size={16} style={{ color: '#8E8E93', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search"
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

          {/* Segmented control */}
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

          {/* Grid */}
          {loading && page === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center gap-2">
                <div
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{ borderColor: '#007AFF', borderTopColor: 'transparent' }}
                ></div>
                <span style={{ color: '#8E8E93' }} className="text-sm">Loading</span>
              </div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div style={{ color: '#C7C7CC' }} className="flex justify-center mb-3">
                <CloudIcon size={44} />
              </div>
              <h3 style={{ color: '#000' }} className="text-base font-semibold mb-1">No files yet</h3>
              <p style={{ color: '#8E8E93' }} className="text-sm">Tap + to upload your first photo or video</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-0.5">
                {files.map((file) => (
                  <MediaCard
                    key={file.id}
                    file={file}
                    groupId={selectedGroup}
                    isAdmin={false}
                    onPreview={setPreviewFile}
                  />
                ))}
              </div>

              <div ref={sentinelRef} className="h-1" />

              {loading && page > 0 && (
                <div className="text-center py-6">
                  <div
                    className="inline-block w-5 h-5 border-2 rounded-full animate-spin"
                    style={{ borderColor: '#007AFF', borderTopColor: 'transparent' }}
                  ></div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Upload sheet */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto"
          >
            <div
              style={{ borderBottom: '0.5px solid #E5E5EA' }}
              className="flex items-center justify-between px-4 py-3"
            >
              <h2 className="text-base font-semibold">Upload</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ color: '#007AFF' }}
                className="text-[15px] font-medium"
              >
                Done
              </button>
            </div>
            <div className="p-4">
              <UploadZone groupId={selectedGroup} onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>
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

      {isSuperAdmin && <BottomTabBar active="library" />}
    </div>
  );
};

export default DashboardWithGroups;
