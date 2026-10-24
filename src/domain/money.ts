/**
 * Money is always integer paise (1 rupee = 100 paise). Never use floating
 * point arithmetic on rupee values: parse text straight to paise, calculate in
 * integers, and format only for display.
 */

/** Upper bound for any single amount: ₹10,000,000,000 (keeps sums far below 2^53). */
export const MAX_PAISE = 1_000_000_000_000;

export function isValidPaise(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_PAISE
  );
}

function groupIndian(rupees: number): string {
  const digits = String(rupees);
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) parts.unshift(rest);
  return `${parts.join(',')},${last3}`;
}

/** Formats paise with Indian digit grouping, e.g. 12345600 -> "₹1,23,456". */
export function formatMoney(paise: number): string {
  const negative = paise < 0;
  const abs = Math.abs(Math.trunc(paise));
  const rupees = Math.floor(abs / 100);
  const rem = abs % 100;
  const decimals = rem === 0 ? '' : `.${String(rem).padStart(2, '0')}`;
  return `${negative ? '-' : ''}₹${groupIndian(rupees)}${decimals}`;
}

/**
 * Parses user text such as "1,234.50", "₹ 99" or "120.5" into integer paise.
 * Returns null for anything that is not a non-negative amount with at most
 * two decimal places (so "1.234", "-5", "", "abc" and "5." are all rejected).
 */
export function parseMoneyToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹\s,]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [rupeeText, fractionText = ''] = cleaned.split('.');
  if (rupeeText.length > 11) return null;
  const paise = Number(rupeeText) * 100 + Number(fractionText.padEnd(2, '0'));
  return paise <= MAX_PAISE ? paise : null;
}

/**
 * Parses "33.33" or "50%" into basis points (1 bp = 0.01%), so 33.33% -> 3333.
 * Returns null unless the value is between 0 and 100 with at most two decimals.
 */
export function parsePercentToBps(input: string): number | null {
  const cleaned = input.replace(/[%\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [wholeText, fractionText = ''] = cleaned.split('.');
  if (wholeText.length > 3) return null;
  const bps = Number(wholeText) * 100 + Number(fractionText.padEnd(2, '0'));
  return bps <= 10000 ? bps : null;
}

/** Formats basis points for display: 5000 -> "50%", 3333 -> "33.33%". */
export function formatBps(bps: number): string {
  return bps % 100 === 0 ? `${bps / 100}%` : `${(bps / 100).toFixed(2)}%`;
}

/**
 * Splits totalPaise across the given integer weights so that the parts always
 * add up to exactly totalPaise.
 *
 * Method: largest remainder. Each part gets floor(total * w / sum); the leftover
 * paise (always fewer than the number of non-zero weights) go one each to the
 * parts with the largest fractional remainder. Ties go to the lowest index, so
 * the result is fully deterministic. Zero-weight parts always receive 0.
 *
 * Uses BigInt for the intermediate product so large totals cannot lose precision.
 */
export function allocateByWeights(totalPaise: number, weights: readonly number[]): number[] {
  if (!Number.isSafeInteger(totalPaise) || totalPaise < 0) {
    throw new RangeError('totalPaise must be a non-negative safe integer');
  }
  if (weights.length === 0) {
    throw new RangeError('weights must not be empty');
  }
  const big = weights.map((weight) => {
    if (!Number.isSafeInteger(weight) || weight < 0) {
      throw new RangeError('weights must be non-negative safe integers');
    }
    return BigInt(weight);
  });
  const sum = big.reduce((a, b) => a + b, BigInt(0));
  if (sum === BigInt(0)) {
    throw new RangeError('weights must not all be zero');
  }

  const total = BigInt(totalPaise);
  const parts: number[] = [];
  const remainders: bigint[] = [];
  let assigned = 0;
  for (const weight of big) {
    const product = total * weight;
    const whole = Number(product / sum);
    parts.push(whole);
    remainders.push(product % sum);
    assigned += whole;
  }

  const leftover = totalPaise - assigned;
  const order = parts
    .map((_, index) => index)
    .sort((a, b) => {
      if (remainders[a] === remainders[b]) return a - b;
      return remainders[a] > remainders[b] ? -1 : 1;
    });
  for (let k = 0; k < leftover; k += 1) {
    parts[order[k]] += 1;
  }
  return parts;
}
