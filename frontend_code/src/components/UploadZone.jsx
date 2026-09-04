import React, { useState, useRef } from 'react';
import { mediaAPI } from '../services/api';

const UploadZone = ({ groupId, onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Please upload an image or video file');
      return;
    }

    setUploading(true);
    try {
      const response = await mediaAPI.uploadFile(file, groupId, description);
      if (response.data.success) {
        onUploadSuccess(response.data.file);
        setDescription('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert('Upload failed: ' + response.data.message);
      }
    } catch (error) {
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="text-5xl mb-4">☁️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Drag and drop your files here
        </h2>
        <p className="text-gray-600 mb-4">or click to browse</p>
        <p className="text-sm text-gray-500">Supported formats: Images (JPG, PNG, GIF) & Videos (MP4, WebM, OGV)</p>
        <p className="text-sm text-gray-500">Maximum file size: 500MB</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        accept="image/*,video/*"
        style={{ display: 'none' }}
      />

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description for this file..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Uploading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
