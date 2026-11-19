import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoCard } from './VideoCard';

export function VideoRow({ title, videos = [], isTrending = false, showProgress = false }) {
  const rowRef = useRef(null);

  if (!videos || videos.length === 0) return null;

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative py-4 space-y-3 group/row">
      {/* Row Title */}
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center space-x-2">
          <span>{title}</span>
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
            ({videos.length})
          </span>
        </h2>
      </div>

      {/* Row Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-30 w-12 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
          aria-label="Défiler vers la gauche"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* Horizontal scroll container */}
        <div
          ref={rowRef}
          className="flex space-x-4 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 py-2"
        >
          {videos.map((item, index) => {
            const video = item.video || item;
            return (
              <VideoCard
                key={video.id || index}
                video={video}
                rank={isTrending ? index + 1 : null}
                progressPercent={item.progressPercent}
                showProgress={showProgress}
              />
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
          aria-label="Défiler vers la droite"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
