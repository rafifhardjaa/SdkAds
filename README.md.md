# SDK Ads Platform - Open Developer Network

## Overview
SDK Ads Platform adalah infrastruktur monetisasi iklan berbasis CDN yang dirancang untuk ekosistem game HTML5. Platform ini memungkinkan mitra *game developer* (serta penggunaan internal) untuk mengintegrasikan iklan Pre-roll/Interstitial secara mudah sebelum game dimulai, sekaligus mencatat statistik impresi dan klik secara *real-time*.

## Key Objectives
- **Pre-roll Ad Interception:** Menahan pemuatan game saat tombol "Play" diklik untuk memicu tayangan iklan.
- **Lightweight Distribution:** SDK dibungkus menjadi single file JavaScript ringkas (`sdk.min.js`, < 8 KB) dan di-distribusikan via Cloudflare CDN.
- **High-Concurrency Telemetry:** Backend API mampu menampung ping impresi & klik dalam jumlah besar secara cepat dan efisien.
- **Open Developer Ready:** Mendukung arsitektur multi-tenant berbasis API Key / Developer Key.

## Target Tech Stack
- **Frontend SDK:** Pure TypeScript + `tsup` bundler (No external dependencies).
- **Backend API:** Node.js (Hono / Express) + Redis (Cache/Fast Logging) + PostgreSQL.
- **Infrastructure:** Cloudflare CDN (Edge distribution) + Unmanaged VPS.