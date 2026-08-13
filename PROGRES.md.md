# Project Progress Log

## Log History

### Initial Phase
- [x] Diskusi konsep dasar SDK monetisasi web game dan strategi B2B Open Developer Network.
- [x] Penentuan stack & environment (Linux Mint, OpenCode CLI, Gemini 3.6 Flash API).
- [x] Penyiapan Vault Obsidian `SdkAds` sebagai *Project Knowledge Management*.
- [x] Inisialisasi folder proyek TypeScript untuk Frontend SDK Client.
- [x] Implementasi event listener tombol "Play" & Overlay Interstitial Ad.
- [x] Integrasi build pipeline menggunakan `tsup`.

### Backend API Phase
- [x] Setup package `@sdk-ads/backend` dengan Express + CORS di `packages/backend`.
- [x] Endpoint `GET /api/config` untuk menyajikan konfigurasi iklan per `gameId`.
- [x] Endpoint `POST /api/telemetry` untuk menerima event impresi/klik.
- [x] Endpoint `GET /health` health check.
- [x] Verifikasi server berjalan & response endpoint benar (build via tsup, CJS 2.46 KB).

### SDK-Backend Integration Phase
- [x] `init()` kini async: fetch konfigurasi dari `GET /api/config?gameId=...` (fallback ke default jika gagal).
- [x] Opsi baru `apiBaseUrl` di `SDKConfig` (default `http://localhost:3000`).
- [x] `showPreRoll()` mengirim telemetry `IMPRESSION` saat iklan tampil & `CLICK` saat tombol skip/start diklik.
- [x] Header `Authorization: Bearer <developerKey>` otomatis dikirim jika `developerKey` di-set.
- [x] Verifikasi unit (mock fetch/DOM) & E2E terhadap backend live — config terambil, telemetry diterima server.
- [x] Bundle SDK tetap ringan: `sdk.min.js` = 7.23 KB (< 8 KB).

### Next Tasks
- [ ] Deploy pipeline ke Cloudflare CDN & VPS, plus Redis untuk high-concurrency logging.

### Persistent DB & Dashboard Phase
- [x] Instal `better-sqlite3` (native, prebuilt) + `@types/better-sqlite3` di `packages/backend`.
- [x] Migrasi `telemetry.ts`: dari in-memory ke SQLite (file `data/telemetry.db`, WAL mode, tabel `telemetry_events` + index developer/game).
- [x] `recordEvent` → `INSERT`, `getStats` → agregasi SQL `GROUP BY game_id, type` (tetap return `StatsSummary` yang sama).
- [x] `placementId` di-default ke `'pre-roll'` pada endpoint bila body tidak menyertakannya.
- [x] Dashboard GUI `packages/backend/public/dashboard.html` — served di `GET /dashboard`, fetch `/api/stats` dengan Bearer key, auto-refresh 5s, kartu total (impressions/clicks/CTR), tabel & grafik batang per game.
- [x] Build script tsup ditambah `--publicDir public` agar `dashboard.html` ikut ke `dist/`.
- [x] Verifikasi persistence: kirim 4 IMPRESSION + 2 CLICK → stats tampil sebelum restart, data tetap ada setelah restart server.
- [x] `.gitignore` ditambah `data/` (runtime DB).
- [x] Build backend CJS 6.62 KB.

### Telemetry Persistence & Stats Phase
- [x] `packages/backend/src/telemetry.ts`: in-memory store terstruktur untuk event telemetri (`recordEvent`, `getStats`).
- [x] `POST /api/telemetry` kini merekam event IMPRESSION & CLICK ke store (bukan hanya log).
- [x] Endpoint `GET /api/stats` (terproteksi) mengembalikan ringkasan: `totalImpressions`, `totalClicks`, `ctr`, breakdown per game.
- [x] Dukungan filter `?gameId=...` di `/api/stats` dengan validasi kepemilikan game.
- [x] Verifikasi E2E: 3 IMPRESSION + 1 CLICK → stats total 3/1, CTR 0.333; auth 401 tanpa key; game asing 404.
- [x] Build backend CJS 4.99 KB.

### Multi-Tenant Auth Phase
- [x] `packages/backend/src/store.ts`: store developer & game in-memory (multi-tenant), lookup by `apiKey`.
- [x] `packages/backend/src/middleware.ts`: middleware `authenticateDeveloper` membaca `Authorization: Bearer` → 401 jika kosong/invalid.
- [x] `GET /api/config` & `POST /api/telemetry` kini terproteksi (tanpa `/health`).
- [x] Validasi kepemilikan game per developer: game asing → 404 (config) / 403 (telemetry).
- [x] Event telemetri ditandai `developerId` sesuai developer yang terautentikasi.
- [x] Verifikasi 7 skenario auth (no key, invalid key, valid+own, valid+foreign, telemetry no-key) — semua response benar.
- [x] Build backend CJS 3.53 KB.