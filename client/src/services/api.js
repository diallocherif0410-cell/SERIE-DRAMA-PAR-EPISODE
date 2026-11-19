const API_BASE = '/api';

export function getAuthHeaders() {
  const token = localStorage.getItem('cinestream_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la connexion');
    }
    return res.json();
  },

  async register(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de l\'inscription');
    }
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Session expirée');
    return res.json();
  },

  async createProfile(data) {
    const res = await fetch(`${API_BASE}/auth/profiles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur création de profil');
    }
    return res.json();
  },

  async updateProfile(profileId, data) {
    const res = await fetch(`${API_BASE}/auth/profiles/${profileId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteProfile(profileId) {
    const res = await fetch(`${API_BASE}/auth/profiles/${profileId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Videos
  async getVideos(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/videos?${query}`);
    return res.json();
  },

  async getFeatured() {
    const res = await fetch(`${API_BASE}/videos/featured`);
    return res.json();
  },

  async getTrending() {
    const res = await fetch(`${API_BASE}/videos/trending`);
    return res.json();
  },

  async getGenres() {
    const res = await fetch(`${API_BASE}/videos/genres`);
    return res.json();
  },

  async getVideo(id) {
    const res = await fetch(`${API_BASE}/videos/${id}`);
    if (!res.ok) throw new Error('Vidéo introuvable');
    return res.json();
  },

  async searchAutocomplete(q) {
    const res = await fetch(`${API_BASE}/videos/search/autocomplete?q=${encodeURIComponent(q)}`);
    return res.json();
  },

  // Playback Progress & Continue Watching
  async savePlaybackProgress(profileId, videoId, currentTime, duration) {
    const res = await fetch(`${API_BASE}/playback/progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ profileId, videoId, currentTime, duration })
    });
    return res.json();
  },

  async getContinueWatching(profileId) {
    const res = await fetch(`${API_BASE}/playback/continue-watching?profileId=${profileId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getWatchHistory(profileId) {
    const res = await fetch(`${API_BASE}/playback/history?profileId=${profileId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Watchlist & Interactions
  async getWatchlist(profileId) {
    const res = await fetch(`${API_BASE}/interactions/watchlist?profileId=${profileId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async toggleWatchlist(profileId, videoId) {
    const res = await fetch(`${API_BASE}/interactions/watchlist/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ profileId, videoId })
    });
    return res.json();
  },

  async checkWatchlist(profileId, videoId) {
    const res = await fetch(`${API_BASE}/interactions/watchlist/check/${videoId}?profileId=${profileId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async rateVideo(videoId, profileId, data) {
    const res = await fetch(`${API_BASE}/interactions/rate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ videoId, profileId, ...data })
    });
    return res.json();
  },

  async getReviews(videoId) {
    const res = await fetch(`${API_BASE}/interactions/ratings/${videoId}`);
    return res.json();
  },

  // Subscriptions
  async getSubscriptionPlans() {
    const res = await fetch(`${API_BASE}/subscription/plans`);
    return res.json();
  },

  async updateSubscription(planId) {
    const res = await fetch(`${API_BASE}/subscription/update`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ planId })
    });
    return res.json();
  },

  // Admin Studio
  async getAdminMetrics() {
    const res = await fetch(`${API_BASE}/admin/metrics`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Accès réservé aux administrateurs');
    return res.json();
  },

  async uploadVideo(formData) {
    const token = localStorage.getItem('cinestream_token');
    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de l\'upload');
    }
    return res.json();
  },

  async getTranscodeStatus(videoId) {
    const res = await fetch(`${API_BASE}/admin/transcode/${videoId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async deleteVideo(videoId) {
    const res = await fetch(`${API_BASE}/admin/videos/${videoId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
