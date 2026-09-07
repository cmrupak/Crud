import { createContext, useContext } from 'react';
import type { NexoraBackend } from '@nexora/shared';

export const BackendContext = createContext<NexoraBackend | null>(null);

export function useBackend(): NexoraBackend {
  const value = useContext(BackendContext);
  if (!value) {
    throw new Error('useBackend must be used inside BackendProvider');
  }
  return value;
}
