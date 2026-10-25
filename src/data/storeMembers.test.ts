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

async function ready() {
  const ctx = makeStore();
  await ctx.store.init();
  return ctx;
}

function draft(groupId: string, memberIds: string[], overrides: Partial<ExpenseDraft> = {}): ExpenseDraft {
  return {
    groupId,
    title: 'Dinner',
    totalPaise: 30000,
    date: '2025-05-10',
    category: 'food',
    payers: [{ memberId: ME_ID, paidPaise: 30000 }],
    split: { method: 'equal', participantIds: memberIds },
    ...overrides,
  };
}

describe('renameGroup', () => {
  it('renames, persists and logs the change', async () => {
    const first = await ready();
    const group = await first.store.createGroup('Trip', ['Aarav']);
    const updated = await first.store.renameGroup(group.id, '  Goa Trip ');
    expect(updated.name).toBe('Goa Trip');
    expect(first.store.getState().activity[0].type).toBe('group_renamed');
    expect(first.store.getState().activity[0].summary).toBe('Renamed "Trip" to "Goa Trip"');

    const reloaded = makeStore(first.storage);
    await reloaded.store.init();
    expect(reloaded.store.getState().groups[0].name).toBe('Goa Trip');
  });

  it('does nothing when the name is unchanged', async () => {
    const { store } = await ready();
    const group = await store.createGroup('Trip', ['Aarav']);
    const before = store.getState().activity.length;
    await store.renameGroup(group.id, 'Trip');
    expect(store.getState().activity).toHaveLength(before);
  });

  it('validates the name and the group', async () => {
    const { store } = await ready();
    const group = await store.createGroup('Trip', ['Aarav']);
    await expect(store.renameGroup(group.id, '   ')).rejects.toThrow('required');
    await expect(store.renameGroup(group.id, 'x'.repeat(41))).rejects.toThrow('under 40');
    await expect(store.renameGroup('missing', 'New')).rejects.toThrow('no longer exists');
  });
});

describe('addMembers', () => {
  it('adds new people and reuses existing contacts, ignoring case', async () => {
    const { store } = await ready();
    await store.createGroup('One', ['Aarav', 'Priya']);
    const second = await store.createGroup('Two', ['Karan']);
    const updated = await store.addMembers(second.id, ['aarav', 'Neha']);
    expect(updated.memberIds).toHaveLength(4);
    expect(store.getState().people.filter((p) => p.name.toLowerCase() === 'aarav')).toHaveLength(1);
    expect(store.getState().activity[0].type).toBe('member_added');
    expect(store.getState().activity[0].summary).toBe('Added aarav, Neha to "Two"');
  });

  it('persists across a reload', async () => {
    const first = await ready();
    const group = await first.store.createGroup('Trip', ['Aarav']);
    await first.store.addMembers(group.id, ['Priya']);
    const reloaded = makeStore(first.storage);
    await reloaded.store.init();
    expect(reloaded.store.getState().groups[0].memberIds).toHaveLength(3);
  });

  it('ignores people already in the group, you included, and rejects an empty result', async () => {
    const { store } = await ready();
    const group = await store.createGroup('Trip', ['Aarav']);
    await expect(store.addMembers(group.id, ['Aarav', ' aarav ', DEFAULT_PROFILE_NAME, ' '])).rejects.toThrow(
      'not already in the group',
    );
    expect(store.getState().groups[0].memberIds).toHaveLength(2);
  });

  it('enforces the group size limit', async () => {
    const { store } = await ready();
    const names = Array.from({ length: 8 }, (_, i) => `P${i}`);
    const group = await store.createGroup('Big', names); // you + 8 = 9
    await expect(store.addMembers(group.id, ['A', 'B'])).rejects.toThrow('at most 10');
    const full = await store.addMembers(group.id, ['A']);
    expect(full.memberIds).toHaveLength(10);
  });

  it('fails for an unknown group', async () => {
    const { store } = await ready();
    await expect(store.addMembers('missing', ['A'])).rejects.toThrow('no longer exists');
  });
});

describe('removeMember', () => {
  it('removes someone who is not part of any expense and logs it', async () => {
    const { store } = await ready();
    const group = await store.createGroup('Trip', ['Aarav', 'Priya']);
    const [a] = group.memberIds.slice(1);
    const updated = await store.removeMember(group.id, a);
    expect(updated.memberIds).not.toContain(a);
    expect(updated.memberIds).toHaveLength(2);
    expect(store.getState().activity[0].type).toBe('member_removed');
    expect(store.getState().activity[0].summary).toBe('Removed Aarav from "Trip"');
  });

  it('refuses while the person is part of an expense, and allows it after the expense is deleted', async () => {
    const { store } = await ready();
    const group = await store.createGroup('Trip', ['Aarav', 'Priya']);
    const [a, b] = group.memberIds.slice(1);
    const expense = await store.addExpense(draft(group.id, [ME_ID, a, b]));
    await expect(store.removeMember(group.id, a)).rejects.toThrow('Aarav is part of 1 expense');
    await store.deleteExpense(expense.id);
    const updated = await store.removeMember(group.id, a);
    expect(updated.memberIds).not.toContain(a);
  });

  it('counts several expenses in the message', async () => {
    const { store } = await ready();
    const group = await store.createGroup('Trip', ['Aarav', 'Priya']);
    const [a, b] = group.memberIds.slice(1);
    await store.addExpense(draft(group.id, [ME_ID, a, b]));
    await store.addExpense(draft(group.id, [ME_ID, a], { title: 'Lunch' }));
    await expect(store.removeMember(group.id, a)).rejects.toThrow('2 expenses');
  });

  it('never removes you, a stranger, or the second-to-last person', async () => {
    const { store } = await ready();
    const group = await store.createGroup('Pair', ['Aarav']);
    await expect(store.removeMember(group.id, ME_ID)).rejects.toThrow('remove yourself');
    await expect(store.removeMember(group.id, 'stranger')).rejects.toThrow('not in this group');
    await expect(store.removeMember(group.id, group.memberIds[1])).rejects.toThrow('at least two');
  });
});

describe('renameMe', () => {
  it('renames you everywhere and persists', async () => {
    const first = await ready();
    await first.store.createGroup('Trip', ['Aarav']);
    const updated = await first.store.renameMe('  Abbas Ansari ');
    expect(updated).toEqual({ id: ME_ID, name: 'Abbas Ansari' });
    expect(first.store.getState().me.name).toBe('Abbas Ansari');
    expect(first.store.getState().people.find((p) => p.id === ME_ID)?.name).toBe('Abbas Ansari');

    const reloaded = makeStore(first.storage);
    await reloaded.store.init();
    expect(reloaded.store.getState().me.name).toBe('Abbas Ansari');
  });

  it('validates the name and refuses one that clashes with a contact', async () => {
    const { store } = await ready();
    await store.createGroup('Trip', ['Aarav']);
    await expect(store.renameMe('  ')).rejects.toThrow('Enter your name');
    await expect(store.renameMe('x'.repeat(61))).rejects.toThrow('under 60');
    await expect(store.renameMe('aarav')).rejects.toThrow('already has that name');
    expect(store.getState().me.name).toBe(DEFAULT_PROFILE_NAME);
  });

  it('keeps old activity records readable after the schema grew', async () => {
    const { store, storage } = await ready();
    const group = await store.createGroup('Trip', ['Aarav']);
    await store.renameGroup(group.id, 'Trip 2');
    const stored = await storage.getAll(COLLECTIONS.activity);
    expect(stored).toHaveLength(2);
    const reloaded = makeStore(storage);
    await reloaded.store.init();
    expect(reloaded.store.getState().activity).toHaveLength(2);
  });
});
