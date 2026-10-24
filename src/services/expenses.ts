import { isValidIsoDate } from '../domain/date';
import { ExpenseSchema, type Expense, type ExpenseCategory, type Group, type Payer, type Split } from '../domain/models';
import { isValidPaise } from '../domain/money';
import { computeSplit } from '../engine/splits';

export type ExpenseDraft = {
  groupId: string;
  title: string;
  totalPaise: number;
  date: string;
  category: ExpenseCategory;
  note?: string;
  payers: Payer[];
  split: Split;
};

export type DraftErrorField = 'group' | 'title' | 'total' | 'date' | 'payers' | 'split' | 'other';

export type DraftError = {
  field: DraftErrorField;
  code: string;
  message: string;
  differencePaise?: number;
  differenceBps?: number;
};

export type BuildResult = { ok: true; expense: Expense } | { ok: false; error: DraftError };

export type BuildMeta = {
  id: string;
  /** ISO timestamp used for createdAt/updatedAt. */
  now: string;
  source?: 'manual' | 'scan';
  /** When editing: keeps id, createdAt and source of the original. */
  existing?: Expense;
};

function fail(field: DraftErrorField, code: string, message: string): BuildResult {
  return { ok: false, error: { field, code, message } };
}

export function splitParticipantIds(split: Split): string[] {
  return split.method === 'equal' ? [...split.participantIds] : split.entries.map((e) => e.memberId);
}

/**
 * Validates a draft and computes the stored expense, including every member's
 * share via the single split engine. Nothing is auto-corrected: any problem is
 * returned as an error naming the field that caused it.
 */
export function buildExpense(draft: ExpenseDraft, group: Group, meta: BuildMeta): BuildResult {
  if (draft.groupId !== group.id) {
    return fail('group', 'GROUP_MISMATCH', 'Choose a valid group.');
  }

  const title = draft.title.trim();
  if (title.length === 0) return fail('title', 'TITLE_REQUIRED', 'Enter a description.');
  if (title.length > 80) return fail('title', 'TITLE_TOO_LONG', 'Keep the description under 80 characters.');

  if (!isValidPaise(draft.totalPaise) || draft.totalPaise <= 0) {
    return fail('total', 'INVALID_TOTAL', 'Enter an amount greater than zero.');
  }

  if (!isValidIsoDate(draft.date)) {
    return fail('date', 'INVALID_DATE', 'Enter a valid date as YYYY-MM-DD.');
  }

  const members = new Set(group.memberIds);

  if (draft.payers.length === 0) return fail('payers', 'NO_PAYER', 'Choose who paid.');
  const payerIds = new Set<string>();
  let paidSum = 0;
  for (const payer of draft.payers) {
    if (!members.has(payer.memberId)) {
      return fail('payers', 'PAYER_NOT_IN_GROUP', 'The person who paid must be in the group.');
    }
    if (payerIds.has(payer.memberId)) {
      return fail('payers', 'DUPLICATE_PAYER', 'Each payer can appear only once.');
    }
    payerIds.add(payer.memberId);
    if (!isValidPaise(payer.paidPaise) || payer.paidPaise <= 0) {
      return fail('payers', 'INVALID_PAID_AMOUNT', 'Each payer must have paid more than zero.');
    }
    paidSum += payer.paidPaise;
  }
  if (paidSum !== draft.totalPaise) {
    const differencePaise = draft.totalPaise - paidSum;
    return {
      ok: false,
      error: {
        field: 'payers',
        code: 'PAYERS_MISMATCH',
        message: 'The amounts paid must add up to the total.',
        differencePaise,
      },
    };
  }

  for (const id of splitParticipantIds(draft.split)) {
    if (!members.has(id)) {
      return fail('split', 'PARTICIPANT_NOT_IN_GROUP', 'Everyone in the split must be in the group.');
    }
  }

  const split = computeSplit(draft.totalPaise, draft.split);
  if (!split.ok) {
    return { ok: false, error: { field: 'split', ...split.error } };
  }

  const note = draft.note?.trim();
  if (note && note.length > 200) return fail('other', 'NOTE_TOO_LONG', 'Keep the note under 200 characters.');

  const candidate: Expense = {
    id: meta.existing?.id ?? meta.id,
    groupId: group.id,
    title,
    totalPaise: draft.totalPaise,
    date: draft.date,
    category: draft.category,
    note: note ? note : undefined,
    payers: draft.payers.map((p) => ({ memberId: p.memberId, paidPaise: p.paidPaise })),
    split: draft.split,
    shares: split.shares,
    source: meta.existing?.source ?? meta.source ?? 'manual',
    createdAt: meta.existing?.createdAt ?? meta.now,
    updatedAt: meta.now,
  };

  const checked = ExpenseSchema.safeParse(candidate);
  if (!checked.success) return fail('other', 'INVALID_RECORD', 'This expense could not be saved.');
  return { ok: true, expense: checked.data };
}
