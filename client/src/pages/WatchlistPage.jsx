import React, { useState, useEffect } from 'react';
import { Bookmark, RefreshCw, Film } from 'lucide-react';
import { VideoCard } from '../components/VideoCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';

export function WatchlistPage({ onExplore }) {
  const { activeProfile } = useAuth();
  const { watchlistIds } = usePlayer();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWatchlist() {
      if (!activeProfile) return;
      setLoading(true);
      try {
        const list = await api.getWatchlist(activeProfile.id);
        setVideos(list);
      } catch (err) {
        console.error('Watchlist load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWatchlist();
  }, [activeProfile, watchlistIds]);

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="border-b border-zinc-800 pb-6">
        <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
          <Bookmark className="w-4 h-4 fill-current" />
          <span>Sélection personnelle</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Ma Liste de Favoris
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Retrouvez les films et séries que vous avez sauvegardés pour plus tard sur le profil {activeProfile?.name}.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
          <div className="text-xs text-zinc-400">Chargement de votre liste...</div>
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-4">
          <Film className="w-12 h-12 text-zinc-600 mx-auto" />
          <div className="text-lg font-bold text-white">Votre liste est encore vide</div>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Ajoutez des films et séries à votre liste en cliquant sur l'icône « + » depuis la page d'accueil ou les fiches détaillées.
          </p>
          <button
            onClick={onExplore}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 hover:scale-105"
          >
            Découvrir le catalogue
          </button>
        </div>
      )}
    </div>
  );
}
