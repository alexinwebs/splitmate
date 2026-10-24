import { useMemo, useSyncExternalStore } from 'react';

import type { Group } from '../domain/models';
import { buildExpenseViews, type ExpenseView } from '../domain/views';
import { createPersistentStorage } from '../storage/persistent';
import { seedSampleData } from './seed';
import { createAppStore, type AppState } from './storeCore';

/** The app-wide data store, persisted on the device. */
export const appStore = createAppStore({ storage: createPersistentStorage() });

export function useAppState(): AppState {
  return useSyncExternalStore(appStore.subscribe, appStore.getState, appStore.getState);
}

export function useGroup(id?: string): Group | undefined {
  const { groups } = useAppState();
  return groups.find((g) => g.id === id);
}

export function useExpenseViews(): ExpenseView[] {
  const { expenses, groups, people, me } = useAppState();
  return useMemo(
    () => buildExpenseViews(expenses, groups, people, me.id),
    [expenses, groups, people, me.id],
  );
}

export function useExpenseView(id?: string): ExpenseView | undefined {
  const views = useExpenseViews();
  return views.find((v) => v.expense.id === id);
}

export function loadSampleData(): Promise<void> {
  return seedSampleData(appStore);
}
