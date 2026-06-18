import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Resolved path to the uploads folder
export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Create the folder if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure where and how files are saved on disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});

// 10 MB max file size
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});
