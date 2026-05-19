import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { deleteUploadIfExists } from './upload.js';

const router = Router();

// ───── Fason content (key-value) ─────
router.get('/content', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM fason_content').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

router.patch('/content/:key', requireAuth, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (typeof value !== 'string') {
    return res.status(400).json({ error: 'value alanı string olmalı' });
  }
  const previous = db.prepare('SELECT value FROM fason_content WHERE key = ?').get(key);
  db.prepare('INSERT INTO fason_content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);

  if (previous && previous.value && previous.value !== value && key.endsWith('_image')) {
    deleteUploadIfExists(previous.value);
  }
  res.json({ key, value });
});

// ───── Fason services (CRUD) ─────
router.get('/services', (req, res) => {
  const rows = db.prepare('SELECT * FROM fason_services ORDER BY order_index ASC, id ASC').all();
  res.json(rows);
});

router.post('/services', requireAuth, (req, res) => {
  const { title, description, icon, order_index } = req.body;
  if (!title) return res.status(400).json({ error: 'title zorunlu' });
  const result = db.prepare(
    'INSERT INTO fason_services (title, description, icon, order_index) VALUES (?, ?, ?, ?)'
  ).run(title, description || '', icon || 'fas fa-tools', Number(order_index) || 0);
  const row = db.prepare('SELECT * FROM fason_services WHERE id = ?').get(result.lastInsertRowid);
  res.json(row);
});

router.patch('/services/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM fason_services WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bulunamadı' });

  const updated = {
    title: req.body.title ?? existing.title,
    description: req.body.description ?? existing.description,
    icon: req.body.icon ?? existing.icon,
    order_index: req.body.order_index ?? existing.order_index
  };
  db.prepare(
    'UPDATE fason_services SET title = ?, description = ?, icon = ?, order_index = ? WHERE id = ?'
  ).run(updated.title, updated.description, updated.icon, updated.order_index, id);
  res.json(db.prepare('SELECT * FROM fason_services WHERE id = ?').get(id));
});

router.delete('/services/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM fason_services WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Bulunamadı' });
  res.json({ success: true });
});

// ───── Fason FAQ (CRUD) ─────
router.get('/faq', (req, res) => {
  const rows = db.prepare('SELECT * FROM fason_faq ORDER BY order_index ASC, id ASC').all();
  res.json(rows);
});

router.post('/faq', requireAuth, (req, res) => {
  const { question, answer, order_index } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'question ve answer zorunlu' });
  const result = db.prepare(
    'INSERT INTO fason_faq (question, answer, order_index) VALUES (?, ?, ?)'
  ).run(question, answer, Number(order_index) || 0);
  const row = db.prepare('SELECT * FROM fason_faq WHERE id = ?').get(result.lastInsertRowid);
  res.json(row);
});

router.patch('/faq/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM fason_faq WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bulunamadı' });

  const updated = {
    question: req.body.question ?? existing.question,
    answer: req.body.answer ?? existing.answer,
    order_index: req.body.order_index ?? existing.order_index
  };
  db.prepare(
    'UPDATE fason_faq SET question = ?, answer = ?, order_index = ? WHERE id = ?'
  ).run(updated.question, updated.answer, updated.order_index, id);
  res.json(db.prepare('SELECT * FROM fason_faq WHERE id = ?').get(id));
});

router.delete('/faq/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM fason_faq WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Bulunamadı' });
  res.json({ success: true });
});

export default router;
