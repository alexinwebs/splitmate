import { useSyncExternalStore } from 'react';

import type { Bill, Group } from '../domain/types';
import { CURRENT_USER, SAMPLE_BILLS, SAMPLE_GROUPS } from './sample';

/**
 * Temporary in-memory store (Phase 2). Screens only use the hooks and
 * functions exported here, so Phase 3 can replace the internals with SQLite.
 */
type State = { readonly groups: Group[]; readonly bills: Bill[] };

let state: State = {
  groups: SAMPLE_GROUPS,
  bills: [...SAMPLE_BILLS].sort((a, b) => b.date.localeCompare(a.date)),
};

const listeners = new Set<() => void>();

function setState(next: State): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): State {
  return state;
}

export function useAppState(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useGroup(id?: string): Group | undefined {
  const { groups } = useAppState();
  return groups.find((g) => g.id === id);
}

export function useBill(id?: string): Bill | undefined {
  const { bills } = useAppState();
  return bills.find((b) => b.id === id);
}

export function createGroup(name: string, otherMembers: string[]): Group {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error('Group name is required');
  }
  const group: Group = {
    id: `g-${Date.now().toString(36)}`,
    name: trimmed,
    adminName: CURRENT_USER,
    memberNames: [CURRENT_USER, ...otherMembers],
    billsSplit: 0,
    totalSettledPaise: 0,
  };
  setState({ ...state, groups: [group, ...state.groups] });
  return group;
}

export function removeGroup(id: string): void {
  setState({ ...state, groups: state.groups.filter((g) => g.id !== id) });
}
