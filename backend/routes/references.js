import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM references_list ORDER BY order_index ASC, id ASC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { name, icon, order_index } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'İsim zorunlu' });
  const result = db.prepare(
    'INSERT INTO references_list (name, icon, order_index) VALUES (?, ?, ?)'
  ).run(String(name).trim(), icon || 'fas fa-building', Number(order_index) || 0);
  res.json(db.prepare('SELECT * FROM references_list WHERE id = ?').get(result.lastInsertRowid));
});

router.patch('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM references_list WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bulunamadı' });
  const updated = {
    name: req.body.name ?? existing.name,
    icon: req.body.icon ?? existing.icon,
    order_index: req.body.order_index ?? existing.order_index
  };
  db.prepare('UPDATE references_list SET name = ?, icon = ?, order_index = ? WHERE id = ?')
    .run(updated.name, updated.icon, updated.order_index, id);
  res.json(db.prepare('SELECT * FROM references_list WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM references_list WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Bulunamadı' });
  res.json({ success: true });
});

export default router;
