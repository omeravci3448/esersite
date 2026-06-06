import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { deleteUploadIfExists } from './upload.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM references_list ORDER BY order_index ASC, id ASC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { name, icon, logo_url, order_index } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'İsim zorunlu' });
  const result = db.prepare(
    'INSERT INTO references_list (name, icon, logo_url, order_index) VALUES (?, ?, ?, ?)'
  ).run(String(name).trim(), icon || 'fas fa-building', logo_url || null, Number(order_index) || 0);
  res.json(db.prepare('SELECT * FROM references_list WHERE id = ?').get(result.lastInsertRowid));
});

router.patch('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM references_list WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bulunamadı' });
  const updated = {
    name: req.body.name ?? existing.name,
    icon: req.body.icon ?? existing.icon,
    logo_url: req.body.logo_url !== undefined ? req.body.logo_url : existing.logo_url,
    order_index: req.body.order_index ?? existing.order_index
  };
  db.prepare('UPDATE references_list SET name = ?, icon = ?, logo_url = ?, order_index = ? WHERE id = ?')
    .run(updated.name, updated.icon, updated.logo_url || null, updated.order_index, id);

  if (existing.logo_url && existing.logo_url !== updated.logo_url) {
    deleteUploadIfExists(existing.logo_url);
  }
  res.json(db.prepare('SELECT * FROM references_list WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM references_list WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bulunamadı' });
  db.prepare('DELETE FROM references_list WHERE id = ?').run(id);
  if (existing.logo_url) deleteUploadIfExists(existing.logo_url);
  res.json({ success: true });
});

export default router;
