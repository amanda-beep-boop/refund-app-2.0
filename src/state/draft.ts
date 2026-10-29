// The request being built, as the UI holds it while someone works on it. This is UI state, not
// something the backend sends: the selected fees, the amount and remitter entered for each, and
// where the user is in the form. It becomes a RefundRequest (src/types.ts) at submission.
import type { JustificationCode, Person, RefundMethod } from '../types';

export type AmountMode = 'full' | 'partial';

export interface AmountState {
  mode: AmountMode;
  /** What the user typed for a partial refund, in dollars ('12.34'). */
  input: string;
}

export interface RemitterState {
  name: string;
  address: string;
  method: RefundMethod;
  /** The remitter form is open. */
  editing: boolean;
  /** The user has finished the form once, so empty fields are flagged. */
  touched: boolean;
  nameTouched?: boolean;
  addressTouched?: boolean;
}

export interface Draft {
  /** The customer's ID. */
  customer: string;
  /** IDs of the fees selected for refund. */
  selected: Set<string>;
  /** IDs of lump-sum fees whose items are collapsed in Step 1. */
  collapsed: Set<string>;
  amounts: Record<string, AmountState>;
  remitters: Record<string, RemitterState>;
  justification: { code: JustificationCode | null };
  remark: string;
  /** The certification box is checked (Supervisor only). */
  certified: boolean;
  startedAt: string;
  createdBy: Person;
}
