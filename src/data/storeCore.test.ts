import { COLLECTIONS } from '../storage/adapter';
import { createMemoryStorage } from '../storage/memory';
import type { ExpenseDraft } from '../services/expenses';
import { createAppStore, DEFAULT_PROFILE_NAME, ME_ID } from './storeCore';

function makeStore(storage = createMemoryStorage()) {
  let counter = 0;
  let tick = 0;
  const store = createAppStore({
    storage,
    newId: (prefix) => `${prefix}${++counter}`,
    now: () => new Date(Date.UTC(2025, 4, 10, 10, 0, tick++)),
  });
  return { store, storage };
}

async function readyStore() {
  const ctx = makeStore();
  await ctx.store.init();
  return ctx;
}

async function groupWithTwoFriends(store: ReturnType<typeof makeStore>['store']) {
  const group = await store.createGroup('Trip', ['Aarav', 'Priya']);
  const [a, b] = group.memberIds.slice(1);
  return { group, a, b };
}

function draftFor(groupId: string, a: string, b: string, overrides: Partial<ExpenseDraft> = {}): ExpenseDraft {
  return {
    groupId,
    title: 'Dinner',
    totalPaise: 30000,
    date: '2025-05-10',
    category: 'food',
    payers: [{ memberId: ME_ID, paidPaise: 30000 }],
    split: { method: 'equal', participantIds: [ME_ID, a, b] },
    ...overrides,
  };
}

describe('init', () => {
  it('creates the local profile on first run', async () => {
    const { store } = await readyStore();
    const state = store.getState();
    expect(state.status).toBe('ready');
    expect(state.me).toEqual({ id: ME_ID, name: DEFAULT_PROFILE_NAME });
    expect(state.groups).toEqual([]);
  });

  it('is safe to call twice at once', async () => {
    const { store } = makeStore();
    await Promise.all([store.init(), store.init()]);
    expect(store.getState().status).toBe('ready');
  });

  it('skips corrupt stored records instead of crashing', async () => {
    const storage = createMemoryStorage();
    storage.putRaw(COLLECTIONS.groups, 'bad', '{"id":"bad"}');
    storage.putRaw(COLLECTIONS.groups, 'worse', 'not json');
    const { store } = makeStore(storage);
    await store.init();
    expect(store.getState().status).toBe('ready');
    expect(store.getState().groups).toEqual([]);
  });

  it('ignores expenses whose group no longer exists', async () => {
    const first = makeStore();
    await first.store.init();
    const { group, a, b } = await groupWithTwoFriends(first.store);
    await first.store.addExpense(draftFor(group.id, a, b));
    // simulate a crash mid-way through deleting a group: remove only the group document
    await first.storage.remove(COLLECTIONS.groups, group.id);
    const second = makeStore(first.storage);
    await second.store.init();
    expect(second.store.getState().expenses).toEqual([]);
  });
});

describe('createGroup', () => {
  it('creates people and a group and persists them', async () => {
    const first = await readyStore();
    const group = await first.store.createGroup('  Weekend Gang ', ['Aarav', 'Priya']);
    expect(group.name).toBe('Weekend Gang');
    expect(group.memberIds).toHaveLength(3);
    expect(group.adminId).toBe(ME_ID);

    const reloaded = makeStore(first.storage);
    await reloaded.store.init();
    expect(reloaded.store.getState().groups.map((g) => g.name)).toEqual(['Weekend Gang']);
    expect(reloaded.store.getState().people.map((p) => p.name).sort()).toEqual(
      ['Aarav', 'Abbas', 'Priya'].sort(),
    );
  });

  it('reuses existing people by name, ignoring case, and ignores the user and duplicates', async () => {
    const { store } = await readyStore();
    await store.createGroup('One', ['Aarav']);
    const second = await store.createGroup('Two', ['aarav', 'AARAV', 'abbas', '  ', 'Priya']);
    expect(second.memberIds).toHaveLength(3);
    expect(store.getState().people.filter((p) => p.name.toLowerCase() === 'aarav')).toHaveLength(1);
  });

  it('validates the name and members', async () => {
    const { store } = await readyStore();
    await expect(store.createGroup('   ', ['A'])).rejects.toThrow('Group name is required.');
    await expect(store.createGroup('X', [])).rejects.toThrow('Add at least one other person.');
    await expect(store.createGroup('X', ['  '])).rejects.toThrow('Add at least one other person.');
    await expect(store.createGroup('x'.repeat(41), ['A'])).rejects.toThrow('under 40');
    const tooMany = Array.from({ length: 10 }, (_, i) => `P${i}`);
    await expect(store.createGroup('Big', tooMany)).rejects.toThrow('at most 10');
    expect(store.getState().groups).toEqual([]);
  });

  it('refuses to run before the store is ready', async () => {
    const { store } = makeStore();
    await expect(store.createGroup('X', ['A'])).rejects.toThrow('not ready');
  });
});

describe('expenses', () => {
  it('adds an expense with engine-computed shares and an activity entry', async () => {
    const { store } = await readyStore();
    const { group, a, b } = await groupWithTwoFriends(store);
    const expense = await store.addExpense(draftFor(group.id, a, b));
    expect(expense.shares.map((s) => s.amountPaise)).toEqual([10000, 10000, 10000]);
    const state = store.getState();
    expect(state.expenses).toHaveLength(1);
    expect(state.activity[0].type).toBe('expense_created');
    expect(state.activity[0].summary).toBe('Added "Dinner" (₹300)');
  });

  it('rejects invalid drafts without saving anything', async () => {
    const { store, storage } = await readyStore();
    const { group, a, b } = await groupWithTwoFriends(store);
    await expect(
      store.addExpense(draftFor(group.id, a, b, { payers: [{ memberId: ME_ID, paidPaise: 100 }] })),
    ).rejects.toThrow('amounts paid must add up');
    await expect(store.addExpense(draftFor('nope', a, b))).rejects.toThrow('Choose a group');
    expect(store.getState().expenses).toEqual([]);
    expect(await storage.getAll(COLLECTIONS.expenses)).toEqual([]);
  });

  it('sorts newest date first', async () => {
    const { store } = await readyStore();
    const { group, a, b } = await groupWithTwoFriends(store);
    await store.addExpense(draftFor(group.id, a, b, { title: 'Old', date: '2025-05-01' }));
    await store.addExpense(draftFor(group.id, a, b, { title: 'New', date: '2025-05-09' }));
    expect(store.getState().expenses.map((e) => e.title)).toEqual(['New', 'Old']);
  });

  it('updates an expense, recomputes shares and keeps createdAt', async () => {
    const { store } = await readyStore();
    const { group, a, b } = await groupWithTwoFriends(store);
    const created = await store.addExpense(draftFor(group.id, a, b));
    const updated = await store.updateExpense(
      created.id,
      draftFor(group.id, a, b, {
        totalPaise: 20000,
        payers: [{ memberId: ME_ID, paidPaise: 20000 }],
        split: { method: 'equal', participantIds: [ME_ID, a] },
      }),
    );
    expect(updated.id).toBe(created.id);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.updatedAt > created.updatedAt).toBe(true);
    expect(updated.shares.map((s) => s.amountPaise)).toEqual([10000, 10000]);
    expect(store.getState().expenses).toHaveLength(1);
    expect(store.getState().activity[0].type).toBe('expense_updated');
  });

  it('refuses to move an expense to another group or edit a missing one', async () => {
    const { store } = await readyStore();
    const { group, a, b } = await groupWithTwoFriends(store);
    const other = await store.createGroup('Other', ['Zed']);
    const created = await store.addExpense(draftFor(group.id, a, b));
    await expect(store.updateExpense(created.id, draftFor(other.id, a, b))).rejects.toThrow(
      'another group',
    );
    await expect(store.updateExpense('missing', draftFor(group.id, a, b))).rejects.toThrow(
      'no longer exists',
    );
  });

  it('soft-deletes: hidden from the app but kept in storage for the audit trail', async () => {
    const first = await readyStore();
    const { group, a, b } = await groupWithTwoFriends(first.store);
    const created = await first.store.addExpense(draftFor(group.id, a, b));
    await first.store.deleteExpense(created.id);

    expect(first.store.getState().expenses).toEqual([]);
    expect(first.store.getState().activity[0].type).toBe('expense_deleted');
    const stored = await first.storage.getAll(COLLECTIONS.expenses);
    expect(stored).toHaveLength(1);
    expect((stored[0] as { deletedAt?: string }).deletedAt).toBeDefined();

    const reloaded = makeStore(first.storage);
    await reloaded.store.init();
    expect(reloaded.store.getState().expenses).toEqual([]);
    await expect(first.store.deleteExpense(created.id)).rejects.toThrow('no longer exists');
  });
});

describe('deleteGroup and resetAllData', () => {
  it('deletes a group with its expenses and activity, leaving other groups alone', async () => {
    const { store, storage } = await readyStore();
    const { group, a, b } = await groupWithTwoFriends(store);
    const other = await store.createGroup('Other', ['Zed']);
    await store.addExpense(draftFor(group.id, a, b));
    await store.addExpense(draftFor(group.id, a, b, { title: 'Second' }));
    await store.deleteGroup(group.id);

    const state = store.getState();
    expect(state.groups.map((g) => g.id)).toEqual([other.id]);
    expect(state.expenses).toEqual([]);
    expect(state.activity.every((e) => e.groupId === other.id)).toBe(true);
    expect(await storage.getAll(COLLECTIONS.expenses)).toEqual([]);
    await expect(store.deleteGroup(group.id)).rejects.toThrow('no longer exists');
  });

  it('erases everything and recreates the profile', async () => {
    const { store, storage } = await readyStore();
    await groupWithTwoFriends(store);
    await store.resetAllData();
    const state = store.getState();
    expect(state.status).toBe('ready');
    expect(state.groups).toEqual([]);
    expect(state.people).toEqual([{ id: ME_ID, name: DEFAULT_PROFILE_NAME }]);
    expect(await storage.getAll(COLLECTIONS.groups)).toEqual([]);
  });
});

describe('subscriptions', () => {
  it('notifies listeners on change and stops after unsubscribe', async () => {
    const { store } = await readyStore();
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    await store.createGroup('Trip', ['A']);
    expect(calls).toBeGreaterThan(0);
    const before = calls;
    unsubscribe();
    await store.createGroup('Trip 2', ['B']);
    expect(calls).toBe(before);
  });
});
