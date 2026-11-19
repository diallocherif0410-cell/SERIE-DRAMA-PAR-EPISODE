import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Search,
  Bell,
  ChevronDown,
  User,
  Shield,
  Film,
  Sparkles,
  LogOut,
  Sliders,
  Check,
  Plus,
  Tv,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';

export function Navbar({ activeTab, onTabChange, onSearchQuery }) {
  const { user, profiles, activeProfile, selectProfile, loginWithAdmin, loginWithDemo, logout } = useAuth();
  const { setShowSubscriptionModal, openModal } = usePlayer();

  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const results = await api.searchAutocomplete(searchTerm);
        setSuggestions(results);
      } catch (err) {
        console.error('Autocomplete error:', err);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchQuery) {
      onSearchQuery(searchTerm);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      await loginWithAdmin(adminPassword);
      setAdminPassword('');
      setAdminLoginError('');
      setShowAdminLogin(false);
      setShowProfileMenu(false);
    } catch (error) {
      setAdminLoginError(error.message);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
        isScrolled ? 'bg-[#141414]/95 backdrop-blur-md shadow-2xl' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Brand Logo & Navigation Links */}
        <div className="flex items-center space-x-8">
          <button
            onClick={() => onTabChange('home')}
            className="flex items-center space-x-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-red-700 to-red-500 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center">
                CINE<span className="text-red-500">STREAM</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold -mt-1">
                Drama & VOD
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-5 text-sm font-medium">
            <button
              onClick={() => onTabChange('home')}
              className={`transition-colors hover:text-white ${
                activeTab === 'home' ? 'text-white font-bold border-b-2 border-red-600 pb-0.5' : 'text-zinc-300'
              }`}
            >
              Accueil
            </button>
            <button
              onClick={() => onTabChange('drama')}
              className={`transition-colors hover:text-white flex items-center space-x-1 ${
                activeTab === 'drama' ? 'text-white font-bold border-b-2 border-red-600 pb-0.5' : 'text-zinc-300'
              }`}
            >
              <span>Séries Drama</span>
              <span className="text-[10px] bg-red-600/40 text-red-300 px-1.5 py-0.2 rounded font-bold uppercase">
                Épisodes
              </span>
            </button>
            <button
              onClick={() => onTabChange('catalog')}
              className={`transition-colors hover:text-white ${
                activeTab === 'catalog' ? 'text-white font-bold border-b-2 border-red-600 pb-0.5' : 'text-zinc-300'
              }`}
            >
              Films & Séries
            </button>
            <button
              onClick={() => onTabChange('trending')}
              className={`transition-colors hover:text-white ${
                activeTab === 'trending' ? 'text-white font-bold border-b-2 border-red-600 pb-0.5' : 'text-zinc-300'
              }`}
            >
              Tendances
            </button>
            <button
              onClick={() => onTabChange('watchlist')}
              className={`transition-colors hover:text-white ${
                activeTab === 'watchlist' ? 'text-white font-bold border-b-2 border-red-600 pb-0.5' : 'text-zinc-300'
              }`}
            >
              Ma Liste
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => onTabChange('admin')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                    : 'bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Studio Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Search, Plan Badge, Profile Switcher */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <div
                className={`flex items-center transition-all duration-300 rounded-full border ${
                  searchOpen
                    ? 'w-56 sm:w-72 bg-zinc-900/90 border-zinc-600 px-3 py-1.5'
                    : 'w-9 h-9 bg-transparent border-transparent justify-center'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(!searchOpen);
                    if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                  className="text-zinc-300 hover:text-white focus:outline-none"
                  aria-label="Recherche"
                >
                  <Search className="w-5 h-5" />
                </button>
                {searchOpen && (
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (onSearchQuery) onSearchQuery(e.target.value);
                    }}
                    placeholder="Titre, acteur, réalisateur..."
                    className="ml-2 w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
                  />
                )}
              </div>
            </form>

            {searchOpen && suggestions.length > 0 && (
              <div className="absolute top-12 right-0 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden py-2 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Résultats suggérés
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      openModal(item);
                      setSearchOpen(false);
                      setSearchTerm('');
                    }}
                    className="w-full px-3 py-2 flex items-center space-x-3 hover:bg-zinc-800/80 transition-colors text-left"
                  >
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded shadow"
                    />
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium text-white truncate">{item.title}</div>
                      <div className="text-xs text-zinc-400 flex items-center space-x-2">
                        <span>{item.releaseYear}</span>
                        <span>•</span>
                        <span className="text-yellow-500 font-semibold">★ {item.rating}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeProfile?.isKids && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Espace Kids
            </span>
          )}

          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="hidden sm:flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-red-600/30 to-amber-600/30 border border-red-500/40 text-red-200 hover:border-red-400 hover:text-white transition-all shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{user?.plan === 'premium' ? '4K Ultra HD' : user?.plan === 'standard' ? 'Standard HD' : 'Gratuit'}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 focus:outline-none group"
            >
              <img
                src={activeProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                alt={activeProfile?.name || 'Profil'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-md object-cover border-2 border-transparent group-hover:border-white transition-all shadow"
              />
              <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-3 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-3 px-2 z-50 animate-scale-up"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="px-3 py-1.5 mb-2 border-b border-zinc-800/80">
                  <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
                    Changer de profil
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        selectProfile(p);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-7 h-7 rounded object-cover shadow"
                        />
                        <span className="text-sm font-medium text-white">{p.name}</span>
                        {p.isKids && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                            Enfant
                          </span>
                        )}
                      </div>
                      {activeProfile?.id === p.id && (
                        <Check className="w-4 h-4 text-red-500 font-bold" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-zinc-800/80 pt-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowSubscriptionModal(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Gérer mon abonnement</span>
                  </button>

                  {user?.role !== 'admin' ? (
                    <button
                      onClick={() => setShowAdminLogin(value => !value)}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Connexion Studio Admin</span>
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        await loginWithDemo();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-zinc-800 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Basculer en mode Spectateur</span>
                    </button>
                  )}

                  {showAdminLogin && user?.role !== 'admin' && (
                    <form onSubmit={handleAdminLogin} className="px-3 py-2 space-y-2">
                      <label className="block text-xs text-zinc-300" htmlFor="admin-password">
                        Mot de passe administrateur
                      </label>
                      <input
                        id="admin-password"
                        type="password"
                        value={adminPassword}
                        onChange={event => setAdminPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                      />
                      {adminLoginError && <p role="alert" className="text-xs text-red-400">{adminLoginError}</p>}
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500"
                      >
                        Se connecter
                      </button>
                    </form>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
