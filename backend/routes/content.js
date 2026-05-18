import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { deleteUploadIfExists } from './upload.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM content').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

router.patch('/:key', requireAuth, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (typeof value !== 'string') {
    return res.status(400).json({ error: 'value alanı string olmalı' });
  }
  const previous = db.prepare('SELECT value FROM content WHERE key = ?').get(key);
  db.prepare('INSERT INTO content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);

  if (previous && previous.value && previous.value !== value && key.endsWith('_image')) {
    deleteUploadIfExists(previous.value);
  }
  res.json({ key, value });
});

export default router;
