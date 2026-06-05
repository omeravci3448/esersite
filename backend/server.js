import express from 'express';
import cors from 'cors';
import path from 'path';
import './db.js';

import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import collectionRoutes from './routes/collection.js';
import faqRoutes from './routes/faq.js';
import uploadRoutes from './routes/upload.js';
import fasonRoutes from './routes/fason.js';
import whatsappRoutes from './routes/whatsapp.js';
import referencesRoutes from './routes/references.js';

const app = express();
app.set('trust proxy', 1); // Coolify/Traefik reverse proxy arkasında doğru istemci IP'si için
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || './data';

const allowedOrigins = (process.env.CORS_ORIGINS || 'https://esericmimarlikmobilya.com,https://www.esericmimarlikmobilya.com,https://fason.esericmimarlikmobilya.com')
  .split(',')
  .map(s => s.trim());

const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || (isDev && origin.startsWith('http://localhost'))) {
      return cb(null, true);
    }
    cb(new Error('CORS: origin izinli değil'));
  }
}));

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads'), {
  maxAge: '7d',
  setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=604800')
}));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/auth', authRoutes);
app.use('/content', contentRoutes);
app.use('/collection', collectionRoutes);
app.use('/faq', faqRoutes);
app.use('/upload', uploadRoutes);
app.use('/fason', fasonRoutes);
app.use('/whatsapp', whatsappRoutes);
app.use('/references', referencesRoutes);

app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Sunucu hatası' });
});

app.listen(PORT, () => {
  console.log(`[server] Eser Mobilya API ${PORT} portunda dinliyor`);
  console.log(`[server] İzin verilen origin'ler: ${allowedOrigins.join(', ')}`);
});
