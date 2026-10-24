import { computeSplit, type ShareLine, type SplitResult } from './splits';

function amounts(result: SplitResult): number[] {
  if (!result.ok) throw new Error(`expected ok but got ${result.error.code}`);
  return result.shares.map((s: ShareLine) => s.amountPaise);
}

function errorCode(result: SplitResult): string {
  if (result.ok) throw new Error('expected an error');
  return result.error.code;
}

describe('equal split', () => {
  it('splits ₹100 three ways with the extra paisa to the first person', () => {
    const result = computeSplit(10000, { method: 'equal', participantIds: ['a', 'b', 'c'] });
    expect(amounts(result)).toEqual([3334, 3333, 3333]);
  });

  it('splits evenly when divisible', () => {
    const result = computeSplit(10000, { method: 'equal', participantIds: ['a', 'b', 'c', 'd'] });
    expect(amounts(result)).toEqual([2500, 2500, 2500, 2500]);
  });

  it('gives a single participant the whole amount', () => {
    const result = computeSplit(4321, { method: 'equal', participantIds: ['a'] });
    expect(amounts(result)).toEqual([4321]);
  });

  it('keeps the input order of participants', () => {
    const result = computeSplit(300, { method: 'equal', participantIds: ['z', 'y', 'x'] });
    expect(result.ok && result.shares.map((s) => s.memberId)).toEqual(['z', 'y', 'x']);
  });

  it('handles one paisa shared by two people', () => {
    expect(amounts(computeSplit(1, { method: 'equal', participantIds: ['a', 'b'] }))).toEqual([1, 0]);
  });
});

describe('exact split', () => {
  it('accepts amounts that add up to the total', () => {
    const result = computeSplit(10000, {
      method: 'exact',
      entries: [
        { memberId: 'a', value: 6000 },
        { memberId: 'b', value: 3000 },
        { memberId: 'c', value: 1000 },
      ],
    });
    expect(amounts(result)).toEqual([6000, 3000, 1000]);
  });

  it('reports how much is still unallocated', () => {
    const result = computeSplit(10000, {
      method: 'exact',
      entries: [
        { memberId: 'a', value: 6000 },
        { memberId: 'b', value: 3000 },
      ],
    });
    expect(errorCode(result)).toBe('AMOUNTS_MISMATCH');
    expect(!result.ok && result.error.differencePaise).toBe(1000);
  });

  it('reports over-allocation as a negative difference', () => {
    const result = computeSplit(10000, {
      method: 'exact',
      entries: [
        { memberId: 'a', value: 6000 },
        { memberId: 'b', value: 5000 },
      ],
    });
    expect(errorCode(result)).toBe('AMOUNTS_MISMATCH');
    expect(!result.ok && result.error.differencePaise).toBe(-1000);
  });

  it('rejects negative and fractional paise', () => {
    expect(
      errorCode(
        computeSplit(1000, {
          method: 'exact',
          entries: [
            { memberId: 'a', value: 1500 },
            { memberId: 'b', value: -500 },
          ],
        }),
      ),
    ).toBe('INVALID_AMOUNT');
    expect(
      errorCode(
        computeSplit(1000, {
          method: 'exact',
          entries: [
            { memberId: 'a', value: 500.5 },
            { memberId: 'b', value: 499.5 },
          ],
        }),
      ),
    ).toBe('INVALID_AMOUNT');
  });

  it('allows a participant with zero', () => {
    const result = computeSplit(1000, {
      method: 'exact',
      entries: [
        { memberId: 'a', value: 1000 },
        { memberId: 'b', value: 0 },
      ],
    });
    expect(amounts(result)).toEqual([1000, 0]);
  });
});

describe('percentage split', () => {
  it('splits 50/30/20 and places the odd paisa with the largest remainder', () => {
    const result = computeSplit(10001, {
      method: 'percent',
      entries: [
        { memberId: 'a', value: 5000 },
        { memberId: 'b', value: 3000 },
        { memberId: 'c', value: 2000 },
      ],
    });
    expect(amounts(result)).toEqual([5001, 3000, 2000]);
  });

  it('handles 33.33 / 33.33 / 33.34', () => {
    const result = computeSplit(10000, {
      method: 'percent',
      entries: [
        { memberId: 'a', value: 3333 },
        { memberId: 'b', value: 3333 },
        { memberId: 'c', value: 3334 },
      ],
    });
    expect(amounts(result)).toEqual([3333, 3333, 3334]);
  });

  it('rejects percentages that do not add up to 100%', () => {
    const result = computeSplit(10000, {
      method: 'percent',
      entries: [
        { memberId: 'a', value: 5000 },
        { memberId: 'b', value: 4000 },
      ],
    });
    expect(errorCode(result)).toBe('PERCENT_MISMATCH');
    expect(!result.ok && result.error.differenceBps).toBe(1000);
  });

  it('rejects out-of-range percentages', () => {
    expect(
      errorCode(
        computeSplit(10000, {
          method: 'percent',
          entries: [
            { memberId: 'a', value: 12000 },
            { memberId: 'b', value: -2000 },
          ],
        }),
      ),
    ).toBe('INVALID_PERCENT');
  });
});

describe('weighted shares split', () => {
  it('splits 2:1 and gives the extra paisa to the larger remainder', () => {
    const result = computeSplit(10000, {
      method: 'shares',
      entries: [
        { memberId: 'a', value: 2 },
        { memberId: 'b', value: 1 },
      ],
    });
    expect(amounts(result)).toEqual([6667, 3333]);
  });

  it('rejects zero, negative and fractional weights', () => {
    for (const bad of [0, -1, 1.5]) {
      expect(
        errorCode(
          computeSplit(1000, {
            method: 'shares',
            entries: [
              { memberId: 'a', value: bad },
              { memberId: 'b', value: 1 },
            ],
          }),
        ),
      ).toBe('INVALID_WEIGHT');
    }
  });
});

describe('validation common to all methods', () => {
  it('rejects zero, negative, fractional and oversized totals', () => {
    for (const total of [0, -100, 1.5, 1_000_000_000_001]) {
      expect(errorCode(computeSplit(total, { method: 'equal', participantIds: ['a'] }))).toBe(
        'INVALID_TOTAL',
      );
    }
  });

  it('rejects an empty participant list', () => {
    expect(errorCode(computeSplit(100, { method: 'equal', participantIds: [] }))).toBe(
      'NO_PARTICIPANTS',
    );
    expect(errorCode(computeSplit(100, { method: 'exact', entries: [] }))).toBe('NO_PARTICIPANTS');
  });

  it('rejects a person listed twice', () => {
    expect(errorCode(computeSplit(100, { method: 'equal', participantIds: ['a', 'a'] }))).toBe(
      'DUPLICATE_PARTICIPANT',
    );
  });
});

describe('every successful split reconciles exactly to the total', () => {
  it('holds for equal, percent and shares across many random cases', () => {
    let seed = 987654321;
    const next = (max: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % max;
    };
    for (let i = 0; i < 1500; i += 1) {
      const total = next(2_000_000) + 1;
      const count = next(8) + 1;
      const ids = Array.from({ length: count }, (_, k) => `m${k}`);

      const equal = computeSplit(total, { method: 'equal', participantIds: ids });
      expect(amounts(equal).reduce((a, b) => a + b, 0)).toBe(total);

      const weights = ids.map(() => next(9) + 1);
      const shares = computeSplit(total, {
        method: 'shares',
        entries: ids.map((memberId, k) => ({ memberId, value: weights[k] })),
      });
      expect(amounts(shares).reduce((a, b) => a + b, 0)).toBe(total);

      const bps = new Array<number>(count).fill(Math.floor(10000 / count));
      bps[0] += 10000 - bps.reduce((a, b) => a + b, 0);
      const percent = computeSplit(total, {
        method: 'percent',
        entries: ids.map((memberId, k) => ({ memberId, value: bps[k] })),
      });
      expect(amounts(percent).reduce((a, b) => a + b, 0)).toBe(total);
    }
  });
});
