import { z } from 'zod';

import { MAX_PAISE } from './money';

/**
 * Persisted records. Money is integer paise; dates are YYYY-MM-DD;
 * timestamps are ISO strings. The zod schemas are the single source of truth:
 * the TypeScript types are inferred from them, and every record read back from
 * storage is validated before it is used.
 */
const idSchema = z.string().min(1).max(64);
const timestampSchema = z.string().min(10).max(40);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const paiseSchema = z.number().int().min(0).max(MAX_PAISE);

export const PersonSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(60),
});
export type Person = z.infer<typeof PersonSchema>;

export const GroupSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(40),
  memberIds: z.array(idSchema).min(1).max(10),
  adminId: idSchema,
  createdAt: timestampSchema,
});
export type Group = z.infer<typeof GroupSchema>;

export const EXPENSE_CATEGORIES = [
  'food',
  'groceries',
  'shopping',
  'travel',
  'entertainment',
  'bills',
  'other',
] as const;
export const ExpenseCategorySchema = z.enum(EXPENSE_CATEGORIES);
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food',
  groceries: 'Groceries',
  shopping: 'Shopping',
  travel: 'Travel',
  entertainment: 'Fun',
  bills: 'Bills',
  other: 'Other',
};

const splitEntrySchema = z.object({ memberId: idSchema, value: z.number().int() });

export const SplitSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('equal'), participantIds: z.array(idSchema) }),
  z.object({ method: z.literal('exact'), entries: z.array(splitEntrySchema) }),
  z.object({ method: z.literal('percent'), entries: z.array(splitEntrySchema) }),
  z.object({ method: z.literal('shares'), entries: z.array(splitEntrySchema) }),
]);
export type Split = z.infer<typeof SplitSchema>;

export const SPLIT_METHOD_LABELS: Record<Split['method'], string> = {
  equal: 'Split equally',
  exact: 'Exact amounts',
  percent: 'Percentages',
  shares: 'Shares',
};

export const PayerSchema = z.object({ memberId: idSchema, paidPaise: paiseSchema });
export type Payer = z.infer<typeof PayerSchema>;

export const ShareSchema = z.object({ memberId: idSchema, amountPaise: paiseSchema });

export const ExpenseSchema = z.object({
  id: idSchema,
  groupId: idSchema,
  title: z.string().trim().min(1).max(80),
  totalPaise: paiseSchema.min(1),
  date: dateSchema,
  category: ExpenseCategorySchema,
  note: z.string().max(200).optional(),
  payers: z.array(PayerSchema).min(1),
  split: SplitSchema,
  /** Computed by the split engine and stored so history never changes silently. */
  shares: z.array(ShareSchema).min(1),
  source: z.enum(['manual', 'scan']),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  /** Soft delete: the record is kept for the audit trail but hidden everywhere. */
  deletedAt: timestampSchema.optional(),
});
export type Expense = z.infer<typeof ExpenseSchema>;

export const ActivitySchema = z.object({
  id: idSchema,
  groupId: idSchema,
  expenseId: idSchema.optional(),
  type: z.enum(['group_created', 'expense_created', 'expense_updated', 'expense_deleted']),
  summary: z.string().max(200),
  at: timestampSchema,
});
export type ActivityEvent = z.infer<typeof ActivitySchema>;
