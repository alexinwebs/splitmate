import {
  MAX_PAISE,
  allocateByWeights,
  formatBps,
  formatMoney,
  isValidPaise,
  parseMoneyToPaise,
  parsePercentToBps,
} from './money';

describe('formatMoney', () => {
  it('formats whole rupees without decimals', () => {
    expect(formatMoney(0)).toBe('₹0');
    expect(formatMoney(100)).toBe('₹1');
    expect(formatMoney(42000)).toBe('₹420');
    expect(formatMoney(99900)).toBe('₹999');
  });

  it('shows two decimals when there are paise', () => {
    expect(formatMoney(150)).toBe('₹1.50');
    expect(formatMoney(7)).toBe('₹0.07');
    expect(formatMoney(12345)).toBe('₹123.45');
  });

  it('uses Indian digit grouping', () => {
    expect(formatMoney(100000)).toBe('₹1,000');
    expect(formatMoney(123000)).toBe('₹1,230');
    expect(formatMoney(12345600)).toBe('₹1,23,456');
    expect(formatMoney(123456789)).toBe('₹12,34,567.89');
    expect(formatMoney(1000000000)).toBe('₹1,00,00,000');
  });

  it('formats negatives with a leading minus', () => {
    expect(formatMoney(-5000)).toBe('-₹50');
    expect(formatMoney(-150)).toBe('-₹1.50');
  });
});

describe('isValidPaise', () => {
  it('accepts non-negative safe integers within the limit', () => {
    expect(isValidPaise(0)).toBe(true);
    expect(isValidPaise(12345)).toBe(true);
    expect(isValidPaise(MAX_PAISE)).toBe(true);
  });

  it('rejects negatives, fractions, NaN, too-large values and non-numbers', () => {
    expect(isValidPaise(-1)).toBe(false);
    expect(isValidPaise(1.5)).toBe(false);
    expect(isValidPaise(NaN)).toBe(false);
    expect(isValidPaise(Infinity)).toBe(false);
    expect(isValidPaise(MAX_PAISE + 1)).toBe(false);
    expect(isValidPaise('100')).toBe(false);
  });
});

describe('parseMoneyToPaise', () => {
  it('parses plain and decorated amounts', () => {
    expect(parseMoneyToPaise('120')).toBe(12000);
    expect(parseMoneyToPaise('120.5')).toBe(12050);
    expect(parseMoneyToPaise('120.50')).toBe(12050);
    expect(parseMoneyToPaise('1,234.50')).toBe(123450);
    expect(parseMoneyToPaise('₹ 99')).toBe(9900);
    expect(parseMoneyToPaise('0.07')).toBe(7);
    expect(parseMoneyToPaise('0')).toBe(0);
  });

  it('avoids floating-point drift', () => {
    expect(parseMoneyToPaise('0.1')).toBe(10);
    expect(parseMoneyToPaise('19.99')).toBe(1999);
    expect(parseMoneyToPaise('1.15')).toBe(115);
  });

  it('rejects invalid input', () => {
    expect(parseMoneyToPaise('')).toBeNull();
    expect(parseMoneyToPaise('abc')).toBeNull();
    expect(parseMoneyToPaise('-5')).toBeNull();
    expect(parseMoneyToPaise('1.234')).toBeNull();
    expect(parseMoneyToPaise('5.')).toBeNull();
    expect(parseMoneyToPaise('.5')).toBeNull();
    expect(parseMoneyToPaise('1e5')).toBeNull();
    expect(parseMoneyToPaise('99999999999999')).toBeNull();
  });
});

describe('parsePercentToBps and formatBps', () => {
  it('parses percentages to basis points', () => {
    expect(parsePercentToBps('50')).toBe(5000);
    expect(parsePercentToBps('33.33')).toBe(3333);
    expect(parsePercentToBps('12.5%')).toBe(1250);
    expect(parsePercentToBps('100')).toBe(10000);
    expect(parsePercentToBps('0')).toBe(0);
  });

  it('rejects out-of-range or malformed percentages', () => {
    expect(parsePercentToBps('100.01')).toBeNull();
    expect(parsePercentToBps('101')).toBeNull();
    expect(parsePercentToBps('-1')).toBeNull();
    expect(parsePercentToBps('abc')).toBeNull();
    expect(parsePercentToBps('1.234')).toBeNull();
  });

  it('formats basis points', () => {
    expect(formatBps(5000)).toBe('50%');
    expect(formatBps(3333)).toBe('33.33%');
    expect(formatBps(1250)).toBe('12.50%');
    expect(formatBps(0)).toBe('0%');
  });
});

describe('allocateByWeights', () => {
  it('gives leftover paise to the lowest index when remainders tie', () => {
    expect(allocateByWeights(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocateByWeights(1, [1, 1])).toEqual([1, 0]);
  });

  it('splits evenly when divisible', () => {
    expect(allocateByWeights(100, [1, 1, 1, 1])).toEqual([25, 25, 25, 25]);
  });

  it('gives the extra paise to the largest remainder', () => {
    expect(allocateByWeights(7, [1, 2])).toEqual([2, 5]);
    expect(allocateByWeights(10000, [2, 1])).toEqual([6667, 3333]);
  });

  it('handles zero totals and zero weights', () => {
    expect(allocateByWeights(0, [1, 2])).toEqual([0, 0]);
    expect(allocateByWeights(10, [0, 1])).toEqual([0, 10]);
    expect(allocateByWeights(10, [1, 0, 1])).toEqual([5, 0, 5]);
  });

  it('rejects invalid arguments', () => {
    expect(() => allocateByWeights(-1, [1])).toThrow(RangeError);
    expect(() => allocateByWeights(1.5, [1])).toThrow(RangeError);
    expect(() => allocateByWeights(10, [])).toThrow(RangeError);
    expect(() => allocateByWeights(10, [0, 0])).toThrow(RangeError);
    expect(() => allocateByWeights(10, [1, -1])).toThrow(RangeError);
    expect(() => allocateByWeights(10, [1, 0.5])).toThrow(RangeError);
  });

  it('always sums to the total, never goes negative, and loses no precision on big values', () => {
    let seed = 12345;
    const next = (max: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % max;
    };
    for (let i = 0; i < 2000; i += 1) {
      const total = next(5_000_000) + 1;
      const count = next(9) + 1;
      const weights = Array.from({ length: count }, () => next(1000) + 1);
      const parts = allocateByWeights(total, weights);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
      expect(parts.every((p) => p >= 0 && Number.isInteger(p))).toBe(true);
    }
    const big = allocateByWeights(MAX_PAISE, [1_000_003, 3_000_001, 7]);
    expect(big.reduce((a, b) => a + b, 0)).toBe(MAX_PAISE);
  });
});
