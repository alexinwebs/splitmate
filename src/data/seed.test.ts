import { createMemoryStorage } from '../storage/memory';
import { seedSampleData } from './seed';
import { createAppStore } from './storeCore';

async function seeded() {
  const store = createAppStore({ storage: createMemoryStorage() });
  await store.init();
  await seedSampleData(store);
  return store;
}

describe('seedSampleData', () => {
  it('creates groups and expenses that all reconcile exactly', async () => {
    const store = await seeded();
    const state = store.getState();
    expect(state.groups).toHaveLength(4);
    expect(state.expenses).toHaveLength(8);
    for (const expense of state.expenses) {
      const shareSum = expense.shares.reduce((sum, s) => sum + s.amountPaise, 0);
      const paidSum = expense.payers.reduce((sum, p) => sum + p.paidPaise, 0);
      expect(shareSum).toBe(expense.totalPaise);
      expect(paidSum).toBe(expense.totalPaise);
    }
  });

  it('uses all four split methods', async () => {
    const store = await seeded();
    const methods = new Set(store.getState().expenses.map((e) => e.split.method));
    expect([...methods].sort()).toEqual(['equal', 'exact', 'percent', 'shares']);
  });

  it('refuses to run on a non-empty app', async () => {
    const store = await seeded();
    await expect(seedSampleData(store)).rejects.toThrow('empty app');
  });

  it('can be erased afterwards', async () => {
    const store = await seeded();
    await store.resetAllData();
    expect(store.getState().groups).toEqual([]);
    expect(store.getState().expenses).toEqual([]);
  });
});
