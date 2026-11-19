import express from 'express';
import { db } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get Watchlist for profile
router.get('/watchlist', authenticate, (req, res) => {
  const { profileId } = req.query;
  if (!profileId) return res.status(400).json({ error: 'profileId requis' });

  const items = db.find('watchlist', w => w.userId === req.user.id && w.profileId === profileId);
  items.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

  const videos = items.map(item => {
    const video = db.findById('videos', item.videoId);
    if (!video) return null;
    return {
      watchlistId: item.id,
      addedAt: item.addedAt,
      ...video
    };
  }).filter(Boolean);

  res.json(videos);
});

// Check if video is in watchlist
router.get('/watchlist/check/:videoId', authenticate, (req, res) => {
  const { profileId } = req.query;
  const { videoId } = req.params;

  const found = db.findOne('watchlist', w => 
    w.userId === req.user.id && w.profileId === profileId && w.videoId === videoId
  );

  res.json({ inWatchlist: Boolean(found) });
});

// Toggle Watchlist
router.post('/watchlist/toggle', authenticate, (req, res) => {
  const { profileId, videoId } = req.body;
  if (!profileId || !videoId) {
    return res.status(400).json({ error: 'profileId et videoId requis' });
  }

  const existing = db.findOne('watchlist', w => 
    w.userId === req.user.id && w.profileId === profileId && w.videoId === videoId
  );

  if (existing) {
    db.deleteById('watchlist', existing.id);
    return res.json({ inWatchlist: false, message: 'Retiré de votre liste' });
  } else {
    const item = {
      id: `wl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: req.user.id,
      profileId,
      videoId,
      addedAt: new Date().toISOString()
    };
    db.insert('watchlist', item);
    return res.json({ inWatchlist: true, message: 'Ajouté à votre liste' });
  }
});

// Rate or Review Video
router.post('/rate', authenticate, (req, res) => {
  const { videoId, profileId, isThumbUp, stars, reviewText } = req.body;
  if (!videoId || !profileId) {
    return res.status(400).json({ error: 'videoId et profileId requis' });
  }

  const video = db.findById('videos', videoId);
  if (!video) return res.status(404).json({ error: 'Vidéo introuvable' });

  let userRating = db.findOne('ratings', r => 
    r.userId === req.user.id && r.profileId === profileId && r.videoId === videoId
  );

  const profile = db.findById('profiles', profileId);

  if (userRating) {
    userRating = db.updateById('ratings', userRating.id, {
      ...(isThumbUp !== undefined && { isThumbUp }),
      ...(stars !== undefined && { stars: Number(stars) }),
      ...(reviewText !== undefined && { reviewText }),
      authorName: profile ? profile.name : 'Utilisateur',
      updatedAt: new Date().toISOString()
    });
  } else {
    userRating = {
      id: `rate_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: req.user.id,
      profileId,
      videoId,
      isThumbUp: isThumbUp !== undefined ? isThumbUp : true,
      stars: stars ? Number(stars) : 5,
      reviewText: reviewText || '',
      authorName: profile ? profile.name : 'Utilisateur',
      createdAt: new Date().toISOString()
    };
    db.insert('ratings', userRating);
  }

  // Recalculate likes/dislikes and average stars for the video
  const allRatings = db.find('ratings', r => r.videoId === videoId);
  const likesCount = allRatings.filter(r => r.isThumbUp === true).length + (video.likesCount || 100);
  const dislikesCount = allRatings.filter(r => r.isThumbUp === false).length + (video.dislikesCount || 5);
  
  const starRatings = allRatings.filter(r => r.stars);
  let avgStars = video.rating || 4.5;
  if (starRatings.length > 0) {
    const sum = starRatings.reduce((acc, curr) => acc + curr.stars, 0);
    avgStars = Number((sum / starRatings.length).toFixed(1));
  }

  db.updateById('videos', videoId, {
    likesCount,
    dislikesCount,
    rating: avgStars,
    ratingCount: (video.ratingCount || 0) + 1
  });

  res.json({
    success: true,
    userRating,
    likesCount,
    dislikesCount,
    rating: avgStars
  });
});

// Get ratings and reviews for video
router.get('/ratings/:videoId', (req, res) => {
  const { videoId } = req.params;
  const reviews = db.find('ratings', r => r.videoId === videoId && r.reviewText);
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(reviews);
});

export default router;
