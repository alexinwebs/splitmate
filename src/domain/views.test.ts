import type { Expense, Group, Person } from './models';
import { buildExpenseView, expenseNets, firstName, groupStats } from './views';

const people: Person[] = [
  { id: 'me', name: 'Abbas' },
  { id: 'a', name: 'Aarav Sharma' },
  { id: 'b', name: 'Priya Singh' },
];
const groups: Group[] = [
  { id: 'g1', name: 'Trip', memberIds: ['me', 'a', 'b'], adminId: 'me', createdAt: '2025-05-01T00:00:00.000Z' },
];

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    groupId: 'g1',
    title: 'Dinner',
    totalPaise: 30000,
    date: '2025-05-10',
    category: 'food',
    payers: [{ memberId: 'me', paidPaise: 30000 }],
    split: { method: 'equal', participantIds: ['me', 'a', 'b'] },
    shares: [
      { memberId: 'me', amountPaise: 10000 },
      { memberId: 'a', amountPaise: 10000 },
      { memberId: 'b', amountPaise: 10000 },
    ],
    source: 'manual',
    createdAt: '2025-05-10T10:00:00.000Z',
    updatedAt: '2025-05-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('buildExpenseView', () => {
  it('describes an expense you paid for', () => {
    const view = buildExpenseView(expense(), groups, people, 'me');
    expect(view.yourPaidPaise).toBe(30000);
    expect(view.yourSharePaise).toBe(10000);
    expect(view.netPaise).toBe(20000);
    expect(view.youLine).toBe('You paid ₹300');
    expect(view.subLine).toBe('You are owed ₹200');
    expect(view.youOwe).toBe(false);
    expect(view.status).toBe('pending');
    expect(view.groupName).toBe('Trip');
    expect(view.participantCount).toBe(3);
  });

  it('describes an expense someone else paid for', () => {
    const view = buildExpenseView(
      expense({ payers: [{ memberId: 'a', paidPaise: 30000 }] }),
      groups,
      people,
      'me',
    );
    expect(view.youLine).toBe('Your share ₹100');
    expect(view.subLine).toBe('You owe ₹100');
    expect(view.youOwe).toBe(true);
  });

  it('is settled when nobody owes anything', () => {
    const solo = expense({
      totalPaise: 5000,
      payers: [{ memberId: 'me', paidPaise: 5000 }],
      split: { method: 'equal', participantIds: ['me'] },
      shares: [{ memberId: 'me', amountPaise: 5000 }],
    });
    const view = buildExpenseView(solo, groups, people, 'me');
    expect(view.status).toBe('settled');
    expect(view.subLine).toBe('You are even');
  });

  it('handles a user who is not part of the expense', () => {
    const view = buildExpenseView(
      expense({
        payers: [{ memberId: 'a', paidPaise: 30000 }],
        shares: [
          { memberId: 'a', amountPaise: 15000 },
          { memberId: 'b', amountPaise: 15000 },
        ],
      }),
      groups,
      people,
      'me',
    );
    expect(view.youLine).toBe('You are not part of this');
    expect(view.subLine).toBe('');
  });

  it('computes nets that always sum to zero', () => {
    const nets = expenseNets(expense());
    let sum = 0;
    for (const n of nets.values()) sum += n;
    expect(sum).toBe(0);
  });
});

describe('helpers', () => {
  it('returns the first name', () => {
    expect(firstName('Aarav Sharma')).toBe('Aarav');
    expect(firstName('Abbas')).toBe('Abbas');
  });

  it('counts bills and totals per group', () => {
    const list = [expense(), expense({ id: 'e2', totalPaise: 1000 }), expense({ id: 'e3', groupId: 'g2' })];
    expect(groupStats('g1', list)).toEqual({ billCount: 2, totalPaise: 31000 });
    expect(groupStats('none', list)).toEqual({ billCount: 0, totalPaise: 0 });
  });
});
