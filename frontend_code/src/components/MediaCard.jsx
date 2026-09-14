import React, { useState } from 'react';
import { getThumbnailUrl } from '../services/api';
import { PlayIcon, StarIcon } from './Icons';

const MediaCard = ({ file, groupId, isAdmin, onPreview, onToggleFavorite }) => {
  const isImage = file.mediaType === 'IMAGE';
  const isVideo = file.mediaType === 'VIDEO';

  // Every file gets a generated thumbnail now (backfilled for pre-existing
  // ones too) except files with no actual decodable media data (e.g.
  // corrupted/truncated uploads) - ffmpeg can never produce a frame for
  // those, so there's nothing to fall back to. Rather than fetching the
  // full original just to render a gallery tile (expensive for large videos
  // and images alike, and exhausts the backend's connection pool with
  // hundreds of tiles), those just show the plain placeholder tile.
  const [thumbnailFailed, setThumbnailFailed] = useState(!file.hasThumbnail);

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
      {isImage && !thumbnailFailed && (
        <img
          src={getThumbnailUrl(file.id, groupId, isAdmin)}
          alt={file.originalFilename}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setThumbnailFailed(true)}
        />
      )}
      {isVideo && (
        <>
          {!thumbnailFailed && (
            <img
              src={getThumbnailUrl(file.id, groupId, isAdmin)}
              alt={file.originalFilename}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={() => setThumbnailFailed(true)}
            />
          )}
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
