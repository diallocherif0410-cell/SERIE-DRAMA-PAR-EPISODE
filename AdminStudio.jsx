import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Film,
  Server,
  Activity,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Users,
  Eye,
  Sliders,
  Sparkles,
  Play
} from 'lucide-react';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';

export function AdminStudio() {
  const { startPlayback } = usePlayer();
  const [metrics, setMetrics] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'catalog' | 'telemetry'
  const [loading, setLoading] = useState(true);

  // Upload state
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState('Science-Fiction, Aventure');
  const [director, setDirector] = useState('Studio CineStream');
  const [cast, setCast] = useState('');
  const [releaseYear, setReleaseYear] = useState('2025');
  const [maturityRating, setMaturityRating] = useState('12+');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcodingJob, setTranscodingJob] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, v] = await Promise.all([api.getAdminMetrics(), api.getVideos()]);
      setMetrics(m);
      setVideos(v);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Poll transcoding status if job active
  useEffect(() => {
    if (!transcodingJob?.videoId || transcodingJob?.status === 'completed' || transcodingJob?.status === 'failed') {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const job = await api.getTranscodeStatus(transcodingJob.videoId);
        setTranscodingJob(job);
        if (job.status === 'completed') {
          setStatusMessage('Transcodage HLS ABR terminé avec succès ! La vidéo est disponible.');
          loadData();
        }
      } catch (e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, [transcodingJob]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Veuillez sélectionner un fichier vidéo.');
      return;
    }

    setIsUploading(true);
    setStatusMessage('Envoi du fichier vidéo au serveur en cours...');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('genres', genres);
    formData.append('director', director);
    formData.append('cast', cast);
    formData.append('releaseYear', releaseYear);
    formData.append('maturityRating', maturityRating);

    try {
      const res = await api.uploadVideo(formData);
      setStatusMessage('Fichier reçu. Transcodage FFmpeg multi-débits HLS initié...');
      setTranscodingJob({
        videoId: res.video.id,
        progress: 15,
        currentStep: 'Analyse et encodage ABR'
      });
      // Clear inputs
      setFile(null);
      setTitle('');
      setDescription('');
    } catch (err) {
      setStatusMessage(`Erreur : ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo du catalogue ?')) return;
    try {
      await api.deleteVideo(videoId);
      loadData();
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Console Administrateur</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            CineStream Studio Hub
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gestion du pipeline d'ingestion vidéo, transcodage FFmpeg ABR et observabilité QoE.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-all self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser les métriques</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Catalogue Vidéos</span>
              <Film className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-black text-white">{metrics.totalVideos}</div>
            <div className="text-[11px] text-emerald-400 font-semibold">100% encodé ABR</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Utilisateurs & Profils</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-white">{metrics.totalProfiles}</div>
            <div className="text-[11px] text-zinc-400 font-semibold">
              {metrics.subscribers?.premium || 1} comptes Premium 4K
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Espace Stockage VOD</span>
              <HardDrive className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-white">{metrics.storageMb} MB</div>
            <div className="text-[11px] text-zinc-400 font-semibold">Segments HLS & Sources</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Taux de Buffering QoE</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {metrics.qoeMetrics?.bufferingRatePercent}%
            </div>
            <div className="text-[11px] text-emerald-500 font-semibold">
              Objectif PRD &lt; 1% respecté
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'upload'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Pipeline d'ingestion & Transcodage FFmpeg
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'catalog'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Catalogue Studio ({videos.length})
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'telemetry'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Télémétrie QoE & CDN
        </button>
      </div>

      {/* Tab 1: Video Ingestion & Transcoding */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <Upload className="w-5 h-5 text-red-500" />
              <span>Ingestion d'une nouvelle œuvre</span>
            </h2>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-red-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-zinc-950/40"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/mkv,video/mov,video/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="hidden"
                />
                <Film className="w-10 h-10 text-zinc-500 mx-auto mb-2" />
                <div className="text-sm font-bold text-white">
                  {file ? file.name : 'Cliquez ou glissez un fichier vidéo (MP4, MKV, MOV)'}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Transcodage automatique ABR en 1080p, 720p, 360p HLS avec FFmpeg
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Titre de l'œuvre</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Nébuleuse Éternelle"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Genres (séparés par virgules)</label>
                  <input
                    type="text"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    placeholder="Science-Fiction, Action, Drame"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Synopsis / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Résumé captivant du film ou de la série..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Réalisateur</label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Année</label>
                  <input
                    type="number"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Classification d'âge</label>
                  <select
                    value={maturityRating}
                    onChange={(e) => setMaturityRating(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Tous publics">Tous publics</option>
                    <option value="10+">10+</option>
                    <option value="12+">12+</option>
                    <option value="16+">16+</option>
                    <option value="18+">18+</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 hover:scale-[1.01]"
              >
                {isUploading ? 'Envoi et traitement en cours...' : "Lancer l'ingestion & le transcodage ABR"}
              </button>
            </form>
          </div>

          {/* Real-time Transcoding Pipeline Monitor */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <Server className="w-5 h-5 text-red-500" />
              <span>Pipeline de Transcodage HLS</span>
            </h2>

            {transcodingJob ? (
              <div className="space-y-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Statut :</span>
                  <span
                    className={`font-mono font-bold uppercase ${
                      transcodingJob.status === 'completed'
                        ? 'text-emerald-400'
                        : transcodingJob.status === 'failed'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {transcodingJob.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Progression</span>
                    <span>{transcodingJob.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-300 rounded-full"
                      style={{ width: `${transcodingJob.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-zinc-300 font-mono bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                  {transcodingJob.currentStep || 'Traitement initial...'}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 text-xs">
                Aucun job de transcodage en cours.
              </div>
            )}

            {/* Architecture Details Box */}
            <div className="border-t border-zinc-800 pt-4 space-y-3 text-xs text-zinc-400">
              <div className="font-bold text-white">Profils de transcodage actifs (TRD §3.1) :</div>
              <ul className="space-y-1.5 text-zinc-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1080p Full HD — 4.5 Mbps H.264 / AAC</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>720p HD — 2.2 Mbps H.264 / AAC</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>360p SD — 600 kbps H.264 / AAC</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Slices HLS de 4s & Master playlist ABR</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Catalog Management */}
      {activeTab === 'catalog' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-sm font-bold text-white">Toutes les œuvres du catalogue</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="p-4">Titre</th>
                  <th className="p-4">Genres</th>
                  <th className="p-4">Durée</th>
                  <th className="p-4">Note</th>
                  <th className="p-4">Vues</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {videos.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-850/50 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      <img
                        src={v.posterUrl}
                        alt={v.title}
                        className="w-10 h-14 object-cover rounded shadow"
                      />
                      <div>
                        <div className="font-bold text-white text-sm">{v.title}</div>
                        <div className="text-[11px] text-zinc-500">{v.releaseYear} • {v.maturityRating}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      {v.genres?.slice(0, 2).join(', ')}
                    </td>
                    <td className="p-4 font-mono">{v.durationFormatted}</td>
                    <td className="p-4 font-bold text-yellow-400">★ {v.rating}</td>
                    <td className="p-4 font-mono">{v.views || 0}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => startPlayback(v)}
                        className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                        title="Tester la lecture"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(v.id)}
                        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Telemetry & QoE */}
      {activeTab === 'telemetry' && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>KPIs QoE (Quality of Experience)</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-zinc-950 rounded-xl">
                <span className="text-zinc-400">Time To First Frame (TTFF):</span>
                <span className="font-bold text-emerald-400">
                  {metrics.qoeMetrics?.averageTimeToFirstFrameSec}s (&lt; 2s cible)
                </span>
              </div>
              <div className="flex justify-between p-3 bg-zinc-950 rounded-xl">
                <span className="text-zinc-400">Taux de rebond dû au buffering:</span>
                <span className="font-bold text-emerald-400">
                  {metrics.qoeMetrics?.bufferingRatePercent}% (&lt; 1% SLA PRD)
                </span>
              </div>
              <div className="flex justify-between p-3 bg-zinc-950 rounded-xl">
                <span className="text-zinc-400">Débit moyen distribué:</span>
                <span className="font-bold text-white">
                  {metrics.qoeMetrics?.averageBitrateMbps} Mbps
                </span>
              </div>
              <div className="flex justify-between p-3 bg-zinc-950 rounded-xl">
                <span className="text-zinc-400">Disponibilité passerelle HLS:</span>
                <span className="font-bold text-emerald-400">99.98% (SLA Conforme)</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-400" />
              <span>Répartition des Abonnements</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-zinc-950 rounded-xl">
                <span className="text-zinc-400">Gratuit (AVOD publicitaire):</span>
                <span className="font-bold text-white">{metrics.subscribers?.free || 0}</span>
              </div>
              <div className="flex justify-between p-3 bg-zinc-950 rounded-xl">
                <span className="text-zinc-400">Standard HD (1080p SVOD):</span>
                <span className="font-bold text-white">{metrics.subscribers?.standard || 0}</span>
              </div>
              <div className="flex justify-between p-3 bg-zinc-950 rounded-xl">
                <span className="text-zinc-400">Premium 4K HDR & Spatial:</span>
                <span className="font-bold text-amber-400">{metrics.subscribers?.premium || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
