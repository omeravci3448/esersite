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

const collectionCount = db.prepare('SELECT COUNT(*) as c FROM collection').get().c;
if (collectionCount === 0) {
  const defaultCollection = [
    { title: 'Afyon Mutfak Dolapları', subtitle: 'Modern & Fonksiyonel', image_url: '/assets/images/kitchen.png', category: 'Mutfak', order_index: 1 },
    { title: 'Vestiyer & Portmanto', subtitle: 'Şık Karşılama Alanları', image_url: '/assets/images/vestiyer.png', category: 'Vestiyer', order_index: 2 },
    { title: 'Gardırop, Dolap & TV Ünitesi', subtitle: 'Akıllı Depolama', image_url: '/assets/images/closet.png', category: 'Gardırop', order_index: 3 },
    { title: 'İç Mekan Kapı İmalatı', subtitle: 'Premium Ahşap İşçiliği', image_url: '/assets/images/door.png', category: 'Kapı', order_index: 4 }
  ];
  const insertCol = db.prepare('INSERT INTO collection (title, subtitle, image_url, category, order_index) VALUES (?, ?, ?, ?, ?)');
  for (const item of defaultCollection) {
    insertCol.run(item.title, item.subtitle, item.image_url, item.category, item.order_index);
  }
  console.log(`[db] ${defaultCollection.length} koleksiyon ürünü eklendi`);
}

const faqCount = db.prepare('SELECT COUNT(*) as c FROM faq').get().c;
if (faqCount === 0) {
  const defaultFaq = [
    {
      question: 'Üretim süreci ne kadar sürer?',
      answer: 'Projenin büyüklüğüne göre değişmekle birlikte, ortalama bir mutfak veya vestiyer projesi onaydan sonra 3-4 hafta içinde teslim edilmektedir.',
      order_index: 1
    },
    {
      question: 'Ücretsiz keşif ve ölçü alıyor musunuz?',
      answer: 'Evet, Afyonkarahisar merkez ve çevre bölgelerde yerinde ölçü alıyor ve projenizi 3 boyutlu olarak tasarlayıp ücretsiz sunuyoruz.',
      order_index: 2
    },
    {
      question: 'Ürünlerinizde garanti süresi ne kadar?',
      answer: 'Tüm imalatlarımızda malzeme hatalarına karşı 2 yıl, kullanılan mekanizmalarda ise üretici garantisiyle 10 yıla kadar destek sunuyoruz.',
      order_index: 3
    },
    {
      question: 'TV ünitesi ve gardırop imalatı da yapıyor musunuz?',
      answer: 'Evet, mutfak dolabı ve vestiyer dışında özel ölçü TV ünitesi, gardırop, giyinme odası ve iç mekan kapı imalatı da yapıyoruz. Tüm ürünler Afyonkarahisar atölyemizde üretilmektedir.',
      order_index: 4
    }
  ];
  const insertFaq = db.prepare('INSERT INTO faq (question, answer, order_index) VALUES (?, ?, ?)');
  for (const f of defaultFaq) {
    insertFaq.run(f.question, f.answer, f.order_index);
  }
  console.log(`[db] ${defaultFaq.length} SSS sorusu eklendi`);
}

export default db;
