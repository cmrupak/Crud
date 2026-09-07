import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  createHttpBackend,
  createLocalBackend,
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
  if (fromExtra) return fromExtra.replace(/\/$/, '');

  // Android emulator loopback to host machine
  if (Platform.OS === 'android') return 'http://10.0.2.2:8787';
  return 'http://localhost:8787';
}

let backend: NexoraBackend | null = null;

export function getApiUrl(): string {
  return resolveApiUrl();
}

export function getBackend(): NexoraBackend {
  if (backend) return backend;

  const dataSource = (Constants.expoConfig?.extra?.dataSource as string) || 'api';
  if (dataSource === 'local') {
    backend = createLocalBackend(storage);
    return backend;
  }

  backend = createHttpBackend({
    baseUrl: resolveApiUrl(),
    storage,
  });
  return backend;
}
