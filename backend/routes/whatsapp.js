import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM whatsapp_contacts ORDER BY order_index ASC, id ASC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { name, number, order_index } = req.body;
  if (!name || !number) return res.status(400).json({ error: 'name ve number zorunlu' });
  const cleanNumber = String(number).replace(/[^\d]/g, '');
  if (!cleanNumber) return res.status(400).json({ error: 'Geçerli bir telefon numarası girin' });
  const result = db.prepare(
    'INSERT INTO whatsapp_contacts (name, number, order_index) VALUES (?, ?, ?)'
  ).run(name, cleanNumber, Number(order_index) || 0);
  const row = db.prepare('SELECT * FROM whatsapp_contacts WHERE id = ?').get(result.lastInsertRowid);
  res.json(row);
});

router.patch('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM whatsapp_contacts WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bulunamadı' });
  const updated = {
    name: req.body.name ?? existing.name,
    number: req.body.number != null ? String(req.body.number).replace(/[^\d]/g, '') : existing.number,
    order_index: req.body.order_index ?? existing.order_index
  };
  db.prepare(
    'UPDATE whatsapp_contacts SET name = ?, number = ?, order_index = ? WHERE id = ?'
  ).run(updated.name, updated.number, updated.order_index, id);
  res.json(db.prepare('SELECT * FROM whatsapp_contacts WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM whatsapp_contacts WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Bulunamadı' });
  res.json({ success: true });
});

export default router;
