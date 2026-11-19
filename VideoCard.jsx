import React from 'react';
import { Play, Plus, Check, Info, ThumbsUp, Star } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function VideoCard({ video, progressPercent, showProgress = false, rank = null }) {
  const { startPlayback, openModal, watchlistIds, toggleWatchlistId } = usePlayer();
  const { activeProfile } = useAuth();

  const inWatchlist = watchlistIds.has(video.id);

  const handleToggleWatchlist = async (e) => {
    e.stopPropagation();
    if (!activeProfile) return;
    toggleWatchlistId(video.id);
    try {
      await api.toggleWatchlist(activeProfile.id, video.id);
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    }
  };

  return (
    <div
      onClick={() => openModal(video)}
      className="group relative flex-none w-44 sm:w-56 md:w-64 cursor-pointer select-none rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:z-30"
    >
      {/* Rank number for Top 10 Trending */}
      {rank && (
        <div className="absolute top-2 left-2 z-20 w-8 h-8 rounded-lg bg-red-600/90 text-white font-black flex items-center justify-center text-sm shadow-lg">
          #{rank}
        </div>
      )}

      {/* Poster Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-800">
        <img
          src={video.backdropUrl || video.posterUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

        {/* Play Icon overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startPlayback(video);
            }}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </button>
        </div>

        {/* Progress bar for "Continuer la lecture" */}
        {showProgress && progressPercent !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-700">
            <div
              className="h-full bg-red-600 rounded-r"
              style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Info Details */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center space-x-1 text-xs text-yellow-500 font-bold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{video.rating}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-zinc-400 font-medium">
          <span className="border border-zinc-700 px-1 rounded text-[10px] text-zinc-300">
            {video.maturityRating}
          </span>
          <span>{video.durationFormatted}</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">96% match</span>
        </div>

        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1 pt-1">
          {video.genres?.slice(0, 2).map((g) => (
            <span
              key={g}
              className="text-[10px] bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Hover Quick Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startPlayback(video);
              }}
              className="p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors"
              title="Lecture directe"
            >
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </button>
            <button
              onClick={handleToggleWatchlist}
              className={`p-1.5 rounded-full border transition-colors ${
                inWatchlist
                  ? 'bg-red-950/60 border-red-500 text-red-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700'
              }`}
              title={inWatchlist ? 'Dans ma liste' : 'Ajouter à ma liste'}
            >
              {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal(video);
            }}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Détails complets"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
