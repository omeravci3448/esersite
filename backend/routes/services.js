import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM services ORDER BY order_index ASC, id ASC').all());
});

router.post('/', requireAuth, (req, res) => {
  const { title, description, icon, order_index } = req.body;
  if (!title) return res.status(400).json({ error: 'Başlık zorunlu' });
  const result = db.prepare(
    'INSERT INTO services (title, description, icon, order_index) VALUES (?, ?, ?, ?)'
  ).run(String(title).trim(), description || '', icon || 'fas fa-tools', Number(order_index) || 0);
  res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid));
});

router.patch('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bulunamadı' });
  const updated = {
    title: req.body.title ?? existing.title,
    description: req.body.description ?? existing.description,
    icon: req.body.icon ?? existing.icon,
    order_index: req.body.order_index ?? existing.order_index
  };
  db.prepare('UPDATE services SET title = ?, description = ?, icon = ?, order_index = ? WHERE id = ?')
    .run(updated.title, updated.description, updated.icon, updated.order_index, id);
  res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM services WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Bulunamadı' });
  res.json({ success: true });
});

export default router;
