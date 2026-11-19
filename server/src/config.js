import path from 'path';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
  ? null
  : randomBytes(32).toString('hex'));

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set in production.');
}

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: jwtSecret,
  DATA_DIR: path.join(rootDir, 'data'),
  DB_FILE: path.join(rootDir, 'data', 'cinestream_db.json'),
  UPLOADS_DIR: path.join(rootDir, 'uploads'),
  TRANSCODED_DIR: path.join(rootDir, 'transcoded'),
  CLIENT_DIST_DIR: path.resolve(rootDir, '..', 'client', 'dist'),
  MAX_UPLOAD_SIZE: 1024 * 1024 * 1024 * 2, // 2 GB
};
