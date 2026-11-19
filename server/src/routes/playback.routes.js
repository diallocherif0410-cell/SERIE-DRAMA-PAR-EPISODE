import express from 'express';
import { db } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Update playback progress (called by player every 4-5s or on pause/leave)
router.post('/progress', authenticate, (req, res) => {
  const { profileId, videoId, currentTime, duration } = req.body;
  if (!profileId || !videoId || currentTime === undefined) {
    return res.status(400).json({ error: 'Données de lecture invalides' });
  }

  const durationSec = duration || 1;
  const progressPercent = Math.min(100, Math.round((currentTime / durationSec) * 100));
  const completed = progressPercent >= 92; // Considered finished if >= 92%

  let record = db.findOne('playback_progress', p => 
    p.userId === req.user.id && p.profileId === profileId && p.videoId === videoId
  );

  if (record) {
    record = db.updateById('playback_progress', record.id, {
      currentTime: Math.round(currentTime),
      duration: Math.round(durationSec),
      progressPercent,
      completed,
      lastWatchedAt: new Date().toISOString()
    });
  } else {
    record = {
      id: `prog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: req.user.id,
      profileId,
      videoId,
      currentTime: Math.round(currentTime),
      duration: Math.round(durationSec),
      progressPercent,
      completed,
      lastWatchedAt: new Date().toISOString()
    };
    db.insert('playback_progress', record);
  }

  res.json({ success: true, record });
});

// Get continue watching list for a profile
router.get('/continue-watching', authenticate, (req, res) => {
  const { profileId } = req.query;
  if (!profileId) {
    return res.status(400).json({ error: 'ID du profil requis' });
  }

  const list = db.find('playback_progress', p => 
    p.userId === req.user.id && p.profileId === profileId && !p.completed && p.progressPercent > 2
  );

  list.sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt));

  const enriched = list.map(item => {
    const video = db.findById('videos', item.videoId);
    if (!video) return null;
    return {
      progressId: item.id,
      currentTime: item.currentTime,
      duration: item.duration || video.duration,
      progressPercent: item.progressPercent,
      lastWatchedAt: item.lastWatchedAt,
      video
    };
  }).filter(Boolean);

  res.json(enriched);
});

// Get playback history
router.get('/history', authenticate, (req, res) => {
  const { profileId } = req.query;
  if (!profileId) return res.status(400).json({ error: 'ID du profil requis' });

  const history = db.find('playback_progress', p => 
    p.userId === req.user.id && p.profileId === profileId
  );
  history.sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt));

  const enriched = history.map(item => {
    const video = db.findById('videos', item.videoId);
    return { ...item, video };
  }).filter(i => Boolean(i.video));

  res.json(enriched);
});

// Remove item from history / continue watching
router.delete('/history/:id', authenticate, (req, res) => {
  const deleted = db.deleteById('playback_progress', req.params.id);
  res.json({ success: deleted });
});

export default router;
