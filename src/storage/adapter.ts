/**
 * Minimal document store used by the app. Each record is a JSON document
 * identified by (collection, id). Two implementations exist:
 *  - persistent.ts      (Android/iOS) SQLite via expo-sqlite
 *  - persistent.web.ts  (browser) localStorage
 * plus memory.ts for tests.
 */
export interface DocumentStorage {
  getAll(collection: string): Promise<unknown[]>;
  put(collection: string, id: string, doc: unknown): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export const COLLECTIONS = {
  people: 'people',
  groups: 'groups',
  expenses: 'expenses',
  activity: 'activity',
} as const;
