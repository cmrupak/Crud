export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    async getItem(key) {
      return map.get(key) ?? null;
    },
    async setItem(key, value) {
      map.set(key, value);
    },
    async removeItem(key) {
      map.delete(key);
    },
  };
}

export function createWebStorage(): KeyValueStorage {
  return {
    async getItem(key) {
      return globalThis.localStorage.getItem(key);
    },
    async setItem(key, value) {
      globalThis.localStorage.setItem(key, value);
    },
    async removeItem(key) {
      globalThis.localStorage.removeItem(key);
    },
  };
}
