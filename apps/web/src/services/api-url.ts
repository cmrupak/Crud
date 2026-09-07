export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  // Local development (paused)
  // return 'http://localhost:8787';
  throw new Error('VITE_API_URL is not set for this build.');
}

/** Static avatar files are served from the web origin (not under /api). */
export function getAssetBaseUrl(): string {
  const api = getApiBaseUrl();
  return api.replace(/\/api$/i, '') || api;
}
