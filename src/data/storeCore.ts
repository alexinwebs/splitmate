import { formatMoney } from '../domain/money';
import type { ActivityEvent, Expense, Group, Person } from '../domain/models';
import { buildExpense, type ExpenseDraft } from '../services/expenses';
import type { DocumentStorage } from '../storage/adapter';
import { createRepository } from '../storage/repository';

export const ME_ID = 'me';
export const DEFAULT_PROFILE_NAME = 'Abbas';
export const MAX_GROUP_MEMBERS = 10;

export type StoreStatus = 'idle' | 'loading' | 'ready' | 'error';

export type AppState = {
  status: StoreStatus;
  error?: string;
  me: Person;
  people: Person[];
  groups: Group[];
  /** Active (not deleted) expenses, newest first. */
  expenses: Expense[];
  /** Newest first. */
  activity: ActivityEvent[];
};

export type StoreDeps = {
  storage: DocumentStorage;
  now?: () => Date;
  newId?: (prefix: string) => string;
};

function defaultNewId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function sortExpenses(list: readonly Expense[]): Expense[] {
  return [...list].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

function sortActivity(list: readonly ActivityEvent[]): ActivityEvent[] {
  return [...list].sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * The app's data layer: loads everything once, keeps it in memory for the UI,
 * and writes every change to storage before updating the in-memory state.
 * Pure TypeScript (no React) so it can be unit tested.
 */
export function createAppStore(deps: StoreDeps) {
  const repo = createRepository(deps.storage);
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? defaultNewId;
  const timestamp = (): string => now().toISOString();

  const initialState = (): AppState => ({
    status: 'idle',
    me: { id: ME_ID, name: DEFAULT_PROFILE_NAME },
    people: [],
    groups: [],
    expenses: [],
    activity: [],
  });

  let state: AppState = initialState();
  const listeners = new Set<() => void>();
  let loading: Promise<void> | null = null;

  function set(next: Partial<AppState>): void {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  }

  function assertReady(): void {
    if (state.status !== 'ready') throw new Error('The app data is not ready yet.');
  }

  async function load(): Promise<void> {
    set({ status: 'loading', error: undefined });
    try {
      const [people, groups, expenses, activity] = await Promise.all([
        repo.people.list(),
        repo.groups.list(),
        repo.expenses.list(),
        repo.activity.list(),
      ]);
      let me = people.find((p) => p.id === ME_ID);
      if (!me) {
        me = { id: ME_ID, name: DEFAULT_PROFILE_NAME };
        await repo.people.put(me);
        people.push(me);
      }
      const groupIds = new Set(groups.map((g) => g.id));
      const active = expenses.filter((e) => !e.deletedAt && groupIds.has(e.groupId));
      set({
        status: 'ready',
        error: undefined,
        me,
        people,
        groups: [...groups].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        expenses: sortExpenses(active),
        activity: sortActivity(activity.filter((a) => groupIds.has(a.groupId))),
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Could not load your data.',
      });
    }
  }

  function init(): Promise<void> {
    if (!loading) {
      loading = load().finally(() => {
        loading = null;
      });
    }
    return loading;
  }

  async function createGroup(name: string, memberNames: readonly string[]): Promise<Group> {
    assertReady();
    const trimmed = name.trim();
    if (trimmed.length === 0) throw new Error('Group name is required.');
    if (trimmed.length > 40) throw new Error('Keep the group name under 40 characters.');

    const seen = new Set<string>([state.me.name.toLowerCase()]);
    const cleaned: string[] = [];
    for (const raw of memberNames) {
      const person = raw.trim();
      const key = person.toLowerCase();
      if (person.length === 0 || seen.has(key)) continue;
      seen.add(key);
      cleaned.push(person);
    }
    if (cleaned.length === 0) throw new Error('Add at least one other person.');
    if (cleaned.length + 1 > MAX_GROUP_MEMBERS) {
      throw new Error(`A group can have at most ${MAX_GROUP_MEMBERS} members.`);
    }

    const newPeople: Person[] = [];
    const memberIds: string[] = [ME_ID];
    for (const person of cleaned) {
      const existing = state.people.find(
        (p) => p.id !== ME_ID && p.name.toLowerCase() === person.toLowerCase(),
      );
      if (existing) {
        memberIds.push(existing.id);
      } else {
        const created: Person = { id: newId('p'), name: person };
        newPeople.push(created);
        memberIds.push(created.id);
      }
    }

    const at = timestamp();
    const group: Group = { id: newId('g'), name: trimmed, memberIds, adminId: ME_ID, createdAt: at };
    const event: ActivityEvent = {
      id: newId('a'),
      groupId: group.id,
      type: 'group_created',
      summary: `Created group "${trimmed}"`,
      at,
    };

    for (const person of newPeople) await repo.people.put(person);
    await repo.groups.put(group);
    await repo.activity.put(event);
    set({
      people: [...state.people, ...newPeople],
      groups: [group, ...state.groups],
      activity: [event, ...state.activity],
    });
    return group;
  }

  /**
   * Deletes a group and everything in it. Writes happen one record at a time;
   * if the app stops midway, leftover expenses without a group are ignored on the next load.
   */
  async function deleteGroup(id: string): Promise<void> {
    assertReady();
    if (!state.groups.some((g) => g.id === id)) throw new Error('This group no longer exists.');
    const allExpenses = await repo.expenses.list();
    for (const expense of allExpenses) {
      if (expense.groupId === id) await repo.expenses.remove(expense.id);
    }
    const allActivity = await repo.activity.list();
    for (const event of allActivity) {
      if (event.groupId === id) await repo.activity.remove(event.id);
    }
    await repo.groups.remove(id);
    set({
      groups: state.groups.filter((g) => g.id !== id),
      expenses: state.expenses.filter((e) => e.groupId !== id),
      activity: state.activity.filter((a) => a.groupId !== id),
    });
  }

  async function addExpense(draft: ExpenseDraft, source: 'manual' | 'scan' = 'manual'): Promise<Expense> {
    assertReady();
    const group = state.groups.find((g) => g.id === draft.groupId);
    if (!group) throw new Error('Choose a group first.');
    const result = buildExpense(draft, group, { id: newId('e'), now: timestamp(), source });
    if (!result.ok) throw new Error(result.error.message);
    const expense = result.expense;
    const event: ActivityEvent = {
      id: newId('a'),
      groupId: group.id,
      expenseId: expense.id,
      type: 'expense_created',
      summary: `Added "${expense.title}" (${formatMoney(expense.totalPaise)})`,
      at: expense.createdAt,
    };
    await repo.expenses.put(expense);
    await repo.activity.put(event);
    set({
      expenses: sortExpenses([expense, ...state.expenses]),
      activity: [event, ...state.activity],
    });
    return expense;
  }

  async function updateExpense(id: string, draft: ExpenseDraft): Promise<Expense> {
    assertReady();
    const existing = state.expenses.find((e) => e.id === id);
    if (!existing) throw new Error('This expense no longer exists.');
    if (draft.groupId !== existing.groupId) {
      throw new Error('An expense cannot be moved to another group.');
    }
    const group = state.groups.find((g) => g.id === existing.groupId);
    if (!group) throw new Error('This group no longer exists.');
    const result = buildExpense(draft, group, { id, now: timestamp(), existing });
    if (!result.ok) throw new Error(result.error.message);
    const expense = result.expense;
    const event: ActivityEvent = {
      id: newId('a'),
      groupId: group.id,
      expenseId: expense.id,
      type: 'expense_updated',
      summary: `Edited "${expense.title}" (${formatMoney(expense.totalPaise)})`,
      at: expense.updatedAt,
    };
    await repo.expenses.put(expense);
    await repo.activity.put(event);
    set({
      expenses: sortExpenses(state.expenses.map((e) => (e.id === id ? expense : e))),
      activity: [event, ...state.activity],
    });
    return expense;
  }

  async function deleteExpense(id: string): Promise<void> {
    assertReady();
    const existing = state.expenses.find((e) => e.id === id);
    if (!existing) throw new Error('This expense no longer exists.');
    const at = timestamp();
    const deleted: Expense = { ...existing, deletedAt: at, updatedAt: at };
    const event: ActivityEvent = {
      id: newId('a'),
      groupId: existing.groupId,
      expenseId: id,
      type: 'expense_deleted',
      summary: `Deleted "${existing.title}" (${formatMoney(existing.totalPaise)})`,
      at,
    };
    await repo.expenses.put(deleted);
    await repo.activity.put(event);
    set({
      expenses: state.expenses.filter((e) => e.id !== id),
      activity: [event, ...state.activity],
    });
  }

  async function resetAllData(): Promise<void> {
    await repo.clearAll();
    state = initialState();
    await init();
  }

  return {
    getState: (): AppState => state,
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    init,
    createGroup,
    deleteGroup,
    addExpense,
    updateExpense,
    deleteExpense,
    resetAllData,
  };
}

export type AppStore = ReturnType<typeof createAppStore>;
