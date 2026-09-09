import React, { useState } from 'react';
import { mediaAPI, adminAPI, getStreamUrl } from '../services/api';
import { StarIcon } from './Icons';

const PreviewModal = ({ file, files, groupId, isAdmin, onClose, onDelete, onToggleFavorite }) => {
  const [loading, setLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoRef, setVideoRef] = useState(null);
  // Track the open item by id (not the `file` prop, which never changes) so
  // </->/-> actually swap what's displayed instead of just closing the modal.
  const [activeFileId, setActiveFileId] = useState(file.id);

  const currentIndex = files.findIndex((f) => f.id === activeFileId);
  const activeFile = currentIndex >= 0 ? files[currentIndex] : file;
  const isImage = activeFile.mediaType === 'IMAGE';
  const isVideo = activeFile.mediaType === 'VIDEO';

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef) {
      videoRef.playbackRate = speed;
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setActiveFileId(files[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      setActiveFileId(files[currentIndex + 1].id);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = isAdmin
        ? await adminAPI.downloadFile(activeFile.id)
        : await mediaAPI.downloadFile(groupId, activeFile.id);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', activeFile.originalFilename);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      alert('Error downloading file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      setLoading(true);
      try {
        if (isAdmin) {
          await adminAPI.deleteFile(activeFile.id);
        } else {
          await mediaAPI.deleteFile(groupId, activeFile.id);
        }
        onDelete(activeFile.id);
        if (currentIndex < files.length - 1) {
          setActiveFileId(files[currentIndex + 1].id);
        } else if (currentIndex > 0) {
          setActiveFileId(files[currentIndex - 1].id);
        } else {
          onClose();
        }
      } catch (error) {
        alert('Error deleting file: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-white truncate">{activeFile.originalFilename}</h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 truncate">
            {activeFile.mediaType} • {formatFileSize(activeFile.fileSize)} • {formatDate(activeFile.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(activeFile)}
              style={{ color: activeFile.favorite ? '#FFD60A' : '#9CA3AF' }}
              className="hover:opacity-80 transition-opacity"
              aria-label={activeFile.favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <StarIcon size={22} filled={!!activeFile.favorite} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        {isImage && (
          <img
            key={activeFile.id}
            src={getStreamUrl(activeFile.id, groupId, isAdmin)}
            alt={activeFile.originalFilename}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.target.src = '';
            }}
          />
        )}

        {isVideo && (
          <video
            key={activeFile.id}
            ref={setVideoRef}
            src={getStreamUrl(activeFile.id, groupId, isAdmin)}
            controls
            autoPlay
            className="max-w-full max-h-full object-contain bg-black"
            onLoadedMetadata={(e) => {
              e.target.playbackRate = playbackSpeed;
            }}
          />
        )}
      </div>

      {/* Video Speed Controls */}
      {isVideo && (
        <div className="bg-gray-900 border-t border-gray-700 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm font-semibold">Speed:</span>
            <div className="flex gap-1 flex-wrap">
              {speeds.map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    playbackSpeed === speed
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {activeFile.description && (
        <div className={`bg-gray-900 ${isVideo ? 'border-t' : 'border-t'} border-gray-700 px-6 py-3`}>
          <p className="text-gray-300 text-sm">
            <span className="font-semibold">Description:</span> {activeFile.description}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        {/* Navigation */}
        <div className="flex gap-2 justify-center sm:justify-start">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            ←
          </button>
          <span className="text-gray-400 py-2 text-sm sm:text-base">
            {currentIndex + 1} / {files.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === files.length - 1}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            →
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center sm:justify-end">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            {loading ? '⬇️ ...' : '⬇️ Download'}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            {loading ? '🗑️ ...' : '🗑️ Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
