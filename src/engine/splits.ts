import { allocateByWeights, isValidPaise } from '../domain/money';

export type SplitMethod = 'equal' | 'exact' | 'percent' | 'shares';

/** value meaning depends on the method: paise (exact), basis points (percent), weight (shares). */
export type SplitEntry = { memberId: string; value: number };

export type SplitInput =
  | { method: 'equal'; participantIds: readonly string[] }
  | { method: 'exact'; entries: readonly SplitEntry[] }
  | { method: 'percent'; entries: readonly SplitEntry[] }
  | { method: 'shares'; entries: readonly SplitEntry[] };

export type ShareLine = { memberId: string; amountPaise: number };

export type SplitErrorCode =
  | 'INVALID_TOTAL'
  | 'NO_PARTICIPANTS'
  | 'DUPLICATE_PARTICIPANT'
  | 'INVALID_AMOUNT'
  | 'AMOUNTS_MISMATCH'
  | 'INVALID_PERCENT'
  | 'PERCENT_MISMATCH'
  | 'INVALID_WEIGHT';

export type SplitError = {
  code: SplitErrorCode;
  message: string;
  /** exact: total minus the sum entered (positive = still to allocate, negative = over). */
  differencePaise?: number;
  /** percent: 100% minus the sum entered, in basis points. */
  differenceBps?: number;
};

export type SplitResult =
  | { ok: true; shares: ShareLine[] }
  | { ok: false; error: SplitError };

function fail(error: SplitError): SplitResult {
  return { ok: false, error };
}

function findDuplicate(ids: readonly string[]): string | null {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) return id;
    seen.add(id);
  }
  return null;
}

function toShares(ids: readonly string[], amounts: readonly number[]): ShareLine[] {
  return ids.map((memberId, i) => ({ memberId, amountPaise: amounts[i] }));
}

/**
 * The single entry point for splitting an expense among people.
 * Shares always add up to exactly totalPaise, in the same order as the input.
 * Extra paise go to the earliest-listed participants (equal and weighted splits).
 * Invalid input is returned as an error value; nothing is silently corrected.
 */
export function computeSplit(totalPaise: number, input: SplitInput): SplitResult {
  if (!isValidPaise(totalPaise) || totalPaise <= 0) {
    return fail({ code: 'INVALID_TOTAL', message: 'The total must be greater than zero.' });
  }

  const ids =
    input.method === 'equal' ? input.participantIds : input.entries.map((e) => e.memberId);

  if (ids.length === 0) {
    return fail({ code: 'NO_PARTICIPANTS', message: 'Choose at least one person.' });
  }
  const duplicate = findDuplicate(ids);
  if (duplicate !== null) {
    return fail({
      code: 'DUPLICATE_PARTICIPANT',
      message: 'Each person can appear only once.',
    });
  }

  switch (input.method) {
    case 'equal':
      return { ok: true, shares: toShares(ids, allocateByWeights(totalPaise, ids.map(() => 1))) };

    case 'exact': {
      let sum = 0;
      for (const entry of input.entries) {
        if (!isValidPaise(entry.value)) {
          return fail({
            code: 'INVALID_AMOUNT',
            message: 'Amounts must be zero or more, with at most two decimal places.',
          });
        }
        sum += entry.value;
      }
      if (sum !== totalPaise) {
        const differencePaise = totalPaise - sum;
        return fail({
          code: 'AMOUNTS_MISMATCH',
          message:
            differencePaise > 0
              ? 'The amounts are less than the total.'
              : 'The amounts are more than the total.',
          differencePaise,
        });
      }
      return { ok: true, shares: toShares(ids, input.entries.map((e) => e.value)) };
    }

    case 'percent': {
      let sum = 0;
      for (const entry of input.entries) {
        if (!Number.isSafeInteger(entry.value) || entry.value < 0 || entry.value > 10000) {
          return fail({
            code: 'INVALID_PERCENT',
            message: 'Percentages must be between 0 and 100.',
          });
        }
        sum += entry.value;
      }
      if (sum !== 10000) {
        return fail({
          code: 'PERCENT_MISMATCH',
          message: 'Percentages must add up to exactly 100%.',
          differenceBps: 10000 - sum,
        });
      }
      const amounts = allocateByWeights(totalPaise, input.entries.map((e) => e.value));
      return { ok: true, shares: toShares(ids, amounts) };
    }

    case 'shares': {
      for (const entry of input.entries) {
        if (!Number.isSafeInteger(entry.value) || entry.value <= 0) {
          return fail({
            code: 'INVALID_WEIGHT',
            message: 'Each share must be a whole number greater than zero.',
          });
        }
      }
      const amounts = allocateByWeights(totalPaise, input.entries.map((e) => e.value));
      return { ok: true, shares: toShares(ids, amounts) };
    }
  }
}
