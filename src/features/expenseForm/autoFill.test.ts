import type { Group } from '../../domain/models';
import { computeAutoFill, evaluateForm, initialFormState, type FormState } from './formLogic';

const group: Group = {
  id: 'g1',
  name: 'Trip',
  memberIds: ['me', 'a', 'b'],
  adminId: 'me',
  createdAt: '2025-05-01T00:00:00.000Z',
};

function exact(exactText: Record<string, string>, amountText = '100'): FormState {
  return {
    ...initialFormState(group, 'me', '2025-05-10'),
    title: 'Dinner',
    amountText,
    method: 'exact',
    exactText,
  };
}

function percent(percentText: Record<string, string>): FormState {
  return {
    ...initialFormState(group, 'me', '2025-05-10'),
    title: 'Dinner',
    amountText: '100',
    method: 'percent',
    percentText,
  };
}

describe('auto-fill for exact amounts', () => {
  it('suggests the remainder for the last empty person (₹100: 30 + 40 leaves 30)', () => {
    const state = exact({ me: '30', a: '40' });
    expect(computeAutoFill(state, group)).toEqual({ memberId: 'b', text: '30' });
    const result = evaluateForm(state, group);
    expect(result.isValid).toBe(true);
    expect(result.preview?.map((s) => s.amountPaise)).toEqual([3000, 4000, 3000]);
    expect(result.progress).toEqual({ kind: 'amount', allocatedPaise: 10000, remainingPaise: 0 });
    expect(result.autoFill).toEqual({ memberId: 'b', text: '30' });
  });

  it('follows the other fields as they change, because it is never stored', () => {
    expect(computeAutoFill(exact({ me: '20', a: '40' }), group)).toEqual({ memberId: 'b', text: '40' });
  });

  it('works whichever single person is left empty', () => {
    expect(computeAutoFill(exact({ a: '40', b: '30' }), group)).toEqual({ memberId: 'me', text: '30' });
  });

  it('handles paise amounts exactly', () => {
    const state = exact({ me: '33.33', a: '33.33' }, '100');
    expect(computeAutoFill(state, group)).toEqual({ memberId: 'b', text: '33.34' });
    expect(evaluateForm(state, group).isValid).toBe(true);
  });

  it('is replaced by whatever the person types, including an explicit 0', () => {
    const typed = exact({ me: '30', a: '40', b: '10' });
    expect(computeAutoFill(typed, group)).toBeNull();
    expect(evaluateForm(typed, group).isValid).toBe(false); // 80 of 100 assigned: nothing is guessed
    const zero = exact({ me: '30', a: '40', b: '0' });
    expect(computeAutoFill(zero, group)).toBeNull();
    expect(evaluateForm(zero, group).progress).toEqual({
      kind: 'amount',
      allocatedPaise: 7000,
      remainingPaise: 3000,
    });
  });

  it('comes back when a typed value is cleared', () => {
    expect(computeAutoFill(exact({ me: '30', a: '40', b: '' }), group)).toEqual({
      memberId: 'b',
      text: '30',
    });
  });

  it('does nothing when two or more people are empty', () => {
    expect(computeAutoFill(exact({ me: '30' }), group)).toBeNull();
    expect(computeAutoFill(exact({}), group)).toBeNull();
  });

  it('does nothing when nothing is left or the amounts already overshoot', () => {
    expect(computeAutoFill(exact({ me: '60', a: '40' }), group)).toBeNull();
    expect(computeAutoFill(exact({ me: '60', a: '50' }), group)).toBeNull();
    const over = evaluateForm(exact({ me: '60', a: '50' }), group);
    expect(over.isValid).toBe(false);
    expect(over.progress).toEqual({ kind: 'amount', allocatedPaise: 11000, remainingPaise: -1000 });
  });

  it('does nothing when another field is unreadable or the total is not valid yet', () => {
    expect(computeAutoFill(exact({ me: 'abc', a: '40' }), group)).toBeNull();
    expect(computeAutoFill(exact({ me: '30', a: '40' }, ''), group)).toBeNull();
    expect(computeAutoFill(exact({ me: '30', a: '40' }, 'x'), group)).toBeNull();
    expect(computeAutoFill(exact({ me: '30', a: '40' }, '0'), group)).toBeNull();
  });

  it('only counts the people who are part of the split', () => {
    const state = { ...exact({ me: '30' }), participantIds: ['me', 'a'] };
    expect(computeAutoFill(state, group)).toEqual({ memberId: 'a', text: '70' });
  });

  it('gives a lone participant the whole amount', () => {
    const state = { ...exact({}), participantIds: ['a'] };
    expect(computeAutoFill(state, group)).toEqual({ memberId: 'a', text: '100' });
  });
});

describe('auto-fill for percentages', () => {
  it('suggests the rest of 100%', () => {
    const state = percent({ me: '50', a: '30' });
    expect(computeAutoFill(state, group)).toEqual({ memberId: 'b', text: '20' });
    const result = evaluateForm(state, group);
    expect(result.isValid).toBe(true);
    expect(result.preview?.map((s) => s.amountPaise)).toEqual([5000, 3000, 2000]);
  });

  it('keeps two-decimal percentages exact (33.33 + 33.33 leaves 33.34)', () => {
    const state = percent({ me: '33.33', a: '33.33' });
    expect(computeAutoFill(state, group)).toEqual({ memberId: 'b', text: '33.34' });
    expect(evaluateForm(state, group).preview?.map((s) => s.amountPaise)).toEqual([3333, 3333, 3334]);
  });

  it('does not suggest anything at or above 100%', () => {
    expect(computeAutoFill(percent({ me: '60', a: '40' }), group)).toBeNull();
    expect(computeAutoFill(percent({ me: '70', a: '40' }), group)).toBeNull();
  });

  it('does not need the amount to be filled in yet', () => {
    const state = { ...percent({ me: '50', a: '25' }), amountText: '' };
    expect(computeAutoFill(state, group)).toEqual({ memberId: 'b', text: '25' });
  });
});

describe('methods without a remainder', () => {
  it('never auto-fills equal or shares splits', () => {
    const base = initialFormState(group, 'me', '2025-05-10');
    expect(computeAutoFill({ ...base, method: 'equal' }, group)).toBeNull();
    expect(computeAutoFill({ ...base, method: 'shares', sharesText: { me: '2', a: '1' } }, group)).toBeNull();
  });
});
