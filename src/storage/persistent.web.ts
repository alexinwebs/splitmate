import type { DocumentStorage } from './adapter';
import { createMemoryStorage } from './memory';

type WebStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
};

const PREFIX = 'splitmate:v1:';

function getLocalStorage(): WebStorage | null {
  try {
    const g = globalThis as unknown as { localStorage?: WebStorage };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Browser: one localStorage entry per collection, holding an id -> document map. */
export function createPersistentStorage(): DocumentStorage {
  const ls = getLocalStorage();
  if (!ls) return createMemoryStorage();

  const read = (collection: string): Record<string, unknown> => {
    try {
      const raw = ls.getItem(PREFIX + collection);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  };
  const write = (collection: string, map: Record<string, unknown>): void => {
    ls.setItem(PREFIX + collection, JSON.stringify(map));
  };

  return {
    async getAll(collection) {
      return Object.values(read(collection));
    },
    async put(collection, id, doc) {
      const map = read(collection);
      map[id] = doc;
      write(collection, map);
    },
    async remove(collection, id) {
      const map = read(collection);
      delete map[id];
      write(collection, map);
    },
    async clearAll() {
      const keys: string[] = [];
      for (let i = 0; i < ls.length; i += 1) {
        const key = ls.key(i);
        if (key && key.startsWith(PREFIX)) keys.push(key);
      }
      keys.forEach((key) => ls.removeItem(key));
    },
  };
}
