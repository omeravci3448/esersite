import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM stats ORDER BY order_index ASC, id ASC').all());
});

router.post('/', requireAuth, (req, res) => {
  const { value, label, order_index } = req.body;
  if (!value || !label) return res.status(400).json({ error: 'Değer ve etiket zorunlu' });
  const result = db.prepare(
    'INSERT INTO stats (value, label, order_index) VALUES (?, ?, ?)'
  ).run(String(value).trim(), String(label).trim(), Number(order_index) || 0);
  res.json(db.prepare('SELECT * FROM stats WHERE id = ?').get(result.lastInsertRowid));
});

router.patch('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM stats WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bulunamadı' });
  const updated = {
    value: req.body.value ?? existing.value,
    label: req.body.label ?? existing.label,
    order_index: req.body.order_index ?? existing.order_index
  };
  db.prepare('UPDATE stats SET value = ?, label = ?, order_index = ? WHERE id = ?')
    .run(updated.value, updated.label, updated.order_index, id);
  res.json(db.prepare('SELECT * FROM stats WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM stats WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Bulunamadı' });
  res.json({ success: true });
});

export default router;
