import React from 'react';
import { getStreamUrl } from '../services/api';
import { PlayIcon, StarIcon } from './Icons';

const MediaCard = ({ file, groupId, isAdmin, onPreview, onToggleFavorite }) => {
  const isImage = file.mediaType === 'IMAGE';
  const isVideo = file.mediaType === 'VIDEO';

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite?.(file);
  };

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
            muted
            playsInline
            className="w-full h-full object-cover"
            // preload="metadata" alone leaves a blank/black tile in most
            // browsers - nudging currentTime forces the browser to decode
            // and paint the frame at that point as a thumbnail.
            onLoadedMetadata={(e) => {
              try {
                e.currentTarget.currentTime = Math.min(0.1, e.currentTarget.duration || 0);
              } catch {
                // ignore - some browsers throw if metadata isn't fully ready
              }
            }}
          />
          <div
            style={{ background: 'rgba(0,0,0,0.55)' }}
            className="absolute bottom-1 right-1 text-white rounded-full p-1"
          >
            <PlayIcon size={11} />
          </div>
        </>
      )}
      {onToggleFavorite && (
        <button
          onClick={handleFavoriteClick}
          style={{ background: 'rgba(0,0,0,0.55)', color: file.favorite ? '#FFD60A' : '#fff' }}
          className="absolute top-1 right-1 rounded-full p-1 leading-none"
          aria-label={file.favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <StarIcon size={13} filled={!!file.favorite} />
        </button>
      )}
    </div>
  );
};

export default MediaCard;
