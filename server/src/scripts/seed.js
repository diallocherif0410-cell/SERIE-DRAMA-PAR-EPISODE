import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { SAMPLE_VIDEOS } from '../services/sampleCatalog.js';

export async function seedDatabase() {
  console.log('Seeding CineStream database with Séries Drama par Épisode...');

  // 1. Seed Users if not present
  const adminEmail = 'admin@cinestream.io';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const admin = db.findOne('users', u => u.email === adminEmail);
  if (!admin && process.env.NODE_ENV === 'production' && !adminPassword) {
    throw new Error('ADMIN_INITIAL_PASSWORD must be set before seeding production data.');
  }
  if (adminPassword && adminPassword.length < 12) {
    throw new Error('ADMIN_INITIAL_PASSWORD must be at least 12 characters long.');
  }
  if (adminPassword) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(adminPassword, salt);
    if (admin) {
      db.updateById('users', admin.id, { passwordHash });
    } else {
      db.insert('users', {
        id: 'usr_admin',
        email: adminEmail,
        name: 'Directeur Studio',
        role: 'admin',
        plan: 'premium',
        passwordHash,
        createdAt: new Date().toISOString()
      });
    }
  }

  let demoUser = db.findOne('users', u => u.email === 'demo@cinestream.io');
  if (!demoUser) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('Demo123!', salt);
    demoUser = {
      id: 'usr_demo',
      email: 'demo@cinestream.io',
      name: 'Alexandre Dupont',
      role: 'user',
      plan: 'standard',
      passwordHash,
      createdAt: new Date().toISOString()
    };
    db.insert('users', demoUser);
  }

  // 2. Seed Profiles
  const existingProfiles = db.find('profiles', p => p.userId === demoUser.id);
  if (existingProfiles.length === 0) {
    const profiles = [
      {
        id: 'prof_alex',
        userId: demoUser.id,
        name: 'Alex',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        isKids: false,
        language: 'fr'
      },
      {
        id: 'prof_emma',
        userId: demoUser.id,
        name: 'Emma',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        isKids: false,
        language: 'fr'
      },
      {
        id: 'prof_kids',
        userId: demoUser.id,
        name: 'Espace Enfants',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80',
        isKids: true,
        language: 'fr'
      }
    ];
    profiles.forEach(p => db.insert('profiles', p));
  }

  // 3. Seed / Update Videos & Drama Series
  for (const video of SAMPLE_VIDEOS) {
    const exists = db.findById('videos', video.id);
    if (!exists) {
      db.insert('videos', video);
    } else {
      db.updateById('videos', video.id, video);
    }
  }

  // 4. Seed initial continue-watching progress for Alex
  const demoProfile = db.findOne('profiles', p => p.userId === demoUser.id && !p.isKids);
  if (demoProfile) {
    const existingProgress = db.find('playback_progress', p => p.profileId === demoProfile.id);
    if (existingProgress.length === 0) {
      db.insert('playback_progress', {
        id: 'prog_1',
        userId: demoUser.id,
        profileId: demoProfile.id,
        videoId: 'series-destins-croises',
        currentTime: 320,
        duration: 734,
        progressPercent: 43,
        episodeId: 'ep-dc-1',
        episodeTitle: 'Épisode 1 : La Rencontre Sous la Pluie',
        lastWatchedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        completed: false
      });
      db.insert('playback_progress', {
        id: 'prog_2',
        userId: demoUser.id,
        profileId: demoProfile.id,
        videoId: 'series-heritiere-chaebol',
        currentTime: 410,
        duration: 720,
        progressPercent: 57,
        episodeId: 'ep-hc-1',
        episodeTitle: 'Épisode 1 : Le Retour d’Exil',
        lastWatchedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        completed: false
      });
    }

    // 5. Seed initial watchlist
    const existingWatchlist = db.find('watchlist', w => w.profileId === demoProfile.id);
    if (existingWatchlist.length === 0) {
      db.insert('watchlist', {
        id: 'wl_1',
        userId: demoUser.id,
        profileId: demoProfile.id,
        videoId: 'series-gardien-crepuscule',
        addedAt: new Date().toISOString()
      });
      db.insert('watchlist', {
        id: 'wl_2',
        userId: demoUser.id,
        profileId: demoProfile.id,
        videoId: 'vid-nova-station',
        addedAt: new Date().toISOString()
      });
    }
  }

  console.log('Database seeded with Séries Drama successfully.');
}

if (process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
