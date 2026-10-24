import type { DocumentStorage } from './adapter';

/** In-memory storage for tests. Values are serialised to JSON like the real stores. */
export function createMemoryStorage(): DocumentStorage & {
  /** Test helper: write a raw JSON string, bypassing validation. */
  putRaw(collection: string, id: string, json: string): void;
} {
  const data = new Map<string, Map<string, string>>();
  const bucket = (collection: string): Map<string, string> => {
    let b = data.get(collection);
    if (!b) {
      b = new Map();
      data.set(collection, b);
    }
    return b;
  };
  return {
    async getAll(collection) {
      const out: unknown[] = [];
      for (const json of bucket(collection).values()) {
        try {
          out.push(JSON.parse(json) as unknown);
        } catch {
          // skip unreadable documents
        }
      }
      return out;
    },
    async put(collection, id, doc) {
      bucket(collection).set(id, JSON.stringify(doc));
    },
    async remove(collection, id) {
      bucket(collection).delete(id);
    },
    async clearAll() {
      data.clear();
    },
    putRaw(collection, id, json) {
      bucket(collection).set(id, json);
    },
  };
}
