import React, { useState, useEffect } from 'react';
import { Flame, RefreshCw } from 'lucide-react';
import { VideoCard } from '../components/VideoCard';
import { api } from '../services/api';

export function TrendingPage() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTrending()
      .then(setTrending)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="border-b border-zinc-800 pb-6">
        <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
          <Flame className="w-4 h-4 fill-current" />
          <span>Classement en temps réel</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Top 10 des Tendances CineStream
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Les œuvres les plus visionnées et les mieux notées par la communauté cette semaine.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
          <div className="text-xs text-zinc-400">Chargement des tendances...</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {trending.map((video, index) => (
            <VideoCard key={video.id} video={video} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
