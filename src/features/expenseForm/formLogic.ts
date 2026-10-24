import { addDaysIso, isValidIsoDate, todayIso } from '../../domain/date';
import type { Expense, ExpenseCategory, Group, Split } from '../../domain/models';
import { parseMoneyToPaise, parsePercentToBps } from '../../domain/money';
import type { ShareLine } from '../../engine/splits';
import { buildExpense, type ExpenseDraft } from '../../services/expenses';

export type FormMethod = Split['method'];

/** Everything the Add/Edit Expense form holds. Inputs stay as text until evaluated. */
export type FormState = {
  groupId: string;
  title: string;
  amountText: string;
  dateText: string;
  category: ExpenseCategory;
  note: string;
  payerId: string;
  method: FormMethod;
  participantIds: string[];
  exactText: Record<string, string>;
  percentText: Record<string, string>;
  sharesText: Record<string, string>;
};

export type FormErrors = {
  title?: string;
  amount?: string;
  date?: string;
  payer?: string;
  participants?: string;
  split?: string;
  note?: string;
  /** Per-person problems, keyed by member id. */
  members: Record<string, string>;
};

export type FormProgress =
  | { kind: 'amount'; allocatedPaise: number; remainingPaise: number }
  | { kind: 'percent'; allocatedBps: number; remainingBps: number };

export type FormEvaluation = {
  /** Present only when the whole form is valid and ready to save. */
  draft: ExpenseDraft | null;
  isValid: boolean;
  errors: FormErrors;
  /** Each person's computed share (from the split engine) when the split is valid. */
  preview: ShareLine[] | null;
  /** Running total for exact/percent splits: how much is still unassigned. */
  progress: FormProgress | null;
  /** The one person whose empty field is being completed with the remainder, if any. */
  autoFill: AutoFill;
};

/** A suggested value for the single empty field of an exact or percent split. */
export type AutoFill = { memberId: string; text: string } | null;

/** Plain decimal text for an integer count of hundredths: 12050 -> "120.5", 5000 -> "50". */
export function toDecimalText(hundredths: number): string {
  const whole = Math.floor(hundredths / 100);
  const rem = hundredths % 100;
  if (rem === 0) return String(whole);
  return `${whole}.${String(rem).padStart(2, '0').replace(/0$/, '')}`;
}

function defaultPayer(group: Group, meId: string): string {
  return group.memberIds.includes(meId) ? meId : group.memberIds[0];
}

export function initialFormState(group: Group, meId: string, today: string = todayIso()): FormState {
  return {
    groupId: group.id,
    title: '',
    amountText: '',
    dateText: today,
    category: 'food',
    note: '',
    payerId: defaultPayer(group, meId),
    method: 'equal',
    participantIds: [...group.memberIds],
    exactText: {},
    percentText: {},
    sharesText: {},
  };
}

/** Switching group keeps what was typed but resets everything tied to the old members. */
export function changeGroup(state: FormState, group: Group, meId: string): FormState {
  return {
    ...state,
    groupId: group.id,
    payerId: defaultPayer(group, meId),
    participantIds: [...group.memberIds],
    exactText: {},
    percentText: {},
    sharesText: {},
  };
}

export function toggleParticipant(state: FormState, memberId: string): FormState {
  const has = state.participantIds.includes(memberId);
  return {
    ...state,
    participantIds: has
      ? state.participantIds.filter((id) => id !== memberId)
      : [...state.participantIds, memberId],
  };
}

export function setAllParticipants(state: FormState, group: Group, all: boolean): FormState {
  return { ...state, participantIds: all ? [...group.memberIds] : [] };
}

/**
 * Loads an existing expense into the form. Returns null when the expense has
 * several payers, which this form cannot represent yet (it would silently
 * merge them).
 */
export function formStateFromExpense(expense: Expense): FormState | null {
  if (expense.payers.length !== 1) return null;
  const state: FormState = {
    groupId: expense.groupId,
    title: expense.title,
    amountText: toDecimalText(expense.totalPaise),
    dateText: expense.date,
    category: expense.category,
    note: expense.note ?? '',
    payerId: expense.payers[0].memberId,
    method: expense.split.method,
    participantIds:
      expense.split.method === 'equal'
        ? [...expense.split.participantIds]
        : expense.split.entries.map((e) => e.memberId),
    exactText: {},
    percentText: {},
    sharesText: {},
  };
  if (expense.split.method === 'exact') {
    for (const e of expense.split.entries) state.exactText[e.memberId] = toDecimalText(e.value);
  } else if (expense.split.method === 'percent') {
    for (const e of expense.split.entries) state.percentText[e.memberId] = toDecimalText(e.value);
  } else if (expense.split.method === 'shares') {
    for (const e of expense.split.entries) state.sharesText[e.memberId] = String(e.value);
  }
  return state;
}

/**
 * For exact and percent splits: when exactly one chosen person has an empty
 * field and everyone else's is a valid number, that person is suggested the
 * remainder (what is left of the total, or of 100%). The suggestion is derived,
 * never stored, so it follows the other fields as they change and disappears
 * as soon as the person types their own value (even 0).
 */
export function computeAutoFill(state: FormState, group: Group): AutoFill {
  if (state.method !== 'exact' && state.method !== 'percent') return null;
  const ids = group.memberIds.filter((id) => state.participantIds.includes(id));
  const texts = state.method === 'exact' ? state.exactText : state.percentText;
  const empty = ids.filter((id) => (texts[id] ?? '').trim().length === 0);
  if (empty.length !== 1) return null;

  let allocated = 0;
  for (const id of ids) {
    if (id === empty[0]) continue;
    const text = (texts[id] ?? '').trim();
    const value = state.method === 'exact' ? parseMoneyToPaise(text) : parsePercentToBps(text);
    if (value === null) return null;
    allocated += value;
  }

  let remaining: number;
  if (state.method === 'exact') {
    const total = parseMoneyToPaise(state.amountText.trim());
    if (total === null || total <= 0) return null;
    remaining = total - allocated;
  } else {
    remaining = 10000 - allocated;
  }
  return remaining > 0 ? { memberId: empty[0], text: toDecimalText(remaining) } : null;
}

const PREVIEW_TIMESTAMP = '2000-01-01T00:00:00.000Z';

/**
 * Turns the form's text into a validated draft. Pure and deterministic, so the
 * screen only renders the result. Nothing is auto-corrected: every problem is
 * reported against the field that caused it.
 */
export function evaluateForm(state: FormState, group: Group): FormEvaluation {
  const errors: FormErrors = { members: {} };

  const title = state.title.trim();
  if (title.length === 0) errors.title = 'Enter a description.';
  else if (title.length > 80) errors.title = 'Keep the description under 80 characters.';

  const amountInput = state.amountText.trim();
  const totalPaise = parseMoneyToPaise(amountInput);
  if (amountInput.length === 0) errors.amount = 'Enter the amount.';
  else if (totalPaise === null) errors.amount = 'Enter a valid amount, like 450 or 450.50.';
  else if (totalPaise === 0) errors.amount = 'The amount must be greater than zero.';

  const date = state.dateText.trim();
  if (!isValidIsoDate(date)) errors.date = 'Use the format YYYY-MM-DD.';

  if (!group.memberIds.includes(state.payerId)) errors.payer = 'Choose who paid.';

  if (state.note.trim().length > 200) errors.note = 'Keep the note under 200 characters.';

  // Participants always follow the group's member order, so extra paise land deterministically.
  const participantIds = group.memberIds.filter((id) => state.participantIds.includes(id));
  if (participantIds.length === 0) errors.participants = 'Choose at least one person.';

  const autoFill = computeAutoFill(state, group);
  let split: Split | null = null;
  let progress: FormProgress | null = null;

  if (participantIds.length > 0) {
    if (state.method === 'equal') {
      split = { method: 'equal', participantIds };
    } else if (state.method === 'exact') {
      const entries: { memberId: string; value: number }[] = [];
      let allocated = 0;
      let clean = true;
      for (const id of participantIds) {
        const typed = (state.exactText[id] ?? '').trim();
        const text = typed.length === 0 && autoFill?.memberId === id ? autoFill.text : typed;
        if (text.length === 0) {
          entries.push({ memberId: id, value: 0 });
          continue;
        }
        const value = parseMoneyToPaise(text);
        if (value === null) {
          errors.members[id] = 'Enter a valid amount.';
          clean = false;
          continue;
        }
        entries.push({ memberId: id, value });
        allocated += value;
      }
      if (clean) split = { method: 'exact', entries };
      if (totalPaise !== null && totalPaise > 0) {
        progress = { kind: 'amount', allocatedPaise: allocated, remainingPaise: totalPaise - allocated };
      }
    } else if (state.method === 'percent') {
      const entries: { memberId: string; value: number }[] = [];
      let allocated = 0;
      let clean = true;
      for (const id of participantIds) {
        const typed = (state.percentText[id] ?? '').trim();
        const text = typed.length === 0 && autoFill?.memberId === id ? autoFill.text : typed;
        if (text.length === 0) {
          entries.push({ memberId: id, value: 0 });
          continue;
        }
        const value = parsePercentToBps(text);
        if (value === null) {
          errors.members[id] = 'Enter 0 to 100, up to two decimals.';
          clean = false;
          continue;
        }
        entries.push({ memberId: id, value });
        allocated += value;
      }
      if (clean) split = { method: 'percent', entries };
      progress = { kind: 'percent', allocatedBps: allocated, remainingBps: 10000 - allocated };
    } else {
      const entries: { memberId: string; value: number }[] = [];
      let clean = true;
      for (const id of participantIds) {
        const text = (state.sharesText[id] ?? '1').trim();
        if (!/^\d{1,6}$/.test(text) || Number(text) <= 0) {
          errors.members[id] = 'Whole number above 0.';
          clean = false;
          continue;
        }
        entries.push({ memberId: id, value: Number(text) });
      }
      if (clean) split = { method: 'shares', entries };
    }
  }

  let draft: ExpenseDraft | null = null;
  let preview: ShareLine[] | null = null;

  const hasFieldErrors =
    errors.title !== undefined ||
    errors.amount !== undefined ||
    errors.date !== undefined ||
    errors.payer !== undefined ||
    errors.note !== undefined ||
    errors.participants !== undefined ||
    Object.keys(errors.members).length > 0;

  if (!hasFieldErrors && split !== null && totalPaise !== null) {
    const note = state.note.trim();
    const candidate: ExpenseDraft = {
      groupId: group.id,
      title,
      totalPaise,
      date,
      category: state.category,
      note: note.length > 0 ? note : undefined,
      payers: [{ memberId: state.payerId, paidPaise: totalPaise }],
      split,
    };
    const built = buildExpense(candidate, group, { id: 'preview', now: PREVIEW_TIMESTAMP });
    if (built.ok) {
      draft = candidate;
      preview = built.expense.shares;
    } else if (built.error.field === 'title') errors.title = built.error.message;
    else if (built.error.field === 'total') errors.amount = built.error.message;
    else if (built.error.field === 'date') errors.date = built.error.message;
    else if (built.error.field === 'payers') errors.payer = built.error.message;
    else if (built.error.field === 'other') errors.note = built.error.message;
    else errors.split = built.error.message;
  }

  return { draft, isValid: draft !== null, errors, preview, progress, autoFill };
}

export const QUICK_DATES = {
  today: (now: Date = new Date()): string => todayIso(now),
  yesterday: (now: Date = new Date()): string => addDaysIso(todayIso(now), -1),
};
