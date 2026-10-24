/**
 * Phase 2 view models. These are intentionally simple and are replaced by the
 * real persisted domain models (integer paise, ledger) in Phase 3.
 * All money values are integer paise.
 */
export type BillStatus = 'settled' | 'pending';
export type BillCategory = 'food' | 'shopping' | 'grocery' | 'other';

export type Group = {
  id: string;
  name: string;
  adminName: string;
  memberNames: string[];
  billsSplit: number;
  totalSettledPaise: number;
};

export type Bill = {
  id: string;
  title: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  groupName: string;
  totalPaise: number;
  status: BillStatus;
  category: BillCategory;
  memberNames: string[];
  /** Pre-formatted sample strings until the ledger exists (Phase 7). */
  youLine: string;
  subLine: string;
  youOwe: boolean;
};
