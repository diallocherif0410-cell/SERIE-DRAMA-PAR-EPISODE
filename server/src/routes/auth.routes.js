import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { CONFIG } from '../config.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ userId }, CONFIG.JWT_SECRET, { expiresIn: '7d' });
}

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }

    const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Un compte avec cet email existe déjà.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const user = {
      id: `usr_${uuidv4().substring(0, 8)}`,
      email: email.toLowerCase(),
      name,
      role: 'user',
      plan: 'standard',
      passwordHash,
      createdAt: new Date().toISOString()
    };
    db.insert('users', user);

    // Create default profile for the user
    const defaultProfile = {
      id: `prof_${uuidv4().substring(0, 8)}`,
      userId: user.id,
      name,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      isKids: false,
      language: 'fr'
    };
    db.insert('profiles', defaultProfile);

    const token = createToken(user.id);
    const userSafe = { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan };

    res.json({
      token,
      user: userSafe,
      profiles: [defaultProfile],
      activeProfile: defaultProfile
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'inscription.' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const match = bcrypt.compareSync(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const token = createToken(user.id);
    const profiles = db.find('profiles', p => p.userId === user.id);
    const userSafe = { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan };

    res.json({
      token,
      user: userSafe,
      profiles,
      activeProfile: profiles[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
});

// Get current user and profiles
router.get('/me', authenticate, (req, res) => {
  const user = req.user;
  const profiles = db.find('profiles', p => p.userId === user.id);
  const userSafe = { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan };
  res.json({
    user: userSafe,
    profiles
  });
});

// Profiles CRUD
router.get('/profiles', authenticate, (req, res) => {
  const profiles = db.find('profiles', p => p.userId === req.user.id);
  res.json(profiles);
});

router.post('/profiles', authenticate, (req, res) => {
  const { name, avatar, isKids, language } = req.body;
  if (!name) return res.status(400).json({ error: 'Le nom du profil est requis.' });

  const currentProfiles = db.find('profiles', p => p.userId === req.user.id);
  if (currentProfiles.length >= 5) {
    return res.status(400).json({ error: 'Limite de 5 profils par compte atteinte.' });
  }

  const profile = {
    id: `prof_${uuidv4().substring(0, 8)}`,
    userId: req.user.id,
    name,
    avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    isKids: Boolean(isKids),
    language: language || 'fr'
  };

  db.insert('profiles', profile);
  res.json(profile);
});

router.put('/profiles/:id', authenticate, (req, res) => {
  const profile = db.findOne('profiles', p => p.id === req.params.id && p.userId === req.user.id);
  if (!profile) return res.status(404).json({ error: 'Profil introuvable.' });

  const { name, avatar, isKids, language } = req.body;
  const updated = db.updateById('profiles', profile.id, {
    ...(name !== undefined && { name }),
    ...(avatar !== undefined && { avatar }),
    ...(isKids !== undefined && { isKids: Boolean(isKids) }),
    ...(language !== undefined && { language })
  });

  res.json(updated);
});

router.delete('/profiles/:id', authenticate, (req, res) => {
  const currentProfiles = db.find('profiles', p => p.userId === req.user.id);
  if (currentProfiles.length <= 1) {
    return res.status(400).json({ error: 'Impossible de supprimer le dernier profil du compte.' });
  }

  const profile = db.findOne('profiles', p => p.id === req.params.id && p.userId === req.user.id);
  if (!profile) return res.status(404).json({ error: 'Profil introuvable.' });

  db.deleteById('profiles', profile.id);
  // Also clean up watchlist and playback progress for this profile
  db.deleteWhere('playback_progress', p => p.profileId === profile.id);
  db.deleteWhere('watchlist', w => w.profileId === profile.id);

  res.json({ success: true });
});

export default router;
