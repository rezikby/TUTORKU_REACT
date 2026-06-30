/**
 * FILE: frontend/src/app/lib/echo.ts
 * 
 * PERBAIKAN TERBARU:
 * - Tambahkan error handling untuk koneksi WebSocket
 * - Tambahkan logging untuk debugging
 * - Tambahkan fungsi isEchoConnected() dan reconnectEcho()
 */

import Echo from "laravel-echo";
import Pusher from "pusher-js";

(window as any).Pusher = Pusher;

let echoInstance: Echo | null = null;
let echoToken: string | null = null;

const API_ROOT = (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "https://rezi-laravel.nlabs.id";

const REVERB_SCHEME = (import.meta as any).env?.VITE_REVERB_SCHEME ?? "https";
const REVERB_HOST   = (import.meta as any).env?.VITE_REVERB_HOST ?? "rezi-laravel.nlabs.id";
const REVERB_PORT   = Number(
  (import.meta as any).env?.VITE_REVERB_PORT ?? (REVERB_SCHEME === "https" ? 443 : 8080)
);
const FORCE_TLS     = REVERB_SCHEME === "https";

console.debug('[Echo] Configuration:', {
  broadcaster: 'reverb',
  key: (import.meta as any).env?.VITE_REVERB_APP_KEY ?? "TUTORKU-key",
  wsHost: REVERB_HOST,
  wsPort: REVERB_PORT,
  wssPort: REVERB_PORT,
  forceTLS: FORCE_TLS,
  authEndpoint: `${API_ROOT}/api/broadcasting/auth`,
});

export function getEcho(token: string | null): Echo {
  if (echoInstance && echoToken !== token) {
    console.debug('[Echo] Token changed, reconnecting...');
    try {
      echoInstance.disconnect();
    } catch (e) {
      console.warn('[Echo] Error disconnecting:', e);
    }
    echoInstance = null;
    echoToken = null;
  }

  if (echoInstance) {
    return echoInstance;
  }

  if (!token) {
    console.warn('[Echo] No token provided, WebSocket authentication may fail');
  }

  echoToken = token;
  
  try {
    echoInstance = new Echo({
      broadcaster: "reverb",
      key: (import.meta as any).env?.VITE_REVERB_APP_KEY ?? "TUTORKU-key",
      wsHost: REVERB_HOST,
      wsPort: REVERB_PORT,
      wssPort: REVERB_PORT,
      forceTLS: FORCE_TLS,
      enabledTransports: ["ws", "wss"],
      authEndpoint: `${API_ROOT}/api/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    });

    const connection = (echoInstance as any).connector?.connection;
    if (connection) {
      connection.on('connecting', () => {
        console.debug('[Echo] Connecting to WebSocket...');
      });
      
      connection.on('connected', () => {
        console.debug('[Echo] WebSocket connected successfully');
      });
      
      connection.on('disconnect', (reason: any) => {
        console.warn('[Echo] WebSocket disconnected:', reason);
      });
      
      connection.on('error', (error: any) => {
        console.error('[Echo] WebSocket error:', error);
      });
    }

    console.debug('[Echo] Instance created successfully');
  } catch (error) {
    console.error('[Echo] Failed to create Echo instance:', error);
    echoInstance = null;
    echoToken = null;
    throw error;
  }

  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    console.debug('[Echo] Disconnecting WebSocket...');
    try {
      echoInstance.disconnect();
    } catch (e) {
      console.warn('[Echo] Error during disconnect:', e);
    }
    echoInstance = null;
    echoToken = null;
    console.debug('[Echo] Disconnected');
  }
}

export function isEchoConnected(): boolean {
  if (!echoInstance) return false;
  try {
    const connection = (echoInstance as any).connector?.connection;
    return connection?.state === 'connected';
  } catch (e) {
    return false;
  }
}

export function reconnectEcho(token: string | null): Echo {
  console.debug('[Echo] Manual reconnect requested');
  disconnectEcho();
  return getEcho(token);
}