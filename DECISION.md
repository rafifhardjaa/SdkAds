# Architecture Decision Records (ADR)

## ADR 001: Zero External Dependencies for Client SDK
- **Status:** Approved
- **Decision:** Frontend SDK wajib ditulis menggunakan Pure TypeScript tanpa *library* luar (tanpa React, Vue, jQuery, dsb).
- **Reason:** Menjaga ukuran file bundle SDK se-ringkas mungkin (< 8 KB) agar tidak memberatkan *loading time* game dan menghindari potensi kebocoran memori pada *canvas/game engine*.

## ADR 002: Infrastructure & CDN Architecture
- **Status:** Approved
- **Decision:** Distribusi `sdk.min.js` menggunakan Cloudflare CDN, sedangkan Backend API berjalan di VPS (bukan cPanel/Shared Hosting).
- **Reason:** Backend harus menangani koneksi *asynchronous* tingkat tinggi (*high concurrency*) untuk pengiriman sinyal impresi/klik, yang tidak bisa ditampung secara optimal oleh *shared hosting*.

## ADR 003: Memory Stack for AI-Assisted Development
- **Status:** Approved
- **Decision:** Menggunakan pola 4 file Markdown (`README`, `STATUS`, `PROGRESS`, `DECISION`) di Obsidian Vault sebagai konteks utama AI.
- **Reason:** Mencegah *context loss* saat melakukan *vibe coding* dengan LLM/OpenCode dalam rentang waktu yang panjang.