import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { deleteUploadIfExists } from './upload.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM collection ORDER BY order_index ASC, id ASC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { title, subtitle, image_url, category, order_index } = req.body;
  if (!title || !image_url) {
    return res.status(400).json({ error: 'title ve image_url zorunludur' });
  }
  const result = db.prepare(
    'INSERT INTO collection (title, subtitle, image_url, category, order_index) VALUES (?, ?, ?, ?, ?)'
  ).run(title, subtitle || null, image_url, category || null, order_index || 0);
  const created = db.prepare('SELECT * FROM collection WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.patch('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM collection WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bulunamadı' });

  const updated = {
    title: req.body.title ?? existing.title,
    subtitle: req.body.subtitle ?? existing.subtitle,
    image_url: req.body.image_url ?? existing.image_url,
    category: req.body.category ?? existing.category,
    order_index: req.body.order_index ?? existing.order_index
  };
  db.prepare(
    'UPDATE collection SET title = ?, subtitle = ?, image_url = ?, category = ?, order_index = ? WHERE id = ?'
  ).run(updated.title, updated.subtitle, updated.image_url, updated.category, updated.order_index, id);

  if (existing.image_url && existing.image_url !== updated.image_url) {
    deleteUploadIfExists(existing.image_url);
  }
  res.json(db.prepare('SELECT * FROM collection WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM collection WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bulunamadı' });

  db.prepare('DELETE FROM collection WHERE id = ?').run(id);
  if (existing.image_url) deleteUploadIfExists(existing.image_url);
  res.json({ success: true });
});

export default router;
