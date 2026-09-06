import React from 'react';
import { getStreamUrl } from '../services/api';
import { PlayIcon } from './Icons';

const MediaCard = ({ file, groupId, isAdmin, onPreview }) => {
  const isImage = file.mediaType === 'IMAGE';
  const isVideo = file.mediaType === 'VIDEO';

  return (
    <div
      onClick={() => onPreview(file)}
      style={{ aspectRatio: '1', background: '#E5E5EA' }}
      className="relative cursor-pointer"
    >
      {isImage && (
        <img
          src={getStreamUrl(file.id, groupId, isAdmin)}
          alt={file.originalFilename}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      )}
      {isVideo && (
        <>
          <video
            src={getStreamUrl(file.id, groupId, isAdmin)}
            preload="metadata"
            className="w-full h-full object-cover"
          />
          <div
            style={{ background: 'rgba(0,0,0,0.55)' }}
            className="absolute bottom-1 right-1 text-white rounded-full p-1"
          >
            <PlayIcon size={11} />
          </div>
        </>
      )}
    </div>
  );
};

export default MediaCard;
