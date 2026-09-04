import React, { useState } from 'react';
import { mediaAPI, adminAPI } from '../services/api';

const PreviewModal = ({ file, files, groupId, isAdmin, onClose, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoRef, setVideoRef] = useState(null);
  const currentIndex = files.findIndex((f) => f.id === file.id);
  const isImage = file.mediaType === 'IMAGE';
  const isVideo = file.mediaType === 'VIDEO';

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef) {
      videoRef.playbackRate = speed;
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onClose();
      setTimeout(() => {
        // Parent component should handle this
      }, 200);
    }
  };

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      onClose();
      setTimeout(() => {
        // Parent component should handle this
      }, 200);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = isAdmin
        ? await adminAPI.downloadFile(file.id)
        : await mediaAPI.downloadFile(groupId, file.id);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalFilename);
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
          await adminAPI.deleteFile(file.id);
        } else {
          await mediaAPI.deleteFile(groupId, file.id);
        }
        onDelete(file.id);
        onClose();
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
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white truncate">{file.originalFilename}</h2>
          <p className="text-gray-400 text-sm mt-1">
            {file.mediaType} • {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl font-bold transition-colors ml-4"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        {isImage && (
          <img
            src={file.filePath}
            alt={file.originalFilename}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.target.src = '';
            }}
          />
        )}

        {isVideo && (
          <video
            ref={setVideoRef}
            src={file.filePath}
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
      {file.description && (
        <div className={`bg-gray-900 ${isVideo ? 'border-t' : 'border-t'} border-gray-700 px-6 py-3`}>
          <p className="text-gray-300 text-sm">
            <span className="font-semibold">Description:</span> {file.description}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-900 border-t border-gray-700 px-6 py-4 flex justify-between items-center">
        {/* Navigation */}
        <div className="flex gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Previous
          </button>
          <span className="text-gray-400 py-2">
            {currentIndex + 1} / {files.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === files.length - 1}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? '⬇️ Downloading...' : '⬇️ Download'}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? '🗑️ Deleting...' : '🗑️ Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
