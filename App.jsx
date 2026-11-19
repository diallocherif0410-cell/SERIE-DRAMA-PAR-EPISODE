import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { Navbar } from './components/Navbar';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoModal } from './components/VideoModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdminStudio } from './components/AdminStudio';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { TrendingPage } from './pages/TrendingPage';
import { Play, Shield, Activity, Film, Heart } from 'lucide-react';

function MainLayout() {
  const { user } = useAuth();
  const { playingVideo, initialTime } = usePlayer();

  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      setActiveTab('catalog');
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSearchQuery={handleSearch}
      />

      {/* Main Page View */}
      <main className="flex-1">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'drama' && <HomePage dramaOnly={true} />}
        {activeTab === 'catalog' && (
          <CatalogPage initialSearch={searchQuery} />
        )}
        {activeTab === 'trending' && <TrendingPage />}
        {activeTab === 'watchlist' && (
          <WatchlistPage onExplore={() => setActiveTab('catalog')} />
        )}
        {activeTab === 'admin' && <AdminStudio />}
      </main>

      {/* Video Player Overlay (Active when watching) */}
      {playingVideo && (
        <VideoPlayer video={playingVideo} initialTime={initialTime} />
      )}

      {/* Quick Details Modal */}
      <VideoModal />

      {/* Subscription Plans Modal */}
      <SubscriptionModal />

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              <span className="text-sm font-black text-white tracking-tight">
                CINE<span className="text-red-500">STREAM</span>
              </span>
              <span className="text-[11px] text-zinc-400">| Séries Drama par Épisode & VOD ABR</span>
            </div>

            <div className="flex items-center space-x-6 text-zinc-400">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>QoE Buffering &lt; 1%</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Film className="w-3.5 h-3.5 text-red-400" />
                <span>FFmpeg HLS Ingestion</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Contrôle Parental Multi-profils</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-zinc-900 text-zinc-400">
            <div className="space-y-2">
              <div className="font-bold text-white uppercase text-[11px]">Séries Drama</div>
              <div>Épisodes quotidiens</div>
              <div>Navigation Saison / Épisode</div>
              <div>Bouton Épisode Suivant</div>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-white uppercase text-[11px]">Architecture TRD</div>
              <div>Vite + React + Tailwind</div>
              <div>Node.js REST API & Stream</div>
              <div>Transcodeur FFmpeg ABR</div>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-white uppercase text-[11px]">Accessibilité</div>
              <div>Conformité WCAG 2.1 AA</div>
              <div>Raccourcis clavier (Espace, N, M, F)</div>
              <div>Dark Mode natif cinéma</div>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-white uppercase text-[11px]">CineStream</div>
              <div>Streaming vidéo à la demande</div>
              <div>Expérience multi-profils</div>
              <div>GitHub: diallocherif0410-cell</div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-zinc-500">
            <div>© 2026 SERIE-DRAMA-PAR-EPISODE • CineStream VOD.</div>
            <div className="mt-2 sm:mt-0 flex items-center space-x-1">
              <span>Projet 1 Streaming Vidéo Drama</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <MainLayout />
      </PlayerProvider>
    </AuthProvider>
  );
}
