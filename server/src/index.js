import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config.js';
import { db } from './db/index.js';
import { seedDatabase } from './scripts/seed.js';

import authRoutes from './routes/auth.routes.js';
import videosRoutes from './routes/videos.routes.js';
import playbackRoutes from './routes/playback.routes.js';
import interactionsRoutes from './routes/interactions.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import adminRoutes from './routes/admin.routes.js';
import streamRoutes from './routes/stream.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure required directories exist
[CONFIG.DATA_DIR, CONFIG.UPLOADS_DIR, CONFIG.TRANSCODED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

seedDatabase();

// Static folders
app.use('/uploads', express.static(CONFIG.UPLOADS_DIR));
app.use('/public', express.static(path.join(CONFIG.DATA_DIR, '..', 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/playback', playbackRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/stream', streamRoutes);

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'CineStream API & Streaming Gateway',
    timestamp: new Date().toISOString(),
    catalogSize: db.find('videos').length,
    activeProfiles: db.find('profiles').length
  });
});

// Serve frontend in production if built
if (fs.existsSync(CONFIG.CLIENT_DIST_DIR)) {
  app.use(express.static(CONFIG.CLIENT_DIST_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(CONFIG.CLIENT_DIST_DIR, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Erreur serveur interne' });
});

app.listen(CONFIG.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎬 CineStream Server lancé sur http://localhost:${CONFIG.PORT}`);
  console.log(`📡 Passerelle de Streaming HLS et API VOD prêtes`);
  console.log(`=======================================================`);
});
