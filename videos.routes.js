import express from 'express';
import { db } from '../db/index.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get list of videos with filters & search
router.get('/', optionalAuth, (req, res) => {
  const { genre, search, isKids, sort, year, maturity } = req.query;

  let videos = db.find('videos');

  // Kids filter
  if (isKids === 'true' || isKids === true) {
    videos = videos.filter(v => v.isKidsFriendly || v.maturityRating === 'Tous publics');
  }

  // Genre filter
  if (genre && genre !== 'all' && genre !== 'Tous') {
    videos = videos.filter(v => 
      Array.isArray(v.genres) && v.genres.some(g => g.toLowerCase() === genre.toLowerCase())
    );
  }

  // Year filter
  if (year) {
    videos = videos.filter(v => String(v.releaseYear) === String(year));
  }

  // Maturity filter
  if (maturity) {
    videos = videos.filter(v => v.maturityRating === maturity);
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    videos = videos.filter(v => {
      const matchTitle = v.title?.toLowerCase().includes(q);
      const matchDesc = v.description?.toLowerCase().includes(q);
      const matchDirector = v.director?.toLowerCase().includes(q);
      const matchCast = Array.isArray(v.cast) && v.cast.some(actor => actor.toLowerCase().includes(q));
      const matchGenre = Array.isArray(v.genres) && v.genres.some(g => g.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchDirector || matchCast || matchGenre;
    });
  }

  // Sorting
  if (sort === 'popular' || sort === 'views') {
    videos.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (sort === 'rating') {
    videos.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'newest') {
    videos.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
  }

  res.json(videos);
});

// Featured Hero Video
router.get('/featured', (req, res) => {
  const featured = db.find('videos', v => v.isFeatured);
  if (featured.length > 0) {
    return res.json(featured[0]);
  }
  const any = db.find('videos');
  res.json(any[0] || null);
});

// Trending Videos (Top 10)
router.get('/trending', (req, res) => {
  const trending = db.find('videos', v => v.isTrending);
  trending.sort((a, b) => (a.trendingRank || 99) - (b.trendingRank || 99));
  res.json(trending);
});

// Get all genres
router.get('/genres', (req, res) => {
  const videos = db.find('videos');
  const genreCount = {};

  videos.forEach(v => {
    if (Array.isArray(v.genres)) {
      v.genres.forEach(g => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
    }
  });

  const list = Object.keys(genreCount).map(name => ({
    name,
    count: genreCount[name]
  })).sort((a, b) => b.count - a.count);

  res.json(list);
});

// Quick autocomplete for search dropdown
router.get('/search/autocomplete', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) return res.json([]);

  const videos = db.find('videos');
  const matches = videos.filter(v => 
    v.title?.toLowerCase().includes(q) ||
    (Array.isArray(v.genres) && v.genres.some(g => g.toLowerCase().includes(q))) ||
    (Array.isArray(v.cast) && v.cast.some(c => c.toLowerCase().includes(q)))
  ).slice(0, 5);

  res.json(matches.map(m => ({
    id: m.id,
    title: m.title,
    releaseYear: m.releaseYear,
    posterUrl: m.posterUrl,
    genres: m.genres,
    rating: m.rating
  })));
});

// Video by ID + Recommendations
router.get('/:id', (req, res) => {
  const video = db.findById('videos', req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Vidéo introuvable' });
  }

  // Increment view count slightly
  db.updateById('videos', video.id, { views: (video.views || 0) + 1 });

  // Recommendations: same genre or high rating, excluding this one
  const allVideos = db.find('videos', v => v.id !== video.id);
  const recommendations = allVideos.filter(v => {
    if (!video.genres || !v.genres) return false;
    return v.genres.some(g => video.genres.includes(g));
  }).slice(0, 6);

  if (recommendations.length < 4) {
    const remaining = allVideos
      .filter(v => !recommendations.some(r => r.id === v.id))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4 - recommendations.length);
    recommendations.push(...remaining);
  }

  res.json({
    ...video,
    recommendations
  });
});

export default router;
