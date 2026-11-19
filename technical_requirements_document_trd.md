# Technical Requirements Document (TRD) — Plateforme de Streaming Vidéo

## 1. Architecture Globale
L'architecture repose sur une approche orientée microservices (ou modulaire) découplant la gestion des utilisateurs/métadonnées du pipeline de traitement et de diffusion vidéo.

* **Frontend :** Application Web (React / Next.js) et Applications Mobiles (React Native ou Flutter).
* **Backend API :** Node.js (NestJS) ou Go / Python (FastAPI) exposant une API REST ou GraphQL.
* **Pipeline Vidéo :** Ingestion -> Transcodage -> Stockage -> Distribution via CDN.

## 2. Stack Technique Recommandée
* **Base de données principale :** PostgreSQL (utilisateurs, abonnements, catalogues, relations).
* **Base de données NoSQL / Cache :** Redis (sessions, mise en cache des requêtes fréquentes, progression de lecture en temps réel).
* **Moteur de recherche :** Elasticsearch ou Meilisearch (indexation rapide du catalogue).
* **Stockage Objet :** AWS S3, Google Cloud Storage ou Cloudflare R2 (fichiers sources et segments vidéo).
* **CDN (Content Delivery Network) :** Cloudflare, AWS CloudFront ou Fastly.

## 3. Pipeline de Traitement Vidéo (Video Processing)

### 3.1. Ingestion et Transcodage
* **Format d'entrée :** MP4, MOV, MKV (haute résolution).
* **Outil de transcodage :** FFmpeg (via workers asynchrones) ou services managés (AWS Elemental MediaConvert, Mux, Cloudflare Stream).
* **Profils d'encodage (ABR - Adaptive Bitrate) :**
  * 1080p (Full HD) - 5 Mbps
  * 720p (HD) - 2.5 Mbps
  * 480p (SD) - 1 Mbps
  * 360p (Low) - 500 kbps
* **Codecs :** H.264 (compatibilité maximale) et H.265/HEVC ou AV1 (optimisation bande passante). Audio en AAC.

### 3.2. Protocoles de Streaming
* **HLS (HTTP Live Streaming) :** `.m3u8` + segments `.ts` ou `.m4s` (indispensable pour iOS/Safari et supporté partout).
* **MPEG-DASH :** `.mpd` (standard ouvert pour Web et Android).

### 3.3. Lecteur Vidéo Frontend
* Intégration de **Video.js**, **Shaka Player** ou **HLS.js** sur le Web.
* **ExoPlayer** (Android) et **AVPlayer** (iOS).

## 4. Sécurité et Protection du Contenu
* **Authentification :** JWT (JSON Web Tokens) avec Refresh Tokens sécurisés (HttpOnly cookies).
* **Protection des flux (Anti-piratage) :**
  * URLs signées avec expiration courte (Signed URLs / Tokens CDN).
  * Chiffrement AES-128 pour HLS.
  * **DRM (Digital Rights Management)** pour les contenus premium : Widevine (Google), FairPlay (Apple), PlayReady (Microsoft).
* **Sécurité API :** Rate limiting, validation stricte des entrées, protection CORS et HTTPS obligatoire (TLS 1.3).

## 5. Performance, Scalabilité et Monitoring
* **Disponibilité (SLA) :** 99.9 % minimum.
* **Temps de démarrage vidéo (Time To First Frame) :** < 2 secondes.
* **Scalabilité :** Déploiement conteneurisé (Docker) orchestré par Kubernetes ou services serverless auto-scalables.
* **Observabilité :**
  * Logs et métriques serveur : Prometheus + Grafana / Datadog.
  * Analytics lecteur vidéo (QoE - Quality of Experience) : suivi des erreurs de lecture, du taux de buffering et des changements de résolution.

## 6. Intégrations Tierces
* **Paiement :** Stripe ou PayPal (gestion des abonnements récurrents et webhooks).
* **Emails / Notifications :** SendGrid / Amazon SES (transactionnel), Firebase Cloud Messaging (Push mobile).