import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

class JsonDatabase {
  constructor() {
    this.filePath = CONFIG.DB_FILE;
    this.data = {
      users: [],
      profiles: [],
      videos: [],
      playback_progress: [],
      watchlist: [],
      ratings: [],
      transcode_jobs: [],
      subscription_plans: [
        {
          id: 'free',
          name: 'Formule Gratuite (AVOD)',
          price: '0 € / mois',
          maxQuality: '720p HD',
          maxScreens: 1,
          hasAds: true,
          offlineDownload: false,
          features: ['Accès au catalogue avec publicités', 'Qualité 720p HD', '1 écran simultané', 'Son Stéréo']
        },
        {
          id: 'basic',
          name: 'Essentiel avec pub',
          price: '5.99 € / mois',
          maxQuality: '1080p Full HD',
          maxScreens: 1,
          hasAds: true,
          offlineDownload: false,
          features: ['Accès au catalogue avec publicités', 'Qualité 1080p Full HD', '1 écran simultané', 'Son Stéréo']
        },
        {
          id: 'standard',
          name: 'Standard HD (SVOD)',
          price: '8.99 € / mois',
          maxQuality: '1080p Full HD',
          maxScreens: 2,
          hasAds: false,
          offlineDownload: true,
          features: ['Sans interruption publicitaire', 'Qualité 1080p Full HD', '2 écrans simultanés', 'Son Dolby Digital 5.1', 'Mode multi-profils']
        },
        {
          id: 'premium',
          name: 'Premium 4K Ultra HD',
          price: '13.99 € / mois',
          maxQuality: '4K HDR & Dolby Atmos',
          maxScreens: 4,
          hasAds: false,
          offlineDownload: true,
          features: ['Qualité maximale 4K Ultra HD & HDR', '4 écrans en simultané', 'Son spatial Dolby Atmos', 'Contrôle parental avancé', 'Accès prioritaire aux nouveautés']
        }
      ]
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(CONFIG.DATA_DIR)) {
      fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      } catch (err) {
        console.error('Error reading DB, using initial state:', err);
      }
    } else {
      this.save();
    }
  }

  save() {
    try {
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('Error saving DB:', err);
    }
  }

  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  find(collectionName, predicate = () => true) {
    const list = this.getCollection(collectionName);
    return list.filter(predicate);
  }

  findOne(collectionName, predicate) {
    const list = this.getCollection(collectionName);
    return list.find(predicate) || null;
  }

  findById(collectionName, id) {
    return this.findOne(collectionName, item => String(item.id) === String(id));
  }

  insert(collectionName, item) {
    const list = this.getCollection(collectionName);
    list.push(item);
    this.save();
    return item;
  }

  updateById(collectionName, id, updates) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex(item => String(item.id) === String(id));
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return list[index];
  }

  deleteById(collectionName, id) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex(item => String(item.id) === String(id));
    if (index === -1) return false;
    list.splice(index, 1);
    this.save();
    return true;
  }

  deleteWhere(collectionName, predicate) {
    const list = this.getCollection(collectionName);
    const initialLen = list.length;
    this.data[collectionName] = list.filter(item => !predicate(item));
    const deleted = initialLen - this.data[collectionName].length;
    if (deleted > 0) {
      this.save();
    }
    return deleted;
  }
}

export const db = new JsonDatabase();
