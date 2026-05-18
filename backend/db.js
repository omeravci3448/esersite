import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || './data';
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'db.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    full_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS collection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    category TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const defaultUser = process.env.DEFAULT_ADMIN_USER || 'admin';
  const defaultPass = process.env.DEFAULT_ADMIN_PASS || 'esermobilya2026';
  const hash = bcrypt.hashSync(defaultPass, 10);
  db.prepare('INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)').run(
    defaultUser, hash, 'root', 'Yönetici'
  );
  console.log(`[db] Default admin created → username: ${defaultUser}`);
}

const defaultContent = {
  hero_title: "Afyonkarahisar'da Özel <span>Mobilya İmalatı</span>",
  hero_subtitle: "Afyon mobilya sektörünün öncü markası Eser Mobilya & İç Mekan Tasarım ile hayallerinizi gerçeğe dönüştürüyoruz. Özel ölçü mutfak dolabı, TV ünitesi, gardırop, vestiyer ve kapı imalatında Afyonkarahisar'daki en güvenilir çözüm ortağınız.",
  contact_email: "info@esericmimarlikmobilya.com",
  contact_phone: "+90 554 380 51 35",
  contact_address: "Veysel Karani Mahallesi 1135. Sokak No: 15/A Merkez/Afyonkarahisar"
};

const insertContent = db.prepare('INSERT OR IGNORE INTO content (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(defaultContent)) {
  insertContent.run(key, value);
}

export default db;
