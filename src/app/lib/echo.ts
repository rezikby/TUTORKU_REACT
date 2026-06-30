/**
 * FILE: frontend/src/app/lib/echo.ts
 *
 * PERBAIKAN:
 * - wssPort sebelumnya sama dengan wsPort (8080), seharusnya mengikuti
 *   VITE_REVERB_PORT yang di production di-set ke 443.
 * - Tambahkan fallback eksplisit: jika scheme=https, gunakan port 443;
 *   jika http, gunakan port 8080. Ini mencegah WebSocket gagal di production
 *   karena mencoba konek ke wss://domain:8080 yang tidak ada.
 */

import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Laravel Echo butuh Pusher terdaftar secara global walau yang dipakai
// sebenarnya adalah Laravel Reverb (protokol Pusher-compatible).
// @ts-ignore
window.Pusher = Pusher;

let echoInstance: Echo | null = null;
let echoToken: string | null = null;

const API_ROOT = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "https://rezi-laravel.nlabs.id";

// ── FIX: Baca scheme dulu, lalu tentukan port default yang benar ──────────────
const REVERB_SCHEME = (import.meta as any).env?.VITE_REVERB_SCHEME ?? "https";
const REVERB_HOST   = (import.meta as any).env?.VITE_REVERB_HOST ?? "rezi-laravel.nlabs.id";
// Jika port di env tidak di-set, gunakan default sesuai scheme
const REVERB_PORT   = Number(
  (import.meta as any).env?.VITE_REVERB_PORT ?? (REVERB_SCHEME === "https" ? 443 : 8080)
);
const FORCE_TLS     = REVERB_SCHEME === "https";

/**
 * Inisialisasi (atau ambil instance Echo yang sudah ada) untuk koneksi WebSocket
 * ke Laravel Reverb. Dipanggil setelah user login (butuh token Sanctum untuk
 * autentikasi private channel seperti chat.{conversationId} dan user.{userId}).
 */
export function getEcho(token: string | null): Echo {
  if (echoInstance && echoToken !== token) {
    echoInstance.disconnect();
    echoInstance = null;
  }

  if (echoInstance) {
    return echoInstance;
  }

  echoToken = token;
  echoInstance = new Echo({
    broadcaster: "reverb",
    key: (import.meta as any).env?.VITE_REVERB_APP_KEY ?? "TUTORKU-key",
    wsHost:  REVERB_HOST,
    wsPort:  REVERB_PORT,
    wssPort: REVERB_PORT,   // ← FIX: sebelumnya selalu 8080, sekarang ikut env
    forceTLS: FORCE_TLS,    // ← FIX: true jika https, false jika http
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${API_ROOT}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        Accept: "application/json",
      },
    },
  });

  return echoInstance;
}

/** Putuskan koneksi WebSocket — dipanggil saat logout supaya tidak ada koneksi nyangkut. */
export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    echoToken = null;
  }
}