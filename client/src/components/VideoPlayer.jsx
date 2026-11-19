import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  ArrowLeft,
  Tv,
  Activity,
  Layers,
  Sparkles,
  SkipForward,
  ListVideo,
  X
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function VideoPlayer({ video, initialTime = 0 }) {
  const { stopPlayback, activeEpisode, playNextEpisode, selectEpisode } = usePlayer();
  const { activeProfile } = useAuth();

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(activeEpisode?.duration || video.duration || 100);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Quality & ABR state
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [effectiveBitrate, setEffectiveBitrate] = useState('Auto (Adaptatif)');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Audio & Subtitles
  const [subtitles, setSubtitles] = useState([]);
  const [activeSubtitle, setActiveSubtitle] = useState('off');
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Series Episodes Drawer inside Player
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState(false);

  // QoE stats monitor
  const [showQoEMonitor, setShowQoEMonitor] = useState(false);
  const [qoeStats, setQoeStats] = useState({
    resolution: '1920x1080',
    bandwidthMbps: 4.8,
    bufferLengthSec: 15,
    droppedFrames: 0,
    streamProtocol: 'HLS / ABR'
  });

  // Hover scrub tooltip
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);

  // Determine current stream source (Episode or Master video)
  const currentStreamUrl = (activeEpisode && activeEpisode.streamUrl) || video.hlsMasterUrl || video.streamUrl;

  // Next episode availability
  const hasEpisodes = video.episodes && video.episodes.length > 0;
  const currentEpIndex = hasEpisodes && activeEpisode ? video.episodes.findIndex(e => e.id === activeEpisode.id) : -1;
  const hasNextEpisode = hasEpisodes && currentEpIndex !== -1 && currentEpIndex < video.episodes.length - 1;
  const nextEpisode = hasNextEpisode ? video.episodes[currentEpIndex + 1] : null;

  // Initialize Video stream & HLS.js
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.volume = volume;

    const streamSource = currentStreamUrl;
    const isHlsStream = streamSource.endsWith('.m3u8') || streamSource.includes('/master.m3u8');

    if (isHlsStream && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
        autoStartLoad: true
      });
      hlsRef.current = hls;

      hls.loadSource(streamSource);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const parsedLevels = data.levels.map((lvl, index) => ({
          index,
          name: `${lvl.height}p`,
          bitrate: Math.round(lvl.bitrate / 1000) + ' kbps',
          height: lvl.height
        }));
        setLevels(parsedLevels);

        if (initialTime > 0) {
          videoElement.currentTime = initialTime;
        }
        videoElement.play().catch(e => console.log('Autoplay handled:', e));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const lvl = hls.levels[data.level];
        if (lvl) {
          setEffectiveBitrate(`${lvl.height}p (${Math.round(lvl.bitrate / 1000)} kbps)`);
          setQoeStats(prev => ({
            ...prev,
            resolution: `${lvl.width}x${lvl.height}`,
            bandwidthMbps: Number((lvl.bitrate / 1000000).toFixed(2))
          }));
        }
      });
    } else {
      videoElement.src = streamSource;
      if (initialTime > 0) {
        videoElement.currentTime = initialTime;
      }
      videoElement.play().catch(e => console.log('Autoplay handled:', e));
    }

    if (video.subtitles && video.subtitles.length > 0) {
      setSubtitles(video.subtitles);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [currentStreamUrl, initialTime]);

  // Periodic progress tracking to backend
  useEffect(() => {
    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current && activeProfile) {
        const curr = videoRef.current.currentTime;
        const dur = videoRef.current.duration || duration;
        if (curr > 3) {
          api.savePlaybackProgress(activeProfile.id, video.id, curr, dur).catch(() => {});
        }
      }
    }, 4000);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (videoRef.current && activeProfile) {
        api.savePlaybackProgress(
          activeProfile.id,
          video.id,
          videoRef.current.currentTime,
          videoRef.current.duration || duration
        ).catch(() => {});
      }
    };
  }, [video, activeProfile, duration]);

  // Controls auto-hide
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekDelta(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekDelta(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyN':
          if (hasNextEpisode) {
            e.preventDefault();
            playNextEpisode();
          }
          break;
        case 'Escape':
          if (showEpisodesDrawer) {
            setShowEpisodesDrawer(false);
          } else if (!isFullscreen) {
            stopPlayback();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isFullscreen, volume, isMuted, hasNextEpisode, showEpisodesDrawer]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekDelta = (delta) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const adjustVolume = (delta) => {
    const next = Math.max(0, Math.min(1, volume + delta));
    setVolume(next);
    if (videoRef.current) {
      videoRef.current.volume = next;
      videoRef.current.muted = next === 0;
      setIsMuted(next === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleQualityChange = (levelIdx) => {
    setCurrentLevel(levelIdx);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIdx;
    }
    setShowQualityMenu(false);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            if (videoRef.current.buffered.length > 0) {
              const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
              setBufferedPercent((bufferedEnd / (videoRef.current.duration || 1)) * 100);
              setQoeStats(prev => ({
                ...prev,
                bufferLengthSec: Math.round(bufferedEnd - videoRef.current.currentTime)
              }));
            }
          }
        }}
        onDurationChange={() => {
          if (videoRef.current && videoRef.current.duration) {
            setDuration(videoRef.current.duration);
          }
        }}
        onEnded={() => {
          if (hasNextEpisode) {
            playNextEpisode();
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        {subtitles.map((sub) => (
          <track
            key={sub.id}
            kind="subtitles"
            label={sub.label}
            srcLang={sub.id}
            src={sub.src}
            default={activeSubtitle === sub.id}
          />
        ))}
      </video>

      {/* Center Play/Pause indicator on click */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute z-10 w-20 h-20 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center backdrop-blur-md hover:scale-110 transition-transform"
        >
          <Play className="w-10 h-10 fill-current ml-1" />
        </button>
      )}

      {/* Top Header Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={stopPlayback}
            className="p-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white transition-colors"
            title="Retour au catalogue"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white drop-shadow">{video.title}</h2>
              {activeEpisode && (
                <span className="text-sm font-bold text-red-400 bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded">
                  {activeEpisode.title}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-zinc-400 font-semibold mt-0.5">
              <span className="text-red-500 font-bold uppercase tracking-wider">CineStream Drama</span>
              <span>•</span>
              <span>{video.maturityRating}</span>
              <span>•</span>
              <span className="text-emerald-400">{effectiveBitrate}</span>
            </div>
          </div>
        </div>

        {/* Top Right Controls (Episodes drawer & QoE Monitor Toggle) */}
        <div className="flex items-center space-x-3">
          {hasEpisodes && (
            <button
              onClick={() => setShowEpisodesDrawer(!showEpisodesDrawer)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-white transition-all"
            >
              <ListVideo className="w-4 h-4 text-red-500" />
              <span>Épisodes</span>
            </button>
          )}

          <button
            onClick={() => setShowQoEMonitor(!showQoEMonitor)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              showQoEMonitor
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:text-white'
            }`}
            title="Afficher les statistiques de lecture QoE"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>QoE Live</span>
          </button>
        </div>
      </div>

      {/* In-Player Episodes Drawer */}
      {showEpisodesDrawer && hasEpisodes && (
        <div className="absolute top-20 right-6 bottom-24 z-30 w-80 bg-zinc-950/95 border border-zinc-800 rounded-2xl p-4 flex flex-col backdrop-blur-md shadow-2xl animate-scale-up">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="font-black text-sm text-white">Épisodes (Saison 1)</span>
            <button
              onClick={() => setShowEpisodesDrawer(false)}
              className="p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pt-3 no-scrollbar">
            {video.episodes.map((ep) => {
              const isCurrent = activeEpisode?.id === ep.id;
              return (
                <div
                  key={ep.id}
                  onClick={() => {
                    selectEpisode(ep);
                    setShowEpisodesDrawer(false);
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center space-x-3 transition-colors ${
                    isCurrent
                      ? 'bg-red-600/30 border border-red-500 text-white'
                      : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="relative w-16 aspect-[16/9] flex-shrink-0 rounded overflow-hidden">
                    <img
                      src={ep.thumbnailUrl || video.backdropUrl}
                      alt={ep.title}
                      className="w-full h-full object-cover"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-current text-white" />
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold truncate">{ep.title}</div>
                    <div className="text-[10px] text-zinc-400">{ep.durationFormatted}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QoE Stats Diagnostic HUD Box */}
      {showQoEMonitor && (
        <div className="absolute top-24 left-6 z-30 w-72 bg-zinc-950/90 border border-emerald-500/40 rounded-2xl p-4 text-xs font-mono backdrop-blur-md shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>QoE Stream Telemetry</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="space-y-1.5 pt-2 text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-500">Protocole:</span>
              <span className="font-semibold text-white">{qoeStats.streamProtocol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Résolution:</span>
              <span className="font-semibold text-white">{qoeStats.resolution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Bande passante:</span>
              <span className="font-semibold text-emerald-400">{qoeStats.bandwidthMbps} Mbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Tampon (Buffer):</span>
              <span className="font-semibold text-white">{qoeStats.bufferLengthSec}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Buffering Rate:</span>
              <span className="font-semibold text-emerald-400">&lt; 0.5% (Optimal)</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 px-6 pb-6 pt-12 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Slider with Hover Tooltip */}
        <div className="relative group/timeline mb-4">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-zinc-800 rounded-full overflow-hidden pointer-events-none">
            <div
              className="h-full bg-zinc-600 transition-all"
              style={{ width: `${bufferedPercent}%` }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              setHoverPosition(pos * 100);
              setHoverTime(pos * duration);
            }}
            onMouseLeave={() => setHoverTime(null)}
            className="relative w-full h-1.5 bg-transparent appearance-none cursor-pointer z-10"
          />

          {hoverTime !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-xl pointer-events-none"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Main Controls Row */}
        <div className="flex items-center justify-between text-white">
          {/* Left Controls: Play, Rewind, Forward, Next Ep, Volume, Time */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title={isPlaying ? 'Pause (Espace)' : 'Lecture (Espace)'}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            <button
              onClick={() => seekDelta(-10)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Reculer de 10s (Flèche gauche)"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => seekDelta(10)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Avancer de 10s (Flèche droite)"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Next Episode Button */}
            {hasNextEpisode && (
              <button
                onClick={playNextEpisode}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-zinc-800 hover:bg-red-600 text-xs font-bold text-white transition-colors"
                title={`Passer à l'épisode suivant (Touche N) : ${nextEpisode?.title}`}
              >
                <SkipForward className="w-4 h-4 fill-current" />
                <span className="hidden sm:inline">Épisode suivant</span>
              </button>
            )}

            {/* Volume Control */}
            <div className="flex items-center space-x-2 group/volume">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title={isMuted ? 'Activer le son (M)' : 'Couper le son (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  setIsMuted(val === 0);
                  if (videoRef.current) {
                    videoRef.current.volume = val;
                    videoRef.current.muted = val === 0;
                  }
                }}
                className="w-16 sm:w-20 h-1 cursor-pointer"
              />
            </div>

            {/* Time Indicator */}
            <div className="text-xs sm:text-sm font-semibold tracking-wider text-zinc-300">
              <span>{formatTime(currentTime)}</span>
              <span className="text-zinc-500 mx-1.5">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Speed, Subtitles, Quality, PiP, Fullscreen */}
          <div className="flex items-center space-x-3">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowQualityMenu(false);
                  setShowSubtitleMenu(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
                title="Vitesse de lecture"
              >
                {playbackSpeed}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-12 right-0 w-28 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-30">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((sp) => (
                    <button
                      key={sp}
                      onClick={() => handleSpeedChange(sp)}
                      className={`w-full px-3 py-1.5 text-xs text-left hover:bg-zinc-800 transition-colors ${
                        playbackSpeed === sp ? 'text-red-500 font-bold' : 'text-zinc-300'
                      }`}
                    >
                      {sp}x {sp === 1 ? '(Normal)' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitles Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSubtitleMenu(!showSubtitleMenu);
                  setShowQualityMenu(false);
                  setShowSpeedMenu(false);
                }}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Sous-titres & Audio"
              >
                <Subtitles className={`w-5 h-5 ${activeSubtitle !== 'off' ? 'text-red-500' : ''}`} />
              </button>

              {showSubtitleMenu && (
                <div className="absolute bottom-12 right-0 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-30 text-xs">
                  <div className="px-3 py-1 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    Sous-titres (CC)
                  </div>
                  <button
                    onClick={() => {
                      setActiveSubtitle('off');
                      setShowSubtitleMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left hover:bg-zinc-800 ${
                      activeSubtitle === 'off' ? 'text-red-500 font-bold' : 'text-zinc-300'
                    }`}
                  >
                    Désactivé
                  </button>
                  {subtitles.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setActiveSubtitle(sub.id);
                        setShowSubtitleMenu(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left hover:bg-zinc-800 ${
                        activeSubtitle === sub.id ? 'text-red-500 font-bold' : 'text-zinc-300'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality & ABR Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSubtitleMenu(false);
                  setShowSpeedMenu(false);
                }}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Qualité vidéo & Débit adaptatif"
              >
                <Settings className="w-5 h-5" />
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-12 right-0 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-30 text-xs">
                  <div className="px-3 py-1 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    Qualité de diffusion (ABR)
                  </div>
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-zinc-800 ${
                      currentLevel === -1 ? 'text-red-500 font-bold' : 'text-zinc-300'
                    }`}
                  >
                    <span>Auto (Adaptatif)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Recommandé</span>
                  </button>

                  {levels.length > 0 ? (
                    levels.map((lvl) => (
                      <button
                        key={lvl.index}
                        onClick={() => handleQualityChange(lvl.index)}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-zinc-800 ${
                          currentLevel === lvl.index ? 'text-red-500 font-bold' : 'text-zinc-300'
                        }`}
                      >
                        <span>{lvl.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{lvl.bitrate}</span>
                      </button>
                    ))
                  ) : (
                    ['1080p Full HD', '720p HD', '480p SD', '360p Standard'].map((q, idx) => (
                      <button
                        key={q}
                        onClick={() => {
                          setCurrentLevel(idx);
                          setShowQualityMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left hover:bg-zinc-800 ${
                          currentLevel === idx ? 'text-red-500 font-bold' : 'text-zinc-300'
                        }`}
                      >
                        {q}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Picture-in-Picture */}
            {document.pictureInPictureEnabled && (
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (document.pictureInPictureElement) {
                      document.exitPictureInPicture().catch(() => {});
                    } else {
                      videoRef.current.requestPictureInPicture().catch(() => {});
                    }
                  }
                }}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Mode Picture-in-Picture (PiP)"
              >
                <Tv className="w-5 h-5" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title={isFullscreen ? 'Quitter plein écran (F)' : 'Plein écran (F)'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
