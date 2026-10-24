import type { Expense, Group } from '../../domain/models';
import { buildExpense } from '../../services/expenses';
import {
  changeGroup,
  evaluateForm,
  formStateFromExpense,
  initialFormState,
  setAllParticipants,
  toDecimalText,
  toggleParticipant,
  type FormState,
} from './formLogic';

const group: Group = {
  id: 'g1',
  name: 'Trip',
  memberIds: ['me', 'a', 'b'],
  adminId: 'me',
  createdAt: '2025-05-01T00:00:00.000Z',
};
const other: Group = { ...group, id: 'g2', name: 'Flat', memberIds: ['x', 'me'] };

function filled(overrides: Partial<FormState> = {}): FormState {
  return {
    ...initialFormState(group, 'me', '2025-05-10'),
    title: 'Dinner',
    amountText: '300',
    ...overrides,
  };
}

describe('initialFormState', () => {
  it('starts with everyone selected, you as payer, equal split and today', () => {
    const state = initialFormState(group, 'me', '2025-05-10');
    expect(state.participantIds).toEqual(['me', 'a', 'b']);
    expect(state.payerId).toBe('me');
    expect(state.method).toBe('equal');
    expect(state.dateText).toBe('2025-05-10');
  });

  it('falls back to the first member when you are not in the group', () => {
    const outsider: Group = { ...group, memberIds: ['a', 'b'] };
    expect(initialFormState(outsider, 'me', '2025-05-10').payerId).toBe('a');
  });
});

describe('evaluateForm: required fields', () => {
  it('reports every missing field on an empty form', () => {
    const result = evaluateForm(initialFormState(group, 'me', '2025-05-10'), group);
    expect(result.isValid).toBe(false);
    expect(result.draft).toBeNull();
    expect(result.errors.title).toBeDefined();
    expect(result.errors.amount).toBe('Enter the amount.');
    expect(result.errors.date).toBeUndefined();
  });

  it('validates the amount text', () => {
    expect(evaluateForm(filled({ amountText: 'abc' }), group).errors.amount).toContain('valid amount');
    expect(evaluateForm(filled({ amountText: '1.234' }), group).errors.amount).toContain('valid amount');
    expect(evaluateForm(filled({ amountText: '0' }), group).errors.amount).toContain('greater than zero');
    expect(evaluateForm(filled({ amountText: '-5' }), group).errors.amount).toContain('valid amount');
  });

  it('validates the date', () => {
    expect(evaluateForm(filled({ dateText: '2025-02-30' }), group).errors.date).toBeDefined();
    expect(evaluateForm(filled({ dateText: '10/05/2025' }), group).errors.date).toBeDefined();
  });

  it('requires at least one participant', () => {
    const result = evaluateForm(filled({ participantIds: [] }), group);
    expect(result.errors.participants).toBeDefined();
    expect(result.draft).toBeNull();
  });

  it('rejects a payer outside the group and an over-long note', () => {
    expect(evaluateForm(filled({ payerId: 'nobody' }), group).errors.payer).toBeDefined();
    expect(evaluateForm(filled({ note: 'x'.repeat(201) }), group).errors.note).toBeDefined();
  });
});

describe('evaluateForm: equal split', () => {
  it('builds a draft and previews each share', () => {
    const result = evaluateForm(filled(), group);
    expect(result.isValid).toBe(true);
    expect(result.draft?.totalPaise).toBe(30000);
    expect(result.draft?.payers).toEqual([{ memberId: 'me', paidPaise: 30000 }]);
    expect(result.preview?.map((s) => s.amountPaise)).toEqual([10000, 10000, 10000]);
  });

  it('handles paise without floating point drift', () => {
    const result = evaluateForm(filled({ amountText: '299.99' }), group);
    expect(result.preview?.map((s) => s.amountPaise)).toEqual([10000, 10000, 9999]);
  });

  it('splits only among the chosen people, in group order', () => {
    const result = evaluateForm(filled({ participantIds: ['b', 'me'], amountText: '100' }), group);
    expect(result.draft?.split).toEqual({ method: 'equal', participantIds: ['me', 'b'] });
    expect(result.preview?.map((s) => s.memberId)).toEqual(['me', 'b']);
  });

  it('lets someone else be the payer', () => {
    const result = evaluateForm(filled({ payerId: 'a' }), group);
    expect(result.draft?.payers[0].memberId).toBe('a');
  });

  it('trims text and drops an empty note', () => {
    const result = evaluateForm(filled({ title: '  Dinner ', note: '  ' }), group);
    expect(result.draft?.title).toBe('Dinner');
    expect(result.draft?.note).toBeUndefined();
  });
});

describe('evaluateForm: exact split', () => {
  const base = (exactText: Record<string, string>) =>
    filled({ method: 'exact', amountText: '100', exactText });

  it('accepts amounts that add up and reports no remainder', () => {
    const result = evaluateForm(base({ me: '60', a: '30', b: '10' }), group);
    expect(result.isValid).toBe(true);
    expect(result.preview?.map((s) => s.amountPaise)).toEqual([6000, 3000, 1000]);
    expect(result.progress).toEqual({ kind: 'amount', allocatedPaise: 10000, remainingPaise: 0 });
  });

  it('shows how much is left while the amounts are incomplete', () => {
    const result = evaluateForm(base({ me: '60', a: '30' }), group);
    expect(result.isValid).toBe(false);
    expect(result.progress).toEqual({ kind: 'amount', allocatedPaise: 9000, remainingPaise: 1000 });
    expect(result.errors.split).toBeDefined();
  });

  it('shows an overshoot as a negative remainder', () => {
    const result = evaluateForm(base({ me: '80', a: '30' }), group);
    expect(result.progress).toEqual({ kind: 'amount', allocatedPaise: 11000, remainingPaise: -1000 });
    expect(result.isValid).toBe(false);
  });

  it('reports unreadable amounts against the person', () => {
    const result = evaluateForm(base({ me: '60', a: 'abc', b: '40' }), group);
    expect(result.errors.members.a).toBeDefined();
    expect(result.draft).toBeNull();
  });
});

describe('evaluateForm: percentage split', () => {
  const base = (percentText: Record<string, string>) =>
    filled({ method: 'percent', amountText: '100.01', percentText });

  it('splits by percentage and places the odd paisa deterministically', () => {
    const result = evaluateForm(base({ me: '50', a: '30', b: '20' }), group);
    expect(result.isValid).toBe(true);
    expect(result.preview?.map((s) => s.amountPaise)).toEqual([5001, 3000, 2000]);
  });

  it('shows what is left of 100%', () => {
    const result = evaluateForm(base({ me: '50', a: '30' }), group);
    expect(result.progress).toEqual({ kind: 'percent', allocatedBps: 8000, remainingBps: 2000 });
    expect(result.isValid).toBe(false);
  });

  it('rejects unreadable or out-of-range percentages', () => {
    expect(evaluateForm(base({ me: '150', a: '0', b: '0' }), group).errors.members.me).toBeDefined();
    expect(evaluateForm(base({ me: 'x', a: '50', b: '50' }), group).errors.members.me).toBeDefined();
  });
});

describe('evaluateForm: shares split', () => {
  it('defaults every person to one share', () => {
    const result = evaluateForm(filled({ method: 'shares', amountText: '300' }), group);
    expect(result.preview?.map((s) => s.amountPaise)).toEqual([10000, 10000, 10000]);
  });

  it('weights people by their shares', () => {
    const result = evaluateForm(
      filled({ method: 'shares', amountText: '100', sharesText: { me: '2', a: '1', b: '1' } }),
      group,
    );
    expect(result.preview?.map((s) => s.amountPaise)).toEqual([5000, 2500, 2500]);
  });

  it('rejects zero, empty, decimal and negative shares', () => {
    for (const bad of ['0', '', '1.5', '-1', 'two']) {
      const result = evaluateForm(
        filled({ method: 'shares', sharesText: { me: bad, a: '1', b: '1' } }),
        group,
      );
      expect(result.errors.members.me).toBeDefined();
      expect(result.draft).toBeNull();
    }
  });
});

describe('state helpers', () => {
  it('toggles participants on and off', () => {
    const state = initialFormState(group, 'me', '2025-05-10');
    const without = toggleParticipant(state, 'a');
    expect(without.participantIds).toEqual(['me', 'b']);
    expect(toggleParticipant(without, 'a').participantIds.sort()).toEqual(['a', 'b', 'me']);
  });

  it('selects and clears everyone', () => {
    const state = initialFormState(group, 'me', '2025-05-10');
    expect(setAllParticipants(state, group, false).participantIds).toEqual([]);
    expect(setAllParticipants(state, group, true).participantIds).toEqual(['me', 'a', 'b']);
  });

  it('switching group keeps typed text and resets people-specific fields', () => {
    const state = filled({ exactText: { me: '5' }, payerId: 'a', note: 'hi' });
    const switched = changeGroup(state, other, 'me');
    expect(switched.groupId).toBe('g2');
    expect(switched.title).toBe('Dinner');
    expect(switched.note).toBe('hi');
    expect(switched.payerId).toBe('me');
    expect(switched.participantIds).toEqual(['x', 'me']);
    expect(switched.exactText).toEqual({});
  });

  it('formats decimal text', () => {
    expect(toDecimalText(12050)).toBe('120.5');
    expect(toDecimalText(5000)).toBe('50');
    expect(toDecimalText(3333)).toBe('33.33');
    expect(toDecimalText(7)).toBe('0.07');
    expect(toDecimalText(0)).toBe('0');
  });
});

describe('editing round trip', () => {
  function expenseFrom(state: FormState): Expense {
    const evaluation = evaluateForm(state, group);
    if (!evaluation.draft) throw new Error('setup: form invalid');
    const built = buildExpense(evaluation.draft, group, { id: 'e1', now: '2025-05-10T10:00:00.000Z' });
    if (!built.ok) throw new Error('setup: build failed');
    return built.expense;
  }

  const cases: [string, FormState][] = [
    ['equal', filled({ participantIds: ['me', 'b'], amountText: '299.99' })],
    ['exact', filled({ method: 'exact', amountText: '100.5', exactText: { me: '60.25', a: '40.25' }, participantIds: ['me', 'a'] })],
    ['percent', filled({ method: 'percent', amountText: '250', percentText: { me: '33.33', a: '33.33', b: '33.34' } })],
    ['shares', filled({ method: 'shares', amountText: '90', sharesText: { me: '3', a: '2', b: '1' } })],
  ];

  it.each(cases)('loading a saved %s expense into the form gives the same draft back', (_name, state) => {
    const expense = expenseFrom(state);
    const loaded = formStateFromExpense(expense);
    expect(loaded).not.toBeNull();
    const again = evaluateForm(loaded as FormState, group);
    expect(again.isValid).toBe(true);
    expect(again.draft?.totalPaise).toBe(expense.totalPaise);
    expect(again.draft?.split).toEqual(expense.split);
    expect(again.preview).toEqual(expense.shares);
  });

  it('refuses to load an expense with several payers instead of merging them', () => {
    const expense = expenseFrom(filled());
    const multi: Expense = {
      ...expense,
      payers: [
        { memberId: 'me', paidPaise: 10000 },
        { memberId: 'a', paidPaise: 20000 },
      ],
    };
    expect(formStateFromExpense(multi)).toBeNull();
  });
});
