import React, { createContext, useContext, useState } from 'react';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [playingVideo, setPlayingVideo] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [initialTime, setInitialTime] = useState(0);
  const [modalVideo, setModalVideo] = useState(null);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  function startPlayback(video, resumeAt = 0, episode = null) {
    setPlayingVideo(video);
    setActiveEpisode(episode || (video.episodes ? video.episodes[0] : null));
    setInitialTime(resumeAt);
    setModalVideo(null); // close modal if open
  }

  function playNextEpisode() {
    if (!playingVideo || !playingVideo.episodes || !activeEpisode) return;
    const currentIndex = playingVideo.episodes.findIndex(e => e.id === activeEpisode.id);
    if (currentIndex !== -1 && currentIndex < playingVideo.episodes.length - 1) {
      const nextEp = playingVideo.episodes[currentIndex + 1];
      setActiveEpisode(nextEp);
      setInitialTime(0);
    }
  }

  function selectEpisode(episode) {
    setActiveEpisode(episode);
    setInitialTime(0);
  }

  function stopPlayback() {
    setPlayingVideo(null);
    setActiveEpisode(null);
    setInitialTime(0);
  }

  function openModal(video) {
    setModalVideo(video);
  }

  function closeModal() {
    setModalVideo(null);
  }

  function toggleWatchlistId(videoId) {
    setWatchlistIds(prev => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
  }

  return (
    <PlayerContext.Provider
      value={{
        playingVideo,
        activeEpisode,
        initialTime,
        modalVideo,
        watchlistIds,
        showSubscriptionModal,
        setShowSubscriptionModal,
        setWatchlistIds,
        startPlayback,
        playNextEpisode,
        selectEpisode,
        stopPlayback,
        openModal,
        closeModal,
        toggleWatchlistId
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
}
