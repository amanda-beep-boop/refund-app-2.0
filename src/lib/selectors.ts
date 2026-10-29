import type {
  Customer,
  Fee,
  JustificationCode,
  Notification,
  Person,
  RefundMethod,
  RefundRequest,
  RemitterSource,
  RequestFee,
  Remitter,
  TimelineEvent,
} from '../types';
import type { Draft, RemitterState } from '../state/draft';
import { customerById } from '../data/api';
import { JUSTIFICATION_DEFINITION } from '../data/mockData';
import { parseCents, dollars, fmt, methodLabel } from './format';

// Pure helpers over the draft (src/state/draft.ts) and over submitted requests (src/types.ts).

export const draftCustomer = (draft: Draft | null): Customer | null =>
  draft ? customerById(draft.customer) : null;

export const selectedFees = (draft: Draft | null): Fee[] =>
  draft ? customerById(draft.customer).fees.filter((f) => draft.selected.has(f.id)) : [];

// A money order has no account to return funds to, so its only refund method is a paper check.
export const checkOnly = (fee: Fee): boolean => fee.method === 'Money order';

export const initialFeeState = (fee: Fee) => ({
  amount: { mode: 'full' as const, input: dollars(fee.cents) },
  remitter: fee.remitter
    ? {
        editing: false,
        touched: false,
        name: fee.remitter.name,
        address: fee.remitter.address,
        method: fee.remitter.method,
      }
    : {
        editing: true,
        touched: false,
        name: '',
        address: '',
        method: checkOnly(fee) ? ('check' as const) : ('original' as const),
      },
});

export const remitterSource = (fee: Fee, draft: Draft): RemitterSource => {
  const r = draft.remitters[fee.id];
  if (!fee.remitter) return 'manual';
  return r.name === fee.remitter.name &&
    r.address === fee.remitter.address &&
    r.method === fee.remitter.method
    ? 'record'
    : 'customized';
};

export const remitterValid = (fee: Fee, draft: Draft): boolean => {
  const r = draft.remitters[fee.id];
  return Boolean(r.name.trim() && r.address.trim());
};

export const refundCents = (fee: Fee, draft: Draft): number => {
  const a = draft.amounts[fee.id];
  return a.mode === 'partial' ? parseCents(a.input) : fee.cents;
};

// A partial refund starts empty and must be less than the fee; refunding all of it is "Full".
export const amountEntered = (fee: Fee, draft: Draft): boolean => {
  const a = draft.amounts[fee.id];
  return a.mode !== 'partial' || String(a.input).trim() !== '';
};

export const amountValid = (fee: Fee, draft: Draft): boolean => {
  const a = draft.amounts[fee.id];
  if (a.mode !== 'partial') return true;
  const c = refundCents(fee, draft);
  return Number.isInteger(c) && c >= 1 && c < fee.cents;
};

// The request a fee is already in, if any. A fee can be requested only once, so Step 1 shows
// these fees read-only. In production the backend would own this check.
export const feeRequest = (feeId: string, requests: RefundRequest[]): RefundRequest | null =>
  requests.find((r) => r.fees.some((f) => f.id === feeId)) || null;

export const feeValid = (fee: Fee, draft: Draft): boolean =>
  amountValid(fee, draft) && remitterValid(fee, draft);

export const draftTotal = (draft: Draft): number =>
  selectedFees(draft).reduce((s, f) => s + (amountValid(f, draft) ? refundCents(f, draft) : 0), 0);

export const justificationValid = (draft: Draft): boolean => Boolean(draft.justification.code);

// The Requester Remark (a short summary of what is refunded and why) is required on every request.
export const remarkValid = (draft: Draft): boolean => Boolean(draft.remark.trim());

export const step2Valid = (draft: Draft): boolean =>
  selectedFees(draft).every((f) => feeValid(f, draft)) &&
  justificationValid(draft) &&
  remarkValid(draft);

export interface RemitterNote {
  feeId: string;
  text: string;
}

// Notes recorded on the request document when a remitter was changed or entered manually. Works
// for both drafts (via accessor fns) and submitted requests (which store remitterSource and
// recordRemitter on each fee).
export const remitterNotes = <F extends Fee | RequestFee>(
  fees: F[],
  getSource: (fee: F) => RemitterSource,
  getRecord: (fee: F) => Remitter | null
): RemitterNote[] =>
  fees.flatMap((f) => {
    const src = getSource(f);
    if (src === 'record') return [];
    if (src === 'manual') {
      return [
        {
          feeId: f.id,
          text: 'Remitter entered manually by the submitter; the payment record has no remitter on file.',
        },
      ];
    }
    const o = getRecord(f);
    if (!o) return [];
    return [
      {
        feeId: f.id,
        text: `Remitter changed from the payment record by the submitter. Record shows: ${o.name}, ${o.address}; refund method: ${methodLabel(f, o.method)}.`,
      },
    ];
  });

/** A request as it stands before submission: everything but what only exists once it's sent. */
export type PendingRequest = Omit<
  RefundRequest,
  'id' | 'submittedAt' | 'status' | 'statusDate' | 'certifiedAt' | 'timeline' | 'notifications'
>;

const snapshotRemitter = (r: RemitterState): Remitter => ({
  name: r.name.trim(),
  address: r.address.trim(),
  method: r.method,
});

// The request a draft would become, minus what only exists once it's sent (ID, timestamps,
// timeline, notifications). Submission builds on this, and Step 3 previews it, so what the
// Supervisor certifies is exactly what gets recorded. The requester is whoever started the draft;
// the submitter is the signed-in user who certifies it.
export const draftRequest = (draft: Draft, user: Person): PendingRequest => {
  const customer = customerById(draft.customer);
  const fees: RequestFee[] = customer.fees
    .filter((f) => draft.selected.has(f.id))
    .map((f) => ({
      id: f.id,
      desc: f.desc,
      date: f.date,
      cents: f.cents,
      refund: refundCents(f, draft),
      bank: f.bank,
      acct: f.acct,
      method: f.method,
      instrument: f.instrument,
      items: f.items ?? null,
      remitter: snapshotRemitter(draft.remitters[f.id]),
      remitterSource: remitterSource(f, draft),
      recordRemitter: f.remitter ? { ...f.remitter } : null,
    }));
  // Step 2 requires a justification before Step 3, so the code is set by the time this is
  // previewed or submitted; 'other' is the fallback that never applies in practice.
  const code: JustificationCode = draft.justification.code ?? 'other';
  return {
    customer: customer.id,
    requestedBy: draft.createdBy,
    submittedBy: user,
    justification: { code, definition: JUSTIFICATION_DEFINITION[code] },
    remark: draft.remark.trim(),
    fees,
    total: fees.reduce((s, f) => s + f.refund, 0),
  };
};

// Only a Supervisor can certify and submit to the OCFO; Staff can do every other step.
export const canSubmit = (user: Person): boolean => user.role === 'supervisor';

// --- Wording for a request's record -----------------------------------------------------
// Shared by the screens and the PDF, so they always say the same thing. Stated literally, since
// the record is used for legal purposes.

// The account a fee was paid from. Services such as PayPal are their own "bank", so only the
// account (an email address) is shown for them; a money order has no account. Numbers use
// non-breaking spaces so they never split across lines.
export const accountLine = (fee: Fee | RequestFee): string => {
  if (!fee.acct) return '';
  return fee.bank === fee.method ? fee.acct : `${fee.bank} account ${fee.acct.replace(/ /g, ' ')}`;
};

export const paidLabel = (f: Fee | RequestFee): string => `${fmt(f.cents)} by ${f.method}`;

export const refundMethodLabel = (f: RequestFee | Fee, method?: RefundMethod): string => {
  const m = method ?? ('refund' in f ? f.remitter.method : f.remitter?.method ?? 'original');
  return `Refund method: ${methodLabel(f, m)}`;
};

export const refundExtentLabel = (f: RequestFee): string =>
  f.refund < f.cents ? 'Partial refund' : 'Full refund';

export const deliveryLabel = (n: Notification): string => `Emailed to ${n.to}`;

// Requests store the definition in force when they were certified; older records predate that,
// so they fall back to the current one. Some definitions are still pending from the business.
export const justificationDefinition = (j: RefundRequest['justification']): string =>
  j.definition ?? JUSTIFICATION_DEFINITION[j.code] ?? 'Definition to be provided.';

export type StatusEvent = TimelineEvent & { kind: 'status' };
export interface EnoteEvent {
  kind: 'enote';
  at: string;
  notified: Notification[];
}
export type ActivityEvent = StatusEvent | EnoteEvent;

// Status changes and E-Note deliveries as one chronological list. Notifications sent at the same
// moment form one E-Note entry, placed right after the status change that triggered it.
export const requestActivity = (request: RefundRequest): ActivityEvent[] => {
  const events: ActivityEvent[] = request.timeline.map((t) => ({ ...t, kind: 'status' as const }));
  [...new Set(request.notifications.map((n) => n.at))].forEach((at) =>
    events.push({ kind: 'enote', at, notified: request.notifications.filter((n) => n.at === at) })
  );
  const order = { status: 0, enote: 1 };
  return events.sort((a, b) =>
    a.at < b.at ? -1 : a.at > b.at ? 1 : order[a.kind] - order[b.kind]
  );
};

export const enoteTitle = (e: { notified: Notification[] }): string =>
  `E-Note Sent ${e.notified.length} Notification${e.notified.length === 1 ? '' : 's'}`;
