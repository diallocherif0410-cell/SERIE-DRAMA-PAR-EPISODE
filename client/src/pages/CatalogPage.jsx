import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, Search, RefreshCw } from 'lucide-react';
import { VideoCard } from '../components/VideoCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function CatalogPage({ initialSearch = '' }) {
  const { activeProfile } = useAuth();
  const [videos, setVideos] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    api.getGenres().then(setGenres).catch(() => {});
  }, []);

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const params = {
          sort: selectedSort,
          ...(selectedGenre !== 'all' ? { genre: selectedGenre } : {}),
          ...(selectedYear ? { year: selectedYear } : {}),
          ...(searchQuery ? { search: searchQuery } : {}),
          ...(activeProfile?.isKids ? { isKids: true } : {})
        };
        const data = await api.getVideos(params);
        setVideos(data);
      } catch (err) {
        console.error('Catalog fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [selectedGenre, selectedYear, selectedSort, searchQuery, activeProfile]);

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Films, Séries & Documentaires
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Explorez notre catalogue VOD complet encodé en ABR multi-résolutions.
          </p>
        </div>

        {/* Search input in catalog */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par mot-clé..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center space-x-2 text-xs font-bold text-zinc-400 pr-2 border-r border-zinc-800">
          <Filter className="w-4 h-4 text-red-500" />
          <span>Filtres :</span>
        </div>

        {/* Genre Pill Selector */}
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="bg-zinc-950 border border-zinc-700 text-xs font-semibold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500"
        >
          <option value="all">Tous les genres</option>
          {genres.map((g) => (
            <option key={g.name} value={g.name}>
              {g.name} ({g.count})
            </option>
          ))}
        </select>

        {/* Year Filter */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-zinc-950 border border-zinc-700 text-xs font-semibold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500"
        >
          <option value="">Toutes les années</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>

        {/* Sort Filter */}
        <div className="ml-auto flex items-center space-x-2">
          <span className="text-xs text-zinc-500 font-medium">Trier par :</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 text-xs font-semibold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500"
          >
            <option value="popular">Popularité</option>
            <option value="rating">Meilleures notes</option>
            <option value="newest">Plus récents</option>
          </select>
        </div>
      </div>

      {/* Grid of Video Cards */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
          <div className="text-xs text-zinc-400">Chargement du catalogue...</div>
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-3">
          <div className="text-lg font-bold text-white">Aucun titre ne correspond à vos critères</div>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Essayez de réinitialiser vos filtres ou de chercher un autre mot-clé.
          </p>
          <button
            onClick={() => {
              setSelectedGenre('all');
              setSelectedYear('');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
