import express from 'express';
import path from 'path';
import fs from 'fs';
import { CONFIG } from '../config.js';
import { db } from '../db/index.js';

const router = express.Router();

// Serve subtitles
router.get('/subtitles/:filename', (req, res) => {
  const filePath = path.join(CONFIG.DATA_DIR, '..', 'public', 'subtitles', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).send('Sous-titres introuvables');
  }
});

// Serve HLS Master Playlist & Variants
router.get('/:videoId/master.m3u8', (req, res) => {
  const { videoId } = req.params;
  const masterPath = path.join(CONFIG.TRANSCODED_DIR, videoId, 'master.m3u8');

  if (fs.existsSync(masterPath)) {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    fs.createReadStream(masterPath).pipe(res);
  } else {
    // If not transcoded locally yet, return 404 or redirect
    res.status(404).json({ error: 'Flux HLS non disponible ou en cours d\'ingestion' });
  }
});

// Serve HLS Variant Playlist (e.g. /stream/:videoId/720p/index.m3u8)
router.get('/:videoId/:quality/index.m3u8', (req, res) => {
  const { videoId, quality } = req.params;
  const variantPath = path.join(CONFIG.TRANSCODED_DIR, videoId, quality, 'index.m3u8');

  if (fs.existsSync(variantPath)) {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    fs.createReadStream(variantPath).pipe(res);
  } else {
    res.status(404).send('Variante introuvable');
  }
});

// Serve HLS Segment (e.g. /stream/:videoId/:quality/segment_001.ts)
router.get('/:videoId/:quality/:segment', (req, res) => {
  const { videoId, quality, segment } = req.params;
  const segmentPath = path.join(CONFIG.TRANSCODED_DIR, videoId, quality, segment);

  if (fs.existsSync(segmentPath)) {
    res.setHeader('Content-Type', 'video/MP2T');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(segmentPath).pipe(res);
  } else {
    res.status(404).send('Segment introuvable');
  }
});

// Serve Poster Image
router.get('/:videoId/poster.jpg', (req, res) => {
  const { videoId } = req.params;
  const posterPath = path.join(CONFIG.TRANSCODED_DIR, videoId, 'poster.jpg');

  if (fs.existsSync(posterPath)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    fs.createReadStream(posterPath).pipe(res);
  } else {
    res.status(404).send('Miniature introuvable');
  }
});

// HTTP Range Video Streaming for local video files (RFC 7233)
router.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(CONFIG.UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Fichier vidéo introuvable');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
      return;
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
      'Access-Control-Allow-Origin': '*'
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

export default router;
