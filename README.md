# SERIE-DRAMA-PAR-EPISODE — CineStream

**DES SERIE DRAMA DISPONIBLE TOUT LES JOURS**

## 🎬 Plateforme de Streaming Vidéo VOD & ABR

**CineStream** est une plateforme complète de vidéo à la demande (VOD) et de streaming adaptatif (ABR - Adaptive Bitrate), développée en stricte conformité avec le **Product Requirements Document (PRD)** et le **Technical Requirements Document (TRD)** du Projet 1.

---

## 🌟 Fonctionnalités Implémentées (PRD & TRD)

### 1. Authentification & Multi-Profils (PRD §4.1)
- **Authentification sécurisée :** JWT avec expiration, hachage bcrypt, endpoints de connexion et d'inscription.
- **Gestion multi-profils (jusqu'à 5 profils par compte) :**
  - Profils adultes personnalisés (ex: *Alex*, *Emma*).
  - Profil *Espace Enfants* (`isKids: true`) avec **filtrage parental automatique** excluant les contenus 12+, 16+ et 18+.
- **Gestion des abonnements (SVOD & AVOD) :**
  - **Formule Gratuite (AVOD) :** 720p HD, 1 écran, avec annonces publicitaires.
  - **Standard HD (SVOD) :** 1080p Full HD, 2 écrans simultanés, son Dolby Digital.
  - **Premium 4K Ultra HD :** 4K HDR & Dolby Atmos, 4 écrans en simultané.

### 2. Catalogue & Découverte (PRD §4.2)
- **Hero Banner dynamique :** Mise en avant de l'œuvre phare avec backdrop cinématique, score de concordance (98%), classification d'âge, synopsis et boutons d'action rapide.
- **Carrousels interactifs :**
  - **« Continuer la lecture » :** Reprise instantanée à la seconde exacte avec jauge de progression visuelle.
  - **« Tendances CineStream » :** Top 10 avec numérotation stylisée.
  - **Catégories par genre :** Science-Fiction, Animation, Documentaires terrestres, Action & Vitesse.
- **Moteur de recherche & filtres avancés :**
  - Recherche en temps réel avec auto-complétion instantanée.
  - Filtrage multi-critères par genre, année de sortie, classification et tri par popularité ou note.
- **Fiche détaillée (Modal Preview) :** Synopsis complet, distribution, réalisateur, pistes audio/sous-titres et grille de recommandations de titres similaires.

### 3. Lecteur Vidéo Adaptatif — Core Feature (PRD §4.3 & TRD §3.3)
- **Streaming adaptatif (HLS / ABR) :**
  - Intégration de **Hls.js** et lecture HTML5.
  - Sélecteur manuel ou automatique de qualité (1080p, 720p, 480p, 360p, Auto) avec calcul dynamique du débit.
- **HUD de télémétrie QoE (Quality of Experience) :**
  - Suivi en temps réel de la résolution active, du débit (Mbps), de la longueur du tampon (buffer health) et du taux de rebond.
- **Contrôles complets :**
  - Lecture / Pause (animation centrale & barre d'espace).
  - Avance / Retour rapide de 10 secondes (boutons et flèches gauche/droite).
  - Barre de progression avec prévisualisation au survol (hover time tooltip) et indicateur de mise en mémoire tampon.
  - Réglage du volume avec slider interactif et touche raccourci `M` (Mute).
  - Vitesse de lecture variable (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x).
  - Sélecteur de pistes audio et de sous-titres WebVTT synchronisés.
  - Mode **Picture-in-Picture (PiP)** et mode **Plein écran** (touche `F`).
  - **Synchronisation automatique de la progression :** Sauvegarde toutes les 4 secondes vers l'API backend pour synchronisation multi-appareils.

### 4. Interactions & Personnalisation (PRD §4.4)
- **Ma Liste (Watchlist) :** Ajout/retrait en 1 clic synchronisé sur l'ensemble de l'interface.
- **Système de notation et avis :**
  - Pouce levé / Pouce baissé (Likes/Dislikes) avec recalcul dynamique des compteurs.
  - Évaluation par étoiles (1 à 5 étoiles) et rédaction d'avis critiques affichés sur la fiche.

### 5. Console Studio Administrateur & Pipeline FFmpeg (PRD §4.5 & TRD §3.1)
- **Pipeline d'ingestion et transcodage réel avec FFmpeg :**
  - Upload de vidéos sources (MP4, MKV, MOV).
  - Extraction automatique des métadonnées (durée, résolution, codecs).
  - Génération de miniatures et affiches.
  - Encodage ABR multi-résolutions (1080p, 720p, 360p) avec segmentation HLS (fichiers `.ts` de 4s et master playlist `.m3u8`).
  - Suivi en direct de la progression du transcodage dans la console.
- **Observabilité & Métriques QoE :**
  - Suivi du Time to First Frame (&lt; 2s), taux de buffering (&lt; 1% SLA), utilisation disque et répartition des abonnés.
- **Gestion du catalogue :** Modération, prévisualisation et suppression d'œuvres.

---

## 🛠️ Stack Technique

| Composant | Technologie | Description |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | Interface réactive sombre (Dark Mode natif cinéma), conforme WCAG 2.1 AA |
| **Lecteur Vidéo** | Hls.js, HTML5 Media API, RFC 7233 HTTP Range | Lecteur ABR adaptatif avec HUD télémétrique QoE |
| **Backend API** | Node.js, Express, Multer, JWT, Bcrypt | API REST modulaire, gestion des sessions et streaming |
| **Pipeline Vidéo** | FFmpeg (binaires natifs) | Extraction métadonnées, transcodage ABR et segmentation HLS |
| **Base de Données** | Moteur JSON persistant atomique | Base de données locale avec relations, indexation et auto-sauvegarde |

---

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** v18+ (actuellement testé sous Node v20.18.0)
- **FFmpeg** (déjà installé et opérationnel dans le système)

### Lancement de la plateforme

Depuis la racine du projet (`projet1`) :

```bash
# 1. Démarrer le serveur API et le Web (prêt sur le port 5000)
npm start
```

Ouvrez ensuite votre navigateur sur :
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Identifiants de Démonstration Préconfigurés

| Profil | Email | Mot de passe | Rôle & Droits |
|---|---|---|---|
| **Spectateur Démo** | `demo@cinestream.io` | `Demo123!` | Accès au catalogue, 3 profils (Alex, Emma, Enfants), reprise de lecture |

Le compte Studio Admin n'est créé que si la variable `ADMIN_INITIAL_PASSWORD` (12 caractères minimum) est définie avant l'initialisation de la base. N'utilisez jamais le mot de passe de démonstration pour un compte administrateur.

---

## ☁️ Déploiement public sur Render

Le fichier `render.yaml` configure le service web CineStream. Pour le publier :

1. Envoyez le contenu du dépôt sur GitHub, puis connectez ce dépôt à Render.
2. Dans Render, choisissez **New > Blueprint** et sélectionnez le dépôt.
3. Définissez `ADMIN_INITIAL_PASSWORD` avec un mot de passe fort lors de la création du service. `JWT_SECRET` est généré automatiquement.
4. Attendez la fin du déploiement, puis ouvrez l'URL `onrender.com` fournie par Render.

Le service gratuit utilise un disque temporaire : la base JSON et les fichiers téléversés peuvent être perdus lors d'un redémarrage ou d'un redéploiement. Pour conserver durablement les comptes et les médias, configurez un disque persistant et dirigez les données vers celui-ci avant une utilisation réelle.

---

## ⌨️ Raccourcis Clavier du Lecteur

- **Espace** : Lecture / Pause
- **Flèche Gauche / Droite** : Reculer / Avancer de 10 secondes
- **Flèche Haut / Bas** : Augmenter / Diminuer le volume
- **M** : Couper / Réactiver le son (Mute)
- **F** : Basculer en mode Plein écran
- **Échap** : Quitter le plein écran ou fermer le lecteur
