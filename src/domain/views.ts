import { formatMoney } from './money';
import type { Expense, Group, Person } from './models';

export type ExpenseStatus = 'settled' | 'pending';

export type ExpenseView = {
  expense: Expense;
  groupName: string;
  /** Names of the people who share this expense. */
  memberNames: string[];
  participantCount: number;
  yourPaidPaise: number;
  yourSharePaise: number;
  /** paid minus share: positive = you are owed, negative = you owe. */
  netPaise: number;
  status: ExpenseStatus;
  youLine: string;
  subLine: string;
  youOwe: boolean;
};

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/**
 * Net position of every person for one expense (paid minus share).
 * Status is "pending" while anyone still owes money on it. Settlement-aware
 * status arrives with the ledger in Phase 7.
 */
export function expenseNets(expense: Expense): Map<string, number> {
  const nets = new Map<string, number>();
  for (const payer of expense.payers) {
    nets.set(payer.memberId, (nets.get(payer.memberId) ?? 0) + payer.paidPaise);
  }
  for (const share of expense.shares) {
    nets.set(share.memberId, (nets.get(share.memberId) ?? 0) - share.amountPaise);
  }
  return nets;
}

export function buildExpenseView(
  expense: Expense,
  groups: readonly Group[],
  people: readonly Person[],
  meId: string,
): ExpenseView {
  const nameOf = (id: string): string => people.find((p) => p.id === id)?.name ?? 'Unknown';
  const yourPaidPaise = expense.payers
    .filter((p) => p.memberId === meId)
    .reduce((sum, p) => sum + p.paidPaise, 0);
  const yourSharePaise = expense.shares
    .filter((s) => s.memberId === meId)
    .reduce((sum, s) => sum + s.amountPaise, 0);
  const netPaise = yourPaidPaise - yourSharePaise;

  let nobodyOwes = true;
  for (const net of expenseNets(expense).values()) {
    if (net < 0) nobodyOwes = false;
  }

  const youLine =
    yourPaidPaise > 0
      ? `You paid ${formatMoney(yourPaidPaise)}`
      : yourSharePaise > 0
        ? `Your share ${formatMoney(yourSharePaise)}`
        : 'You are not part of this';
  const subLine =
    netPaise > 0
      ? `You are owed ${formatMoney(netPaise)}`
      : netPaise < 0
        ? `You owe ${formatMoney(-netPaise)}`
        : yourPaidPaise > 0 || yourSharePaise > 0
          ? 'You are even'
          : '';

  return {
    expense,
    groupName: groups.find((g) => g.id === expense.groupId)?.name ?? 'Group',
    memberNames: expense.shares.map((s) => nameOf(s.memberId)),
    participantCount: expense.shares.length,
    yourPaidPaise,
    yourSharePaise,
    netPaise,
    status: nobodyOwes ? 'settled' : 'pending',
    youLine,
    subLine,
    youOwe: netPaise < 0,
  };
}

export function buildExpenseViews(
  expenses: readonly Expense[],
  groups: readonly Group[],
  people: readonly Person[],
  meId: string,
): ExpenseView[] {
  return expenses.map((e) => buildExpenseView(e, groups, people, meId));
}

export function groupStats(
  groupId: string,
  expenses: readonly Expense[],
): { billCount: number; totalPaise: number } {
  let billCount = 0;
  let totalPaise = 0;
  for (const e of expenses) {
    if (e.groupId === groupId) {
      billCount += 1;
      totalPaise += e.totalPaise;
    }
  }
  return { billCount, totalPaise };
}
