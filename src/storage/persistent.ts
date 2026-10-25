import * as SQLite from 'expo-sqlite';

import type { DocumentStorage } from './adapter';

/** Android/iOS: one SQLite table of JSON documents, keyed by (collection, id). */
export function createPersistentStorage(): DocumentStorage {
  let opening: Promise<SQLite.SQLiteDatabase> | null = null;

  const open = (): Promise<SQLite.SQLiteDatabase> => {
    if (!opening) {
      opening = (async () => {
        const db = await SQLite.openDatabaseAsync('splitzoa.db');
        await db.execAsync(
          'PRAGMA journal_mode = WAL;' +
            'CREATE TABLE IF NOT EXISTS documents (' +
            'collection TEXT NOT NULL, id TEXT NOT NULL, json TEXT NOT NULL, ' +
            'PRIMARY KEY (collection, id));',
        );
        return db;
      })().catch((error: unknown) => {
        opening = null;
        throw error;
      });
    }
    return opening;
  };

  return {
    async getAll(collection) {
      const db = await open();
      const rows = await db.getAllAsync<{ json: string }>(
        'SELECT json FROM documents WHERE collection = ?',
        [collection],
      );
      const docs: unknown[] = [];
      for (const row of rows) {
        try {
          docs.push(JSON.parse(row.json) as unknown);
        } catch {
          // skip unreadable documents
        }
      }
      return docs;
    },
    async put(collection, id, doc) {
      const db = await open();
      await db.runAsync(
        'INSERT OR REPLACE INTO documents (collection, id, json) VALUES (?, ?, ?)',
        [collection, id, JSON.stringify(doc)],
      );
    },
    async remove(collection, id) {
      const db = await open();
      await db.runAsync('DELETE FROM documents WHERE collection = ? AND id = ?', [collection, id]);
    },
    async clearAll() {
      const db = await open();
      await db.runAsync('DELETE FROM documents');
    },
  };
}
