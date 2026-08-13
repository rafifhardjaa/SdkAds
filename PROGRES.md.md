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
- [ ] Setup basis data telemetry (Redis/PostgreSQL) & dashboard stats real-time.

### Multi-Tenant Auth Phase
- [x] `packages/backend/src/store.ts`: store developer & game in-memory (multi-tenant), lookup by `apiKey`.
- [x] `packages/backend/src/middleware.ts`: middleware `authenticateDeveloper` membaca `Authorization: Bearer` → 401 jika kosong/invalid.
- [x] `GET /api/config` & `POST /api/telemetry` kini terproteksi (tanpa `/health`).
- [x] Validasi kepemilikan game per developer: game asing → 404 (config) / 403 (telemetry).
- [x] Event telemetri ditandai `developerId` sesuai developer yang terautentikasi.
- [x] Verifikasi 7 skenario auth (no key, invalid key, valid+own, valid+foreign, telemetry no-key) — semua response benar.
- [x] Build backend CJS 3.53 KB.