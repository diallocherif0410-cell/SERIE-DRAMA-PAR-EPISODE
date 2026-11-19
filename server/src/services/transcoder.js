import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { CONFIG } from '../config.js';
import { db } from '../db/index.js';

const execAsync = promisify(exec);

export class TranscoderService {
  constructor() {
    this.activeJobs = new Map();
  }

  async getVideoMetadata(inputPath) {
    try {
      // Use ffprobe / ffmpeg to get duration and dimensions
      const { stderr } = await execAsync(`ffmpeg -i "${inputPath}" 2>&1`);
      
      const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/);
      let durationSeconds = 0;
      if (durationMatch) {
        const hours = parseInt(durationMatch[1], 10);
        const minutes = parseInt(durationMatch[2], 10);
        const seconds = parseFloat(durationMatch[3]);
        durationSeconds = Math.round(hours * 3600 + minutes * 60 + seconds);
      }

      const resMatch = stderr.match(/Video: .*?, (\d{3,4})x(\d{3,4})/);
      let width = 1920;
      let height = 1080;
      if (resMatch) {
        width = parseInt(resMatch[1], 10);
        height = parseInt(resMatch[2], 10);
      }

      return {
        durationSeconds,
        durationFormatted: this.formatDuration(durationSeconds),
        width,
        height
      };
    } catch (err) {
      // ffmpeg exits with code 1 if no output file specified, but stderr contains metadata
      if (err.stderr) {
        const durationMatch = err.stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/);
        let durationSeconds = 0;
        if (durationMatch) {
          const hours = parseInt(durationMatch[1], 10);
          const minutes = parseInt(durationMatch[2], 10);
          const seconds = parseFloat(durationMatch[3]);
          durationSeconds = Math.round(hours * 3600 + minutes * 60 + seconds);
        }
        const resMatch = err.stderr.match(/Video: .*?, (\d{3,4})x(\d{3,4})/);
        let width = 1280;
        let height = 720;
        if (resMatch) {
          width = parseInt(resMatch[1], 10);
          height = parseInt(resMatch[2], 10);
        }
        return {
          durationSeconds,
          durationFormatted: this.formatDuration(durationSeconds),
          width,
          height
        };
      }
      return { durationSeconds: 60, durationFormatted: '01:00', width: 1280, height: 720 };
    }
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  async generateThumbnail(inputPath, outputPosterPath, atSeconds = 3) {
    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-ss', String(atSeconds),
        '-i', inputPath,
        '-vframes', '1',
        '-vf', 'scale=800:-1',
        outputPosterPath
      ];
      const proc = spawn('ffmpeg', args);
      proc.on('close', code => {
        if (code === 0) resolve(outputPosterPath);
        else reject(new Error(`Thumbnail generation failed with code ${code}`));
      });
      proc.on('error', reject);
    });
  }

  async transcodeToHls(videoId, inputPath, options = {}) {
    const outputDir = path.join(CONFIG.TRANSCODED_DIR, videoId);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      videoId,
      inputPath,
      outputDir,
      status: 'processing',
      progress: 0,
      currentStep: 'Analyse du fichier source',
      startedAt: new Date().toISOString()
    };

    db.insert('transcode_jobs', job);
    this.activeJobs.set(videoId, job);

    try {
      // 1. Metadata
      job.currentStep = 'Extraction des métadonnées vidéo';
      db.updateById('transcode_jobs', job.id, { currentStep: job.currentStep, progress: 10 });
      const meta = await this.getVideoMetadata(inputPath);

      // 2. Poster image if needed
      const posterPath = path.join(outputDir, 'poster.jpg');
      job.currentStep = 'Génération de la miniature et affiche';
      db.updateById('transcode_jobs', job.id, { currentStep: job.currentStep, progress: 20 });
      try {
        await this.generateThumbnail(inputPath, posterPath, Math.min(3, Math.max(1, Math.floor(meta.durationSeconds * 0.1))));
      } catch (e) {
        console.warn('Poster generation note:', e.message);
      }

      // 3. Multi-bitrate HLS Transcoding
      // We produce 3 resolutions: 360p (500k), 720p (2200k), and 1080p (4500k if source is large enough)
      const renditions = [
        { name: '360p', width: 640, height: 360, vBitrate: '600k', aBitrate: '64k', bandwidth: 800000 },
        { name: '720p', width: 1280, height: 720, vBitrate: '2200k', aBitrate: '128k', bandwidth: 2500000 },
      ];

      if (meta.height >= 1000) {
        renditions.push({ name: '1080p', width: 1920, height: 1080, vBitrate: '4500k', aBitrate: '192k', bandwidth: 5000000 });
      }

      const totalRenditions = renditions.length;
      let renditionIndex = 0;

      for (const rendition of renditions) {
        renditionIndex++;
        const rendDir = path.join(outputDir, rendition.name);
        if (!fs.existsSync(rendDir)) {
          fs.mkdirSync(rendDir, { recursive: true });
        }

        job.currentStep = `Encodage ABR profil ${rendition.name} (${rendition.width}x${rendition.height} @ ${rendition.vBitrate})`;
        job.progress = Math.round(20 + (renditionIndex / totalRenditions) * 60);
        db.updateById('transcode_jobs', job.id, { currentStep: job.currentStep, progress: job.progress });

        await this.transcodeSingleRendition(inputPath, rendDir, rendition);
      }

      // 4. Generate Master Playlist (master.m3u8)
      job.currentStep = 'Création du Master Playlist ABR (master.m3u8)';
      job.progress = 90;
      db.updateById('transcode_jobs', job.id, { currentStep: job.currentStep, progress: 90 });

      const masterContent = this.generateMasterPlaylist(renditions);
      fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterContent, 'utf-8');

      // 5. Done
      job.status = 'completed';
      job.progress = 100;
      job.currentStep = 'Transcodage terminé avec succès et prêt à la diffusion';
      job.completedAt = new Date().toISOString();
      db.updateById('transcode_jobs', job.id, {
        status: 'completed',
        progress: 100,
        currentStep: job.currentStep,
        completedAt: job.completedAt
      });

      // Update video record in DB
      db.updateById('videos', videoId, {
        isTranscoded: true,
        hlsMasterUrl: `/stream/${videoId}/master.m3u8`,
        qualities: renditions.map(r => r.name),
        duration: meta.durationSeconds,
        durationFormatted: meta.durationFormatted,
        resolution: `${meta.width}x${meta.height}`,
        posterUrl: `/stream/${videoId}/poster.jpg`
      });

      this.activeJobs.delete(videoId);
      return job;
    } catch (err) {
      console.error(`Transcoding failed for video ${videoId}:`, err);
      job.status = 'failed';
      job.error = err.message;
      db.updateById('transcode_jobs', job.id, { status: 'failed', error: err.message });
      this.activeJobs.delete(videoId);
      throw err;
    }
  }

  transcodeSingleRendition(inputPath, outputDir, rendition) {
    return new Promise((resolve, reject) => {
      const playlistPath = path.join(outputDir, 'index.m3u8');
      const segmentPattern = path.join(outputDir, 'segment_%03d.ts');

      const args = [
        '-y',
        '-i', inputPath,
        '-vf', `scale=w=${rendition.width}:h=${rendition.height}:force_original_aspect_ratio=decrease,pad=${rendition.width}:${rendition.height}:(ow-iw)/2:(oh-ih)/2`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-b:v', rendition.vBitrate,
        '-maxrate', rendition.vBitrate,
        '-bufsize', `${parseInt(rendition.vBitrate) * 2}k`,
        '-c:a', 'aac',
        '-b:a', rendition.aBitrate,
        '-ar', '44100',
        '-hls_time', '4',
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', segmentPattern,
        playlistPath
      ];

      const proc = spawn('ffmpeg', args);
      let stderrData = '';

      proc.stderr.on('data', data => {
        stderrData += data.toString();
      });

      proc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg failed with code ${code}: ${stderrData.slice(-300)}`));
      });

      proc.on('error', reject);
    });
  }

  generateMasterPlaylist(renditions) {
    let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
    for (const r of renditions) {
      content += `#EXT-X-STREAM-INF:BANDWIDTH=${r.bandwidth},RESOLUTION=${r.width}x${r.height},NAME="${r.name}"\n`;
      content += `${r.name}/index.m3u8\n\n`;
    }
    return content;
  }

  getJobStatus(videoId) {
    const job = db.findOne('transcode_jobs', j => j.videoId === videoId);
    return job || null;
  }
}

export const transcoder = new TranscoderService();
