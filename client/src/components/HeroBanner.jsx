import React, { useState } from 'react';
import { Play, Info, Volume2, VolumeX, Plus, Check } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function HeroBanner({ movie }) {
  const { startPlayback, openModal, watchlistIds, toggleWatchlistId } = usePlayer();
  const { activeProfile } = useAuth();
  const [isMuted, setIsMuted] = useState(true);

  if (!movie) return null;

  const inWatchlist = watchlistIds.has(movie.id);

  const handleToggleWatchlist = async () => {
    if (!activeProfile) return;
    toggleWatchlistId(movie.id);
    try {
      await api.toggleWatchlist(activeProfile.id, movie.id);
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    }
  };

  return (
    <div className="relative w-full h-[75vh] sm:h-[85vh] lg:h-[92vh] overflow-hidden select-none">
      {/* Background Media / Backdrop */}
      <img
        src={movie.backdropUrl || movie.posterUrl}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
      />

      {/* Gradients */}
      <div className="absolute inset-0 hero-vignette" />
      <div className="absolute inset-0 hero-bottom-fade" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />

      {/* Hero Content */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-24 sm:pb-32">
        <div className="max-w-2xl space-y-4">
          {/* Top Tag */}
          <div className="flex items-center space-x-2">
            <span className="bg-red-600 text-white text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow">
              EXCLUSIVITÉ
            </span>
            <span className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">
              CineStream Original
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md leading-tight">
            {movie.title}
          </h1>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <span className="text-emerald-400 font-bold">98% de recommandation</span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-300">{movie.releaseYear}</span>
            <span className="text-zinc-400">•</span>
            <span className="border border-zinc-500/80 px-1.5 py-0.5 rounded text-[11px] uppercase text-zinc-300">
              {movie.maturityRating}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-300">{movie.durationFormatted}</span>
            <span className="border border-red-500/60 bg-red-950/30 text-red-300 text-[10px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
              4K HDR ABR
            </span>
          </div>

          {/* Tagline / Synopsis */}
          <p className="text-sm sm:text-base text-zinc-300 line-clamp-3 leading-relaxed drop-shadow">
            {movie.description}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3.5 pt-2">
            <button
              onClick={() => startPlayback(movie)}
              className="flex items-center space-x-2.5 bg-white hover:bg-zinc-200 text-black font-bold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span className="text-sm sm:text-base">Lecture</span>
            </button>

            <button
              onClick={() => openModal(movie)}
              className="flex items-center space-x-2 bg-zinc-800/80 hover:bg-zinc-700/90 text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-zinc-700/60"
            >
              <Info className="w-5 h-5 text-zinc-300" />
              <span className="text-sm sm:text-base">Plus d'infos</span>
            </button>

            <button
              onClick={handleToggleWatchlist}
              className={`p-3 rounded-xl border backdrop-blur-md transition-all hover:scale-105 ${
                inWatchlist
                  ? 'bg-red-600/30 border-red-500 text-red-400'
                  : 'bg-zinc-800/80 border-zinc-700/60 text-white hover:bg-zinc-700'
              }`}
              title={inWatchlist ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
            >
              {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-zinc-300 hover:text-white backdrop-blur-md transition-all hover:scale-105"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
