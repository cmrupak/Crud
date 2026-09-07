import { useEffect, useState, type ReactNode } from 'react';
import type { NexoraBackend } from '@nexora/shared';
import { BackendContext } from './backend-context.ts';
import { getBackend } from '../services/backend.ts';

export function BackendProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<NexoraBackend | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getBackend()
      .then((value) => {
        if (active) setBackend(value);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to start CRUD.');
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
      </div>
    );
  }

  if (!backend) {
    return (
      <div className="loading-state">
        <p>Starting CRUD…</p>
      </div>
    );
  }

  return <BackendContext.Provider value={backend}>{children}</BackendContext.Provider>;
}
