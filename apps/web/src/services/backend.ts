import {
  createHttpBackend,
  createLocalBackend,
  createWebStorage,
  type NexoraBackend,
} from '@nexora/shared';

let backend: NexoraBackend | null = null;
let pending: Promise<NexoraBackend> | null = null;

export function getDataSource(): 'local' | 'api' {
  const value = import.meta.env.VITE_DATA_SOURCE;
  if (value === 'api' || value === 'turso') return 'api';
  return 'local';
}

export async function getBackend(): Promise<NexoraBackend> {
  if (backend) return backend;
  if (pending) return pending;

  pending = (async () => {
    if (getDataSource() === 'api') {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
      backend = createHttpBackend({
        baseUrl: baseUrl.replace(/\/$/, ''),
        storage: createWebStorage(),
      });
      return backend;
    }

    backend = createLocalBackend(createWebStorage());
    return backend;
  })();

  return pending;
}
