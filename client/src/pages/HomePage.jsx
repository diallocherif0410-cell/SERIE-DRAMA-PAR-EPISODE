import React, { useState, useEffect } from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { VideoRow } from '../components/VideoRow';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { Sparkles, Heart } from 'lucide-react';

export function HomePage({ dramaOnly = false }) {
  const { activeProfile } = useAuth();
  const { setWatchlistIds } = usePlayer();

  const [featured, setFeatured] = useState(null);
  const [trending, setTrending] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHome() {
      try {
        setLoading(true);
        const [feat, trend, vids] = await Promise.all([
          api.getFeatured(),
          api.getTrending(),
          api.getVideos(activeProfile?.isKids ? { isKids: true } : {})
        ]);

        setFeatured(feat);
        setTrending(trend);
        setAllVideos(vids);

        if (activeProfile) {
          const [cont, wl] = await Promise.all([
            api.getContinueWatching(activeProfile.id),
            api.getWatchlist(activeProfile.id)
          ]);
          setContinueWatching(cont);
          setWatchlistIds(new Set(wl.map(w => w.id)));
        }
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHome();
  }, [activeProfile]);

  // Group videos by category
  const dramaSeries = allVideos.filter(v => v.type === 'series' || v.genres?.includes('Drama') || v.genres?.includes('Série'));
  const sciFiVideos = allVideos.filter(v => v.genres?.includes('Science-Fiction'));
  const animVideos = allVideos.filter(v => v.genres?.includes('Animation'));
  const docVideos = allVideos.filter(v => v.genres?.includes('Documentaire'));
  const actionVideos = allVideos.filter(v => v.genres?.includes('Action'));

  // If dramaOnly tab is selected
  if (dramaOnly) {
    return (
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div className="border-b border-zinc-800 pb-6">
          <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 fill-current" />
            <span>Catalogue Épisodique</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Séries Drama par Épisode
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Des séries drama disponibles tous les jours avec visionnage épisode par épisode et reprise synchronisée.
          </p>
        </div>

        <div className="space-y-6">
          <VideoRow
            title="Séries Drama Phares (Saison 1 complète)"
            videos={dramaSeries}
          />

          <VideoRow
            title="Romances & Tensions Passionnelles"
            videos={dramaSeries.filter(d => d.genres?.includes('Romance'))}
          />

          <VideoRow
            title="Suspense, Pouvoir & Mystère"
            videos={dramaSeries.filter(d => d.genres?.includes('Suspense') || d.genres?.includes('Fantastique'))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6">
      {/* Hero Banner */}
      <HeroBanner movie={featured} />

      {/* Row Containers with Negative Margin to overlap gradient */}
      <div className="relative z-30 -mt-16 sm:-mt-24 space-y-8">
        {/* Continuer la lecture (Resume watching with progress bar) */}
        {continueWatching.length > 0 && (
          <VideoRow
            title="Continuer la lecture"
            videos={continueWatching}
            showProgress={true}
          />
        )}

        {/* PROMINENT ROW: SÉRIES DRAMA PAR ÉPISODE */}
        {dramaSeries.length > 0 && (
          <VideoRow
            title="🔥 Séries Drama par Épisode (Disponibles tous les jours)"
            videos={dramaSeries}
          />
        )}

        {/* Tendances actuelles (Top 10) */}
        {trending.length > 0 && (
          <VideoRow
            title="Tendances CineStream"
            videos={trending}
            isTrending={true}
          />
        )}

        {/* Science-Fiction */}
        {sciFiVideos.length > 0 && (
          <VideoRow
            title="Science-Fiction & Futurs Dystopiques"
            videos={sciFiVideos}
          />
        )}

        {/* Animation & Famille */}
        {animVideos.length > 0 && (
          <VideoRow
            title="Animation & Merveilles Visuelles"
            videos={animVideos}
          />
        )}

        {/* Documentaires */}
        {docVideos.length > 0 && (
          <VideoRow
            title="Exploration & Documentaires Terrestres"
            videos={docVideos}
          />
        )}

        {/* Action */}
        {actionVideos.length > 0 && (
          <VideoRow
            title="Action, Vitesse & Sensations Fortes"
            videos={actionVideos}
          />
        )}
      </div>
    </div>
  );
}
