/**
 * FILE: frontend/src/vite-env.d.ts
 * STATUS: BARU
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_REVERB_APP_KEY?: string;
  readonly VITE_REVERB_HOST?: string;
  readonly VITE_REVERB_PORT?: string;
  readonly VITE_REVERB_SCHEME?: string;
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_FIREBASE_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
