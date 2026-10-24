import { addDaysIso, todayIso } from '../domain/date';
import type { ExpenseCategory, Split } from '../domain/models';
import type { AppStore } from './storeCore';
import { ME_ID } from './storeCore';

type SeedExpense = {
  group: string;
  title: string;
  rupees: number;
  daysAgo: number;
  category: ExpenseCategory;
  payer: string; // person name, or 'me'
  split: (id: (name: string) => string) => Split;
};

const GROUPS: { name: string; members: string[] }[] = [
  { name: 'Weekend Gang', members: ['Aarav Sharma', 'Priya Singh', 'Karan Mehta', 'Rohan Verma'] },
  { name: 'Roommates', members: ['Rohan Verma', 'Neha Gupta'] },
  { name: 'College', members: ['Aarav Sharma', 'Priya Singh', 'Karan Mehta', 'Aditya Patel'] },
  { name: 'Family', members: ['Priya Singh', 'Neha Gupta'] },
];

const EXPENSES: SeedExpense[] = [
  {
    group: 'Roommates', title: 'Blinkit Order', rupees: 150, daysAgo: 0, category: 'groceries', payer: 'me',
    split: (id) => ({ method: 'equal', participantIds: [ME_ID, id('Rohan Verma'), id('Neha Gupta')] }),
  },
  {
    group: 'Weekend Gang', title: 'Zomato Order', rupees: 420, daysAgo: 1, category: 'food', payer: 'me',
    split: (id) => ({ method: 'equal', participantIds: [ME_ID, id('Aarav Sharma'), id('Priya Singh'), id('Karan Mehta')] }),
  },
  {
    group: 'Roommates', title: 'Groceries', rupees: 680, daysAgo: 2, category: 'groceries', payer: 'Neha Gupta',
    split: (id) => ({ method: 'equal', participantIds: [ME_ID, id('Rohan Verma'), id('Neha Gupta')] }),
  },
  {
    group: 'College', title: 'Swiggy Order', rupees: 640, daysAgo: 4, category: 'food', payer: 'Aarav Sharma',
    split: (id) => ({
      method: 'percent',
      entries: [
        { memberId: ME_ID, value: 4000 },
        { memberId: id('Aarav Sharma'), value: 3000 },
        { memberId: id('Priya Singh'), value: 3000 },
      ],
    }),
  },
  {
    group: 'Roommates', title: 'DMart Shopping', rupees: 1230, daysAgo: 6, category: 'shopping', payer: 'me',
    split: (id) => ({
      method: 'shares',
      entries: [
        { memberId: ME_ID, value: 2 },
        { memberId: id('Rohan Verma'), value: 1 },
        { memberId: id('Neha Gupta'), value: 1 },
      ],
    }),
  },
  {
    group: 'Weekend Gang', title: "McDonald's", rupees: 780, daysAgo: 9, category: 'food', payer: 'Karan Mehta',
    split: (id) => ({ method: 'equal', participantIds: [ME_ID, id('Aarav Sharma'), id('Priya Singh'), id('Karan Mehta')] }),
  },
  {
    group: 'Family', title: 'Amazon Order', rupees: 2450, daysAgo: 13, category: 'shopping', payer: 'me',
    split: (id) => ({
      method: 'exact',
      entries: [
        { memberId: ME_ID, value: 100000 },
        { memberId: id('Priya Singh'), value: 80000 },
        { memberId: id('Neha Gupta'), value: 65000 },
      ],
    }),
  },
  {
    group: 'Weekend Gang', title: 'Pizza Party', rupees: 560, daysAgo: 18, category: 'food', payer: 'Priya Singh',
    split: (id) => ({ method: 'equal', participantIds: [ME_ID, id('Aarav Sharma'), id('Priya Singh'), id('Karan Mehta')] }),
  },
];

/** Fills an empty app with realistic groups and expenses, created through the real store and engine. */
export async function seedSampleData(store: AppStore): Promise<void> {
  if (store.getState().groups.length > 0) {
    throw new Error('Sample data can only be loaded into an empty app. Erase your data first.');
  }

  const groupIds = new Map<string, string>();
  for (const g of GROUPS) {
    const group = await store.createGroup(g.name, g.members);
    groupIds.set(g.name, group.id);
  }

  const idOf = (name: string): string => {
    const person = store.getState().people.find((p) => p.name === name);
    if (!person) throw new Error(`Sample person missing: ${name}`);
    return person.id;
  };

  const today = todayIso();
  for (const e of EXPENSES) {
    const groupId = groupIds.get(e.group);
    if (!groupId) throw new Error(`Sample group missing: ${e.group}`);
    const total = e.rupees * 100;
    await store.addExpense({
      groupId,
      title: e.title,
      totalPaise: total,
      date: addDaysIso(today, -e.daysAgo),
      category: e.category,
      payers: [{ memberId: e.payer === 'me' ? ME_ID : idOf(e.payer), paidPaise: total }],
      split: e.split(idOf),
    });
  }
}
