import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM faq ORDER BY order_index ASC, id ASC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { question, answer, order_index } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'question ve answer zorunludur' });
  }
  const result = db.prepare(
    'INSERT INTO faq (question, answer, order_index) VALUES (?, ?, ?)'
  ).run(question, answer, order_index || 0);
  const created = db.prepare('SELECT * FROM faq WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.patch('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM faq WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bulunamadı' });

  const updated = {
    question: req.body.question ?? existing.question,
    answer: req.body.answer ?? existing.answer,
    order_index: req.body.order_index ?? existing.order_index
  };
  db.prepare(
    'UPDATE faq SET question = ?, answer = ?, order_index = ? WHERE id = ?'
  ).run(updated.question, updated.answer, updated.order_index, id);
  res.json(db.prepare('SELECT * FROM faq WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM faq WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Bulunamadı' });
  res.json({ success: true });
});

export default router;
