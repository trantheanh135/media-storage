import React, { useState, useRef } from 'react';
import { mediaAPI } from '../services/api';
import { CloudIcon } from './Icons';

const UploadZone = ({ groupId, onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
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
    handleFiles(e.dataTransfer.files);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );

    if (files.length === 0) {
      alert('Please select image or video files');
      return;
    }

    setUploading(true);
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      try {
        const response = await mediaAPI.uploadFile(files[i], groupId, description);
        if (response.data.success) {
          onUploadSuccess(response.data.file);
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    setUploading(false);
    setUploadProgress(null);
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (failCount > 0) {
      alert(`${files.length - failCount} of ${files.length} file(s) uploaded. ${failCount} failed.`);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{ borderColor: isDragging ? '#007AFF' : '#D1D1D6', background: isDragging ? '#F0F7FF' : 'transparent' }}
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
      >
        <div style={{ color: '#8E8E93' }} className="flex justify-center mb-3">
          <CloudIcon size={36} />
        </div>
        <h2 style={{ color: '#000' }} className="text-base font-semibold mb-1">
          Drag and drop, or tap to browse
        </h2>
        <p style={{ color: '#8E8E93' }} className="text-sm mb-3">Select multiple files, or an entire folder's contents</p>
        <p style={{ color: '#AEAEB2' }} className="text-xs">Images &amp; videos, up to 500MB each</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        accept="image/*,video/*"
        style={{ display: 'none' }}
      />

      <div className="mt-4">
        <label style={{ color: '#3C3C43' }} className="block text-sm font-medium mb-1.5">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          style={{ background: '#F2F2F7' }}
          className="w-full px-3 py-2 rounded-lg text-[15px] outline-none"
          rows="2"
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#007AFF', borderTopColor: 'transparent' }}></div>
            <span style={{ color: '#8E8E93' }} className="text-sm">
              {uploadProgress
                ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}...`
                : 'Uploading...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
