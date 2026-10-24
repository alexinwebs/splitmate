import type { Group } from '../domain/models';
import { buildExpense, type ExpenseDraft } from './expenses';

const group: Group = {
  id: 'g1',
  name: 'Trip',
  memberIds: ['me', 'a', 'b'],
  adminId: 'me',
  createdAt: '2025-05-01T00:00:00.000Z',
};
const meta = { id: 'e1', now: '2025-05-10T10:00:00.000Z' };

function draft(overrides: Partial<ExpenseDraft> = {}): ExpenseDraft {
  return {
    groupId: 'g1',
    title: 'Dinner',
    totalPaise: 10000,
    date: '2025-05-10',
    category: 'food',
    payers: [{ memberId: 'me', paidPaise: 10000 }],
    split: { method: 'equal', participantIds: ['me', 'a', 'b'] },
    ...overrides,
  };
}

describe('buildExpense', () => {
  it('builds an expense with shares from the split engine', () => {
    const result = buildExpense(draft(), group, meta);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.expense.shares).toEqual([
      { memberId: 'me', amountPaise: 3334 },
      { memberId: 'a', amountPaise: 3333 },
      { memberId: 'b', amountPaise: 3333 },
    ]);
    expect(result.expense.source).toBe('manual');
    expect(result.expense.createdAt).toBe(meta.now);
    expect(result.expense.note).toBeUndefined();
  });

  it('trims the title and drops an empty note', () => {
    const result = buildExpense(draft({ title: '  Dinner  ', note: '   ' }), group, meta);
    expect(result.ok && result.expense.title).toBe('Dinner');
    expect(result.ok && result.expense.note).toBeUndefined();
  });

  it('supports several payers that add up to the total', () => {
    const result = buildExpense(
      draft({
        payers: [
          { memberId: 'me', paidPaise: 6000 },
          { memberId: 'a', paidPaise: 4000 },
        ],
      }),
      group,
      meta,
    );
    expect(result.ok).toBe(true);
  });

  it('reports payers that do not add up, with the difference', () => {
    const result = buildExpense(
      draft({ payers: [{ memberId: 'me', paidPaise: 9000 }] }),
      group,
      meta,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe('payers');
    expect(result.error.code).toBe('PAYERS_MISMATCH');
    expect(result.error.differencePaise).toBe(1000);
  });

  it('rejects payers or participants outside the group', () => {
    const badPayer = buildExpense(
      draft({ payers: [{ memberId: 'zzz', paidPaise: 10000 }] }),
      group,
      meta,
    );
    expect(!badPayer.ok && badPayer.error.code).toBe('PAYER_NOT_IN_GROUP');

    const badParticipant = buildExpense(
      draft({ split: { method: 'equal', participantIds: ['me', 'zzz'] } }),
      group,
      meta,
    );
    expect(!badParticipant.ok && badParticipant.error.code).toBe('PARTICIPANT_NOT_IN_GROUP');
  });

  it('rejects duplicate payers and zero payments', () => {
    const dup = buildExpense(
      draft({
        payers: [
          { memberId: 'me', paidPaise: 5000 },
          { memberId: 'me', paidPaise: 5000 },
        ],
      }),
      group,
      meta,
    );
    expect(!dup.ok && dup.error.code).toBe('DUPLICATE_PAYER');

    const zero = buildExpense(
      draft({
        payers: [
          { memberId: 'me', paidPaise: 10000 },
          { memberId: 'a', paidPaise: 0 },
        ],
      }),
      group,
      meta,
    );
    expect(!zero.ok && zero.error.code).toBe('INVALID_PAID_AMOUNT');
  });

  it('rejects an empty title, bad total and bad date, naming the field', () => {
    const title = buildExpense(draft({ title: '   ' }), group, meta);
    expect(!title.ok && title.error.field).toBe('title');
    const total = buildExpense(draft({ totalPaise: 0 }), group, meta);
    expect(!total.ok && total.error.field).toBe('total');
    const date = buildExpense(draft({ date: '2025-02-30' }), group, meta);
    expect(!date.ok && date.error.field).toBe('date');
  });

  it('passes split engine errors through with their details', () => {
    const result = buildExpense(
      draft({
        split: {
          method: 'exact',
          entries: [
            { memberId: 'me', value: 6000 },
            { memberId: 'a', value: 3000 },
          ],
        },
      }),
      group,
      meta,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe('split');
    expect(result.error.code).toBe('AMOUNTS_MISMATCH');
    expect(result.error.differencePaise).toBe(1000);
  });

  it('keeps id, createdAt and source when editing', () => {
    const created = buildExpense(draft(), group, meta);
    if (!created.ok) throw new Error('setup failed');
    const edited = buildExpense(
      draft({ title: 'Dinner (edited)' }),
      group,
      { id: 'ignored', now: '2025-05-11T10:00:00.000Z', existing: created.expense },
    );
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.expense.id).toBe('e1');
    expect(edited.expense.createdAt).toBe(meta.now);
    expect(edited.expense.updatedAt).toBe('2025-05-11T10:00:00.000Z');
  });

  it('rejects a draft for a different group', () => {
    const result = buildExpense(draft({ groupId: 'other' }), group, meta);
    expect(!result.ok && result.error.field).toBe('group');
  });
});
