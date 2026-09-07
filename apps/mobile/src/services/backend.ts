import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  createHttpBackend,
  // Local device backend — paused while shipping live API builds
  // createLocalBackend,
  type KeyValueStorage,
  type NexoraBackend,
} from '@nexora/shared';

const storage: KeyValueStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromExtra?.trim()) return fromExtra.trim().replace(/\/$/, '');

  // Local development (commented for live):
  // if (Platform.OS === 'android') return 'http://10.0.2.2:8787';
  // return 'http://localhost:8787';

  throw new Error(
    'EXPO_PUBLIC_API_URL is not set. Point it at your live API (e.g. https://api.yourdomain.com).',
  );
}

let backend: NexoraBackend | null = null;

export function getApiUrl(): string {
  return resolveApiUrl();
}

/** Static avatars are on the web origin, not under /api. */
export function getAssetUrl(): string {
  return resolveApiUrl().replace(/\/api$/i, '');
}

export function getBackend(): NexoraBackend {
  if (backend) return backend;

  // Live builds always use the HTTP API.
  // Local development (commented for live):
  // const dataSource = (Constants.expoConfig?.extra?.dataSource as string) || 'api';
  // if (dataSource === 'local') {
  //   backend = createLocalBackend(storage);
  //   return backend;
  // }

  backend = createHttpBackend({
    baseUrl: resolveApiUrl(),
    storage,
  });
  return backend;
}
