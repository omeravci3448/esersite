# Eser Mobilya API

Admin panel için backend servisi. Express + SQLite + JWT.

## Çalıştırma (Lokal)

```bash
npm install
npm start
```

API `http://localhost:3000` üzerinde dinler.

## Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `PORT` | `3000` | Sunucu portu |
| `DATA_DIR` | `./data` | SQLite ve uploads dizini |
| `JWT_SECRET` | `change-me-in-production` | JWT imza anahtarı (üretimde mutlaka değiştir) |
| `DEFAULT_ADMIN_USER` | `admin` | İlk admin kullanıcı adı |
| `DEFAULT_ADMIN_PASS` | `esermobilya2026` | İlk admin şifresi |
| `CORS_ORIGINS` | `https://esericmimarlikmobilya.com,...` | Virgülle ayrılmış izinli origin'ler |

## Coolify Deploy

1. Bu repo'yu Coolify'da yeni bir uygulama olarak ekle
2. Build pack: **Dockerfile**
3. Base Directory: `/backend`
4. Persistent Storage: `/app/data` → bir volume bağla (DB ve uploads burada kalacak)
5. Environment variables:
   - `JWT_SECRET` → güçlü random string
   - `DEFAULT_ADMIN_PASS` → ilk şifre (sonra panelden değiştir)
6. Domain: `api.esericmimarlikmobilya.com`
7. Deploy

## Endpoints

### Public

- `GET /health` — Sağlık kontrolü
- `GET /content` — Tüm key-value içerik
- `GET /collection` — Tüm koleksiyon ürünleri
- `GET /faq` — Tüm SSS
- `GET /uploads/:filename` — Yüklenmiş görseli sun

### Auth

- `POST /auth/login` → `{ username, password }` → `{ token, user }`
- `POST /auth/change-password` (auth) → `{ oldPassword, newPassword }`
- `GET /auth/me` (auth) — Mevcut kullanıcı bilgisi

### Yönetim (Bearer token gerekli)

- `PATCH /content/:key` → `{ value }`
- `POST /collection` → `{ title, subtitle, image_url, category, order_index }`
- `PATCH /collection/:id`
- `DELETE /collection/:id`
- `POST /faq` → `{ question, answer, order_index }`
- `PATCH /faq/:id`
- `DELETE /faq/:id`
- `POST /upload` (multipart, field: `image`) → `{ url, filename }`
