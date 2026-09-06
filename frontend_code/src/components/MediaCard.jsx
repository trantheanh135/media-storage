import React, { useState } from 'react';
import { mediaAPI, adminAPI } from '../services/api';

const MediaCard = ({ file, groupId, isAdmin, files, onDelete, onPreview }) => {
  const [loading, setLoading] = useState(false);
  const isImage = file.mediaType === 'IMAGE';
  const isVideo = file.mediaType === 'VIDEO';

  const handlePreview = () => {
    onPreview(file);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
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

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this file?')) {
      setLoading(true);
      try {
        if (isAdmin) {
          await adminAPI.deleteFile(file.id);
        } else {
          await mediaAPI.deleteFile(groupId, file.id);
        }
        onDelete(file.id);
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
    <div
      onClick={handlePreview}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
    >
      <div className="relative bg-gray-200 h-40 flex items-center justify-center overflow-hidden">
        {isImage && (
          <img
            src={file.filePath}
            alt={file.originalFilename}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={(e) => {
              e.target.src = '';
            }}
          />
        )}
        {isVideo && (
          <div className="w-full h-full relative">
            <video
              src={file.filePath}
              className="w-full h-full object-cover"
              controls={false}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-colors">
              <div className="text-4xl">▶️</div>
            </div>
          </div>
        )}
        {!isImage && !isVideo && (
          <div className="text-5xl">📁</div>
        )}
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
          {file.mediaType}
        </div>

        {/* Preview overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-colors flex items-center justify-center">
          <div className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            👁️ Preview
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate mb-2" title={file.originalFilename}>
          {file.originalFilename}
        </h3>

        {file.description && (
          <p className="text-sm text-gray-600 mb-2 truncate">
            {file.description}
          </p>
        )}

        <div className="text-xs text-gray-500 mb-3 space-y-1">
          <p>Size: {formatFileSize(file.fileSize)}</p>
          <p>Uploaded: {formatDate(file.createdAt)}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⬇️ Download
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
