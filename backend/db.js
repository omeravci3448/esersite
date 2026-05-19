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

  CREATE TABLE IF NOT EXISTS fason_content (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS fason_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fason_faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fason_whatsapp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number TEXT NOT NULL,
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
  hero_image: "/assets/images/hero.png",
  about_image: "/assets/images/hero.png",
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

const defaultFasonContent = {
  hero_title: "Afyon'da <span>Profesyonel Fason Kesim</span>",
  hero_subtitle: "Mobilyacılar, marangozlar ve atölyeler için hassas ölçülerde MDF, sunta ve melamin kesim. Kenar bantlama, CNC işleme ve özel parça üretimi tek elden, hızlı teslimat ile.",
  hero_image: "/assets/images/hero.png",
  intro_title: "Fason Kesim Nedir? Kimler İçin?",
  intro_text: "Fason kesim, mobilyacıların ihtiyaç duyduğu MDF, melamin ve sunta panelleri istedikleri ölçü, açı ve özelliklerde kestirip teslim almasıdır. Kendi atölyenizde montajı yapmak için parça parça hazır levha tedarik etmenize gerek kalmaz; siz sadece ölçüyü gönderirsiniz, biz birebir keser, kenar bantını çekeriz. Hız, hassasiyet ve tutarlı kalite için doğru adres.",
  process_title: "Nasıl Çalışıyoruz?",
  process_step_1: "Ölçü ve detayları WhatsApp veya e-posta ile gönderin",
  process_step_2: "Aynı gün içinde fiyat teklifini iletelim",
  process_step_3: "Onayınızla beraber üretime alalım (genelde 2-5 iş günü)",
  process_step_4: "Hazır parçaları atölyenize teslim edelim",
  materials_title: "Çalıştığımız Malzemeler",
  materials_text: "Birinci sınıf Yıldız Entegre, Kastamonu Entegre ve Çamsan markalı MDF lam ve melamin levhalar. Akrilik, lake ve özel renk seçenekleri. PVC ve ABS kenar bandı (0.4mm — 2mm).",
  contact_email: "info@esericmimarlikmobilya.com",
  contact_phone: "+90 554 380 51 35",
  contact_whatsapp: "905543805135",
  contact_whatsapp_2: "905069046819",
  contact_address: "Veysel Karani Mahallesi 1135. Sokak No: 15/A Merkez/Afyonkarahisar",
  cta_title: "Hızlı Teklif Almak İçin Bize Ulaşın",
  cta_text: "Ölçü listenizi ve panel tipini WhatsApp'tan iletin, dakikalar içinde fiyat ve termin sürenizi öğrenin."
};

const insertFasonContent = db.prepare('INSERT OR IGNORE INTO fason_content (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(defaultFasonContent)) {
  insertFasonContent.run(key, value);
}

const whatsappCount = db.prepare('SELECT COUNT(*) as c FROM whatsapp_contacts').get().c;
if (whatsappCount === 0) {
  const defaults = [
    { name: 'Satış Hattı', number: '905543805135', order_index: 1 },
    { name: 'Destek Hattı', number: '905069046819', order_index: 2 }
  ];
  const ins = db.prepare('INSERT INTO whatsapp_contacts (name, number, order_index) VALUES (?, ?, ?)');
  for (const w of defaults) ins.run(w.name, w.number, w.order_index);
  console.log(`[db] ${defaults.length} WhatsApp kontağı eklendi (ana site)`);
}

const fasonWhatsappCount = db.prepare('SELECT COUNT(*) as c FROM fason_whatsapp').get().c;
if (fasonWhatsappCount === 0) {
  const defaults = [
    { name: 'Fason Sipariş Hattı', number: '905543805135', order_index: 1 },
    { name: 'Teklif & Bilgi', number: '905069046819', order_index: 2 }
  ];
  const ins = db.prepare('INSERT INTO fason_whatsapp (name, number, order_index) VALUES (?, ?, ?)');
  for (const w of defaults) ins.run(w.name, w.number, w.order_index);
  console.log(`[db] ${defaults.length} WhatsApp kontağı eklendi (fason)`);
}

const fasonServicesCount = db.prepare('SELECT COUNT(*) as c FROM fason_services').get().c;
if (fasonServicesCount === 0) {
  const defaultFasonServices = [
    { title: 'MDF & Sunta Kesim', description: 'Hassas ölçüde milimetrik kesim. Yatay panel testeresi ile düzgün kenar, tutarlı boyut. Her türlü kalınlıkta levha.', icon: 'fas fa-cut', order_index: 1 },
    { title: 'Melamin Kesim', description: 'Yıldız, Kastamonu ve Çamsan markalı melamin levhaların özel ölçü kesimi. Çift yüz kaplamalı seçenekler.', icon: 'fas fa-layer-group', order_index: 2 },
    { title: 'PVC & ABS Kenar Bantlama', description: '0.4mm — 2mm arası PVC ve ABS kenar bandı uygulaması. Düz, yuvarlatılmış veya pahlı kenar seçenekleri.', icon: 'fas fa-grip-lines', order_index: 3 },
    { title: 'CNC İşleme', description: 'CNC freze ile kanal açma, delik delme, oyma ve özel form kesimi. 3D tasarımlarınız için profesyonel işleme.', icon: 'fas fa-microchip', order_index: 4 },
    { title: 'Delik & Kavela', description: 'Otomatik delik makinasıyla menteşe yatakları, kavela delikleri ve raf montaj delikleri. Tutarlı, hızlı.', icon: 'fas fa-circle-dot', order_index: 5 },
    { title: 'Özel Form & Pah', description: 'Tezgah ön yüzleri, dekoratif panel kenarları ve özel formlu parçalar için pah, profil ve fason kesim.', icon: 'fas fa-shapes', order_index: 6 }
  ];
  const insertSvc = db.prepare('INSERT INTO fason_services (title, description, icon, order_index) VALUES (?, ?, ?, ?)');
  for (const s of defaultFasonServices) {
    insertSvc.run(s.title, s.description, s.icon, s.order_index);
  }
  console.log(`[db] ${defaultFasonServices.length} fason hizmeti eklendi`);
}

const fasonFaqCount = db.prepare('SELECT COUNT(*) as c FROM fason_faq').get().c;
if (fasonFaqCount === 0) {
  const defaultFasonFaq = [
    {
      question: 'Minimum sipariş miktarınız var mı?',
      answer: 'Hayır, küçük adetli siparişler de kabul ediyoruz. Tek bir parça için bile teklif verebiliriz; ancak adet arttıkça birim maliyet düşer.',
      order_index: 1
    },
    {
      question: 'Ölçüyü nasıl iletmeliyim?',
      answer: 'En kolay yöntem WhatsApp\'tan ölçü listesi göndermektir. Excel tablosu, el yazısı liste, AutoCAD/SketchUp dosyaları veya basit krokiler kabul ediyoruz. Detay arttıkça hata payı azalır.',
      order_index: 2
    },
    {
      question: 'Teslim süresi ne kadar?',
      answer: 'Standart kesim siparişleri 2-5 iş günü içinde tamamlanır. CNC işleme ve özel form kesim gereken işlerde süre 5-10 iş gününe çıkabilir. Yoğun dönemlerde önceden bilgi veririz.',
      order_index: 3
    },
    {
      question: 'Teslimat hizmetiniz var mı?',
      answer: 'Afyonkarahisar merkez ve ilçeleri için ücretsiz teslimat sağlıyoruz. Şehir dışına kargo veya nakliye firması üzerinden gönderim yapıyoruz; ek nakliye ücreti müşteriye aittir.',
      order_index: 4
    },
    {
      question: 'Hangi markalarla çalışıyorsunuz?',
      answer: 'Birinci sınıf hammadde tedarik ediyoruz: Yıldız Entegre, Kastamonu Entegre, Çamsan, AGT melamin ve MDF lam. Kenar bandında Rehau, Ostermann ve yerli üreticilerin ürünleri.',
      order_index: 5
    },
    {
      question: 'Fiyat teklifi için ne kadar süre bekleyeceğim?',
      answer: 'Standart ölçü listelerini aynı iş günü içinde fiyatlandırıyoruz. Karmaşık CNC veya çok parçalı işlerde teklif 1 iş gününe kadar uzayabilir. Acil işleriniz için telefon ile arayabilirsiniz.',
      order_index: 6
    }
  ];
  const insertFasonFaq = db.prepare('INSERT INTO fason_faq (question, answer, order_index) VALUES (?, ?, ?)');
  for (const f of defaultFasonFaq) {
    insertFasonFaq.run(f.question, f.answer, f.order_index);
  }
  console.log(`[db] ${defaultFasonFaq.length} fason SSS sorusu eklendi`);
}

export default db;
