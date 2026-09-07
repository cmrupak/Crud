import {
  createHttpBackend,
  // Local browser backend — paused while shipping live API builds
  // createLocalBackend,
  createWebStorage,
  type NexoraBackend,
} from '@nexora/shared';

let backend: NexoraBackend | null = null;
let pending: Promise<NexoraBackend> | null = null;

/** Live builds always use the HTTP API. */
export function getDataSource(): 'local' | 'api' {
  // Local development (commented for live):
  // const value = import.meta.env.VITE_DATA_SOURCE;
  // if (value === 'api' || value === 'turso') return 'api';
  // return 'local';
  return 'api';
}

export async function getBackend(): Promise<NexoraBackend> {
  if (backend) return backend;
  if (pending) return pending;

  pending = (async () => {
    const baseUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
    if (!baseUrl) {
      throw new Error(
        'VITE_API_URL is not set. Point it at your live API (e.g. https://api.yourdomain.com).',
      );
    }
    backend = createHttpBackend({
      baseUrl,
      storage: createWebStorage(),
    });
    return backend;

    // Local development (commented for live):
    // backend = createLocalBackend(createWebStorage());
    // return backend;
  })();

  return pending;
}
