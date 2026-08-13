# SDK Ads — Panduan Integrasi untuk Game Developer

Panduan ringkas untuk memasang **SDK Ads** (Pre-roll / Interstitial) ke game HTML5 kamu. Setelah mengikuti langkah-langkah berikut, game akan menampilkan iklan sebelum dimulai dan otomatis mengirim telemetry (impresi & klik) ke backend.

---

## 1. Dapatkan API Key

Sebelum integrasi, hubungi tim platform untuk mendapatkan:

- **`gameId`** — identifikasi unik game kamu.
- **`developerKey`** — API key (Bearer token) untuk autentikasi telemetry & config.

> ⚠️ **Jangan pernah** menaruh `developerKey` di kode server, git public, atau repository yang tidak kamu kendalikan. Key ini dikirim via header `Authorization`, jadi pastikan backend kamu hanya dilayani via HTTPS di produksi.

---

## 2. Pasang SDK via CDN

Tambahkan satu baris `<script>` di halaman HTML game kamu. SDK didistribusikan sebagai file tunggal `sdk.min.js` (< 8 KB, tanpa dependensi eksternal).

```html
<script src="https://cdn.sdk-ads.example.com/sdk.min.js"></script>
```

> Ganti `cdn.sdk-ads.example.com` dengan domain CDN yang diberikan tim platform (Cloudflare CDN).

### Load lokal (untuk development)

```html
<script src="/path/to/sdk.min.js"></script>
```

---

## 3. Inisialisasi SDK

Panggil `GendisSDK.init()` **sekali** saat halaman dimuat. Fungsi ini mengambil konfigurasi iklan dari backend (`GET /api/config`) dan menyiapkan overlay ad.

```js
await window.GendisSDK.init({
  gameId: 'your-game-id',      // wajib
  developerKey: 'your-dev-key', // wajib untuk autentikasi
  apiBaseUrl: 'https://api.sdk-ads.example.com', // wajib di produksi
  debug: true,                  // opsional: aktifkan log konsol
});
```

| Opsi           | Tipe    | Wajib | Default              | Deskripsi                                |
| -------------- | ------- | ----- | -------------------- | ---------------------------------------- |
| `gameId`       | string  | ✅    | —                    | ID game yang didaftarkan di platform.    |
| `developerKey` | string  | ✅    | —                    | Bearer key untuk autentikasi ke backend. |
| `apiBaseUrl`   | string  | ✅    | `http://localhost:3000` | Base URL backend API.                    |
| `debug`        | boolean | ❌    | `false`              | Log detail ke console.                   |
| `adDuration`   | number  | ❌    | `5`                  | Durasi fallback iklan (detik).           |

Jika server config gagal diambil (misal backend offline), SDK **tetap berfungsi** dengan nilai fallback default — tidak mengganggu pengalaman bermain.

---

## 4. Tampilkan Iklan Saat Game Dimulai

Ada dua cara memicu iklan Pre-roll:

### Cara A — `showPreRoll(onComplete)`

Panggil langsung saat tombol "Play" diklik. Game **baru dimulai** di callback `onComplete`.

```js
playButton.addEventListener('click', () => {
  window.GendisSDK.showPreRoll(() => {
    // Iklan selesai / di-skip — mulai game sekarang
    startGame();
  });
});
```

### Cara B — `bindPlayButton(selector, onComplete)`

SDK menangani sendiri binding ke tombol Play:

```js
window.GendisSDK.bindPlayButton('#playBtn', () => {
  startGame();
});
```

> Keduanya mengirim event `IMPRESSION` saat iklan tampil dan `CLICK` saat tombol *Skip/Start* ditekan.

---

## 5. Contoh Lengkap

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Game</title>
  <script src="https://cdn.sdk-ads.example.com/sdk.min.js"></script>
</head>
<body>
  <button id="playBtn">Play</button>
  <canvas id="game"></canvas>

  <script>
    // 1. Inisialisasi SDK
    window.GendisSDK.init({
      gameId: 'your-game-id',
      developerKey: 'your-dev-key',
      apiBaseUrl: 'https://api.sdk-ads.example.com',
    });

    // 2. Intercept tombol Play dengan iklan
    window.GendisSDK.bindPlayButton('#playBtn', () => {
      startGameLoop();
    });

    function startGameLoop() {
      // Logika game di sini
    }
  </script>
</body>
</html>
```

---

## 6. Referensi Endpoint API

| Metode | Endpoint               | Deskripsi                                |
| ------ | ---------------------- | ---------------------------------------- |
| GET    | `/api/config?gameId=`  | Konfigurasi iklan untuk game tertentu.   |
| POST   | `/api/telemetry`       | Kirim event telemetry (IMPRESSION/CLICK).|
| GET    | `/api/stats`           | Ringkasan stats (dashboard, dilindungi). |
| GET    | `/health`              | Health check server.                     |

Semua endpoint (kecuali `/health`) mengharuskan header:

```
Authorization: Bearer <developerKey>
```

---

## 7. FAQ

**Game saya tidak menampilkan iklan — kenapa?**
Periksa: (1) `gameId` & `developerKey` benar, (2) `apiBaseUrl` bisa diakses dari browser, (3) backend server berjalan, (4) tidak ada error di console.

**Apakah SDK bisa rusak jika backend mati?**
Tidak. `init()` menangkap kegagalan fetch dan memakai konfigurasi fallback, sehingga game tetap jalan.

**Berapa besar pengaruh SDK ke performa game?**
Minimal. Bundle < 8 KB tanpa dependensi, semua CSS di-inject otomatis, dan tidak ada library UI eksternal.