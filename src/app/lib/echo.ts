/**
 * FILE: frontend/src/app/lib/echo.ts
 * STATUS: BARU
 */

import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Laravel Echo butuh Pusher terdaftar secara global walau yang dipakai
// sebenarnya adalah Laravel Reverb (protokol Pusher-compatible).
// @ts-ignore
window.Pusher = Pusher;

let echoInstance: Echo | null = null;
let echoToken: string | null = null;

const API_ROOT = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "http://localhost:8000";

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
    wsHost: (import.meta as any).env?.VITE_REVERB_HOST ?? "localhost",
    wsPort: Number((import.meta as any).env?.VITE_REVERB_PORT ?? 8080),
    wssPort: Number((import.meta as any).env?.VITE_REVERB_PORT ?? 8080),
    forceTLS: ((import.meta as any).env?.VITE_REVERB_SCHEME ?? "http") === "https",
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
