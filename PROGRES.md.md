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
- [ ] Penambahan dukungan multi-tenant developer key (auth header) penuh di backend (validasi per key).