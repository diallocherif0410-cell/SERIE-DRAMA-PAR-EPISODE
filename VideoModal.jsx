import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Plus,
  Check,
  ThumbsUp,
  ThumbsDown,
  Star,
  Film,
  Calendar,
  Clock,
  Send,
  MessageSquare,
  Tv,
  ListVideo
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function VideoModal() {
  const { modalVideo, closeModal, startPlayback, watchlistIds, toggleWatchlistId, openModal } = usePlayer();
  const { activeProfile } = useAuth();

  const [fullVideo, setFullVideo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userStars, setUserStars] = useState(5);
  const [reviewInput, setReviewInput] = useState('');
  const [hasLiked, setHasLiked] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('episodes'); // 'episodes' | 'details'

  useEffect(() => {
    if (!modalVideo) return;
    setFullVideo(modalVideo);
    setActiveTab(modalVideo.episodes?.length ? 'episodes' : 'details');

    // Fetch full details & recommendations
    api.getVideo(modalVideo.id)
      .then(data => {
        setFullVideo(data);
      })
      .catch(e => console.error(e));

    // Fetch reviews
    api.getReviews(modalVideo.id)
      .then(revs => setReviews(revs))
      .catch(() => {});
  }, [modalVideo]);

  if (!modalVideo || !fullVideo) return null;

  const inWatchlist = watchlistIds.has(fullVideo.id);
  const hasEpisodes = fullVideo.episodes && fullVideo.episodes.length > 0;

  const handleToggleWatchlist = async () => {
    if (!activeProfile) return;
    toggleWatchlistId(fullVideo.id);
    try {
      await api.toggleWatchlist(activeProfile.id, fullVideo.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleThumb = async (isUp) => {
    if (!activeProfile) return;
    setHasLiked(isUp);
    try {
      const res = await api.rateVideo(fullVideo.id, activeProfile.id, {
        isThumbUp: isUp,
        stars: isUp ? 5 : 2
      });
      setFullVideo(prev => ({
        ...prev,
        likesCount: res.likesCount,
        dislikesCount: res.dislikesCount,
        rating: res.rating
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!activeProfile || !reviewInput.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.rateVideo(fullVideo.id, activeProfile.id, {
        stars: userStars,
        isThumbUp: userStars >= 3,
        reviewText: reviewInput.trim()
      });

      setReviews(prev => [
        {
          id: `rev_${Date.now()}`,
          authorName: activeProfile.name,
          stars: userStars,
          reviewText: reviewInput.trim(),
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
      setReviewInput('');
      setFullVideo(prev => ({
        ...prev,
        rating: res.rating
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={closeModal} />

      {/* Modal Dialog Box */}
      <div className="relative z-10 w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl my-8 text-white max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-zinc-950/80 hover:bg-zinc-800 text-white transition-all shadow-lg"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Banner Header */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-zinc-950 flex-shrink-0">
          <img
            src={fullVideo.backdropUrl || fullVideo.posterUrl}
            alt={fullVideo.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

          {/* Banner Quick Actions */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center space-x-3.5">
            <button
              onClick={() => {
                closeModal();
                startPlayback(fullVideo, 0, hasEpisodes ? fullVideo.episodes[0] : null);
              }}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
              <span>{hasEpisodes ? 'Regarder l’Épisode 1' : 'Regarder'}</span>
            </button>

            <button
              onClick={handleToggleWatchlist}
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-all hover:scale-105 ${
                inWatchlist
                  ? 'bg-red-600/30 border-red-500 text-red-400'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white'
              }`}
              title={inWatchlist ? 'Dans ma liste' : 'Ajouter à ma liste'}
            >
              {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>

            <button
              onClick={() => handleThumb(true)}
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-all hover:scale-105 ${
                hasLiked === true
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-400'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white'
              }`}
              title="J'aime"
            >
              <ThumbsUp className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleThumb(false)}
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-all hover:scale-105 ${
                hasLiked === false
                  ? 'bg-red-600/30 border-red-500 text-red-400'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white'
              }`}
              title="Je n'aime pas"
            >
              <ThumbsDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold">
                <span className="text-emerald-400 font-bold">★ {fullVideo.rating} / 5</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300">{fullVideo.releaseYear}</span>
                <span className="text-zinc-500">•</span>
                <span className="border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">
                  {fullVideo.maturityRating}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300">{fullVideo.durationFormatted}</span>
                {hasEpisodes && (
                  <span className="bg-red-600/30 border border-red-500/40 text-red-300 text-[11px] px-2 py-0.5 rounded font-bold">
                    Série Drama par Épisode
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white">{fullVideo.title}</h2>
              {fullVideo.tagline && (
                <p className="text-sm font-medium italic text-zinc-400">{fullVideo.tagline}</p>
              )}
              <p className="text-sm text-zinc-300 leading-relaxed">
                {fullVideo.description}
              </p>
            </div>

            {/* Right Meta Column */}
            <div className="space-y-2.5 text-xs bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/80 h-fit">
              <div>
                <span className="text-zinc-500 font-medium">Réalisateur :</span>{' '}
                <span className="text-zinc-300 font-semibold">{fullVideo.director}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Distribution :</span>{' '}
                <span className="text-zinc-300">
                  {fullVideo.cast?.join(', ') || 'Non spécifié'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Genres :</span>{' '}
                <span className="text-zinc-300">
                  {fullVideo.genres?.join(', ') || 'Général'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Pistes Audio :</span>{' '}
                <span className="text-zinc-300">
                  {fullVideo.audioTracks?.map(a => a.label).join(', ') || 'Français (Stéréo)'}
                </span>
              </div>
            </div>
          </div>

          {/* SÉRIES DRAMA : Navigation des Épisodes */}
          {hasEpisodes && (
            <div className="border-t border-zinc-800 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ListVideo className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-black text-white">
                    Épisodes Disponibles ({fullVideo.episodes.length})
                  </h3>
                </div>
                <div className="text-xs bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-lg font-bold text-zinc-300">
                  Saison 1
                </div>
              </div>

              {/* Episodes List Grid */}
              <div className="space-y-3">
                {fullVideo.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => {
                      closeModal();
                      startPlayback(fullVideo, 0, ep);
                    }}
                    className="group flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-all"
                  >
                    {/* Thumbnail with hover play */}
                    <div className="relative w-full sm:w-40 aspect-[16/9] flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900">
                      <img
                        src={ep.thumbnailUrl || fullVideo.backdropUrl}
                        alt={ep.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300">
                        {ep.durationFormatted}
                      </div>
                    </div>

                    {/* Episode Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                          {ep.title}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {ep.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Reviews & Ratings Section */}
          <div className="border-t border-zinc-800 pt-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-red-500" />
              <span>Avis et notes des spectateurs ({reviews.length})</span>
            </h3>

            {/* Leave a review form */}
            <form onSubmit={handleReviewSubmit} className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Votre évaluation :</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserStars(star)}
                      className="p-1 text-zinc-600 hover:text-yellow-400 transition-colors"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= userStars ? 'text-yellow-400 fill-current' : ''
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={reviewInput}
                  onChange={(e) => setReviewInput(e.target.value)}
                  placeholder="Partagez votre avis sur ce drama..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !reviewInput.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Publier</span>
                </button>
              </div>
            </form>

            {/* Reviews List */}
            {reviews.length > 0 && (
              <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar pr-2">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-zinc-950/40 border border-zinc-800/80 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{rev.authorName}</span>
                      <div className="flex text-yellow-400">
                        {Array.from({ length: rev.stars || 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300">{rev.reviewText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
