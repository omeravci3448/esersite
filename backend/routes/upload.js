import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const UPLOAD_DIR = path.join(process.env.DATA_DIR || './data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB) || 5;
const MAX_UPLOAD_COUNT = Number(process.env.MAX_UPLOAD_COUNT) || 100;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

function countUploads() {
  try {
    return fs.readdirSync(UPLOAD_DIR).filter(f => !f.startsWith('.')).length;
  } catch {
    return 0;
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext) ? ext : '.png';
    const name = crypto.randomBytes(16).toString('hex') + safeExt;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('UNSUPPORTED_FILE_TYPE'));
    }
    cb(null, true);
  }
});

router.get('/limits', (req, res) => {
  res.json({
    maxFileSizeMB: MAX_FILE_SIZE_MB,
    maxUploadCount: MAX_UPLOAD_COUNT,
    currentCount: countUploads()
  });
});

router.post('/', requireAuth, (req, res) => {
  if (countUploads() >= MAX_UPLOAD_COUNT) {
    return res.status(413).json({
      error: 'UPLOAD_LIMIT_REACHED',
      message: `Resim yükleme sınırına ulaştınız (en fazla ${MAX_UPLOAD_COUNT} resim). Lütfen eski resimlerden silerek yeni resim yüklemesi yapınız.`,
      limit: MAX_UPLOAD_COUNT,
      current: countUploads()
    });
  }

  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'FILE_TOO_LARGE',
          message: `En fazla ${MAX_FILE_SIZE_MB} MB boyutunda resim yükleyebilirsiniz.`,
          maxFileSizeMB: MAX_FILE_SIZE_MB
        });
      }
      if (err.message === 'UNSUPPORTED_FILE_TYPE') {
        return res.status(400).json({
          error: 'UNSUPPORTED_FILE_TYPE',
          message: 'Sadece görsel dosyaları (PNG, JPG, WEBP, GIF) yüklenebilir.'
        });
      }
      return res.status(400).json({ error: err.message, message: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı', message: 'Dosya bulunamadı' });
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: publicUrl,
      filename: req.file.filename,
      currentCount: countUploads(),
      maxUploadCount: MAX_UPLOAD_COUNT
    });
  });
});

router.delete('/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Dosya bulunamadı' });
  }
  try {
    fs.unlinkSync(filepath);
    res.json({ success: true, currentCount: countUploads() });
  } catch (err) {
    res.status(500).json({ error: 'Silme başarısız: ' + err.message });
  }
});

export function deleteUploadIfExists(url) {
  if (!url || !url.startsWith('/uploads/')) return false;
  const filename = path.basename(url);
  const filepath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filepath)) return false;
  try {
    fs.unlinkSync(filepath);
    return true;
  } catch {
    return false;
  }
}

export default router;
