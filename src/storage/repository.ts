import type { z } from 'zod';

import {
  ActivitySchema,
  ExpenseSchema,
  GroupSchema,
  PersonSchema,
  type ActivityEvent,
  type Expense,
  type Group,
  type Person,
} from '../domain/models';
import { COLLECTIONS, type DocumentStorage } from './adapter';

export type Collection<T extends { id: string }> = {
  /** Returns every valid record. Records that fail validation are skipped, never repaired. */
  list(): Promise<T[]>;
  put(item: T): Promise<void>;
  remove(id: string): Promise<void>;
};

function parseWith<S extends z.ZodType>(schema: S, doc: unknown): z.output<S> | null {
  const result = schema.safeParse(doc);
  return result.success ? result.data : null;
}

function createCollection<T extends { id: string }>(
  storage: DocumentStorage,
  name: string,
  parse: (doc: unknown) => T | null,
): Collection<T> {
  return {
    async list() {
      const raw = await storage.getAll(name);
      const items: T[] = [];
      for (const doc of raw) {
        const parsed = parse(doc);
        if (parsed) items.push(parsed);
      }
      return items;
    },
    async put(item) {
      const checked = parse(item);
      if (!checked) throw new Error(`Refusing to save an invalid ${name} record.`);
      await storage.put(name, checked.id, checked);
    },
    async remove(id) {
      await storage.remove(name, id);
    },
  };
}

export function createRepository(storage: DocumentStorage) {
  return {
    people: createCollection<Person>(storage, COLLECTIONS.people, (d) => parseWith(PersonSchema, d)),
    groups: createCollection<Group>(storage, COLLECTIONS.groups, (d) => parseWith(GroupSchema, d)),
    expenses: createCollection<Expense>(storage, COLLECTIONS.expenses, (d) =>
      parseWith(ExpenseSchema, d),
    ),
    activity: createCollection<ActivityEvent>(storage, COLLECTIONS.activity, (d) =>
      parseWith(ActivitySchema, d),
    ),
    clearAll: () => storage.clearAll(),
  };
}

export type Repository = ReturnType<typeof createRepository>;
