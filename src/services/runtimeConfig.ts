/**
 * Runtime configuration helpers (single source of truth)
 *
 * - `VITE_API_URL` is the backend origin (e.g. http://localhost:3000)
 * - All REST calls target the versioned API under `/api/v2`
 * - WS URL defaults to `/api/v2/market/stream` and is derived from API origin
 */

const DEFAULT_API_ORIGIN = 'http://localhost:3000';

export const API_ORIGIN = (import.meta.env.VITE_API_URL || DEFAULT_API_ORIGIN).replace(/\/$/, '');
export const API_BASE = `${API_ORIGIN}/api/v2`;

export const WS_URL = (() => {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicit) return explicit;

  const wsScheme = API_ORIGIN.startsWith('https://') ? 'wss://' : 'ws://';
  const host = API_ORIGIN.replace(/^https?:\/\//, '');
  return `${wsScheme}${host}/api/v2/market/stream`;
})();
