// The data this app displays, as the backend supplies it. This file is the contract between the
// UI and the services behind it: every screen, export and check is written against these
// shapes. When connecting real services, map their responses to these types in src/data/api.ts
// and nothing in the UI needs to change.
//
// Conventions
// - Money is an integer number of cents (never a decimal dollar amount), formatted only when
//   displayed (src/lib/format.ts).
// - Dates are ISO strings: 'YYYY-MM-DD' for a date, 'YYYY-MM-DDTHH:mm:ss' (local time) for a
//   date and time.
// - Fixed sets of values (status, role, payment method) are plain strings from the lists below.
// - Display text (fee names, item names, justification labels) is sent display-ready by the
//   source and shown as received. See "Data display" in DESIGN.md.

/** 'YYYY-MM-DD' */
export type ISODate = string;
/** 'YYYY-MM-DDTHH:mm:ss', local time */
export type ISODateTime = string;
/** An integer number of cents. */
export type Cents = number;

// ---------------------------------------------------------------------------
// People and access. The auth service supplies the signed-in user.
// ---------------------------------------------------------------------------

/** Staff can do every step except certify and submit; a Supervisor can do everything. */
export type Role = 'staff' | 'supervisor';

export interface Person {
  name: string;
  email: string;
  role: Role;
  /** The office the person belongs to. Requests and the draft are scoped to it. */
  office: string;
}

// ---------------------------------------------------------------------------
// Customers and the fees they paid, from the payment system of record.
// ---------------------------------------------------------------------------

/** How a fee was paid. A money order has no account to return funds to. */
export type PaymentMethod = 'ACH' | 'PayPal' | 'Money order';

/** Where a refund is sent: back to the instrument the fee was paid with, or a paper check. */
export type RefundMethod = 'original' | 'check';

/** Who a refund is remitted to, as held on the payment record. */
export interface Remitter {
  name: string;
  address: string;
  method: RefundMethod;
}

/** One item within a lump-sum fee. Items are informational; a lump sum is refunded as a whole. */
export interface LineItem {
  /** Display-ready name from the source. */
  desc: string;
  cents: Cents;
}

export interface Fee {
  /** 'F-' followed by digits. */
  id: string;
  /** Display-ready fee name from the source. */
  desc: string;
  /** The date the fee was paid. */
  date: ISODate;
  cents: Cents;
  method: PaymentMethod;
  /** The bank or service the fee was paid from; null for a money order. */
  bank: string | null;
  /** The masked account number or service account; null for a money order. */
  acct: string | null;
  /** The payment instrument, stated for the record ("ACH to Truist ••••4471"); null for a money order. */
  instrument: string | null;
  /** The items of a lump-sum fee; absent or null for a single fee. */
  items?: LineItem[] | null;
  /** The remitter on the payment record, or null when the record has none. */
  remitter: Remitter | null;
}

export interface Customer {
  /** 'C-' followed by digits. */
  id: string;
  name: string;
  team: string;
  position: string;
  accountOpened: ISODate;
  /** Every paid fee, including fees already in a refund request. */
  fees: Fee[];
}

// ---------------------------------------------------------------------------
// Refund requests, from the refund-request service.
// ---------------------------------------------------------------------------

/** A request's workflow status, once submitted. 'draft' exists only in the UI, for the office's draft. */
export type RequestStatus = 'submitted' | 'review' | 'approved' | 'returned';
export type Status = RequestStatus | 'draft';

/** The reasons a refund can be requested. */
export type JustificationCode = 'processing' | 'clockExpired' | 'rejected' | 'other';

export interface JustificationOption {
  value: JustificationCode;
  /** Display-ready label. */
  label: string;
  /** The business's definition of the reason; null while it is still pending. */
  definition: string | null;
}

/** Where a request's remitter came from: the payment record, edited from it, or entered by hand. */
export type RemitterSource = 'record' | 'customized' | 'manual';

/** A fee as recorded on a submitted request: a snapshot of the fee plus the refund decisions. */
export interface RequestFee {
  id: string;
  desc: string;
  date: ISODate;
  cents: Cents;
  /** The amount to refund: the full fee, or less for a partial refund. */
  refund: Cents;
  bank: string | null;
  acct: string | null;
  method: PaymentMethod;
  instrument: string | null;
  /** The items of a lump-sum fee; absent or null for a single fee. */
  items?: LineItem[] | null;
  /** Who the refund is remitted to, as submitted. */
  remitter: Remitter;
  remitterSource: RemitterSource;
  /** The remitter the payment record held at submission, for comparison; null when it had none. */
  recordRemitter: Remitter | null;
}

/** A status change, with the OCFO's note when one was left. */
export interface TimelineEvent {
  status: RequestStatus;
  at: ISODateTime;
  note?: string;
}

export type NotificationRole = 'Submitter' | 'Requester' | 'OCFO';

/** One E-Note delivery. */
export interface Notification {
  role: NotificationRole;
  name: string;
  /** The email address it was sent to. */
  to: string;
  at: ISODateTime;
}

export interface RefundRequest {
  /** 'RR-' followed by the year and a sequence number, assigned at submission. */
  id: string;
  /** The customer's ID. */
  customer: string;
  submittedAt: ISODateTime;
  status: RequestStatus;
  /** The date of the latest status change. */
  statusDate: ISODate;
  /** Who started the request (Staff or a Supervisor). */
  requestedBy: Person;
  /** The Supervisor who certified and submitted it. */
  submittedBy: Person;
  certifiedAt: ISODateTime;
  justification: {
    code: JustificationCode;
    /** The definition in force when the request was certified. Older records may lack it. */
    definition?: string | null;
  };
  /** The Requester Remark: a short summary of what is being refunded and why. */
  remark: string;
  fees: RequestFee[];
  /** The sum of the fees' refund amounts. */
  total: Cents;
  timeline: TimelineEvent[];
  notifications: Notification[];
}
