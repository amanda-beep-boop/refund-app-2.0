import { CUSTOMERS, SUBMITTER, JUSTIFICATION_DEFINITION } from '../data/mockData';
import { parseCents, dollars, fmt, methodLabel } from './format';

// Pure helpers over the draft shape:
// draft = {
//   customer: 'C-...', selected: Set<feeId>, collapsed: Set<feeId>,
//   amounts: { [feeId]: { mode: 'full'|'partial', input: '12.34' } },
//   remitters: { [feeId]: { editing, touched, name, address, method } },
//   justification: { code }, remark: string, certified: bool, startedAt: iso,
// }

export const draftCustomer = (draft) => (draft ? CUSTOMERS[draft.customer] : null);

export const selectedFees = (draft) =>
  draft ? draftCustomer(draft).fees.filter((f) => draft.selected.has(f.id)) : [];

export const initialFeeState = (fee) => ({
  amount: { mode: 'full', input: dollars(fee.cents) },
  remitter: fee.remitter
    ? {
        editing: false,
        touched: false,
        name: fee.remitter.name,
        address: fee.remitter.address,
        method: fee.remitter.method,
      }
    : { editing: true, touched: false, name: '', address: '', method: 'original' },
});

export const remitterSource = (fee, draft) => {
  const r = draft.remitters[fee.id];
  if (!fee.remitter) return 'manual';
  return r.name === fee.remitter.name &&
    r.address === fee.remitter.address &&
    r.method === fee.remitter.method
    ? 'record'
    : 'customized';
};

export const remitterValid = (fee, draft) => {
  const r = draft.remitters[fee.id];
  return Boolean(r.name.trim() && r.address.trim());
};

export const refundCents = (fee, draft) => {
  const a = draft.amounts[fee.id];
  return a.mode === 'partial' ? parseCents(a.input) : fee.cents;
};

// A partial refund starts empty and must be less than the fee; refunding all of it is "Full".
export const amountEntered = (fee, draft) => {
  const a = draft.amounts[fee.id];
  return a.mode !== 'partial' || String(a.input).trim() !== '';
};

export const amountValid = (fee, draft) => {
  const a = draft.amounts[fee.id];
  if (a.mode !== 'partial') return true;
  const c = refundCents(fee, draft);
  return Number.isInteger(c) && c >= 1 && c < fee.cents;
};

// The request a fee is already in, if any. A fee can be requested only once, so Step 1 shows
// these fees read-only. In production the backend would own this check.
export const feeRequest = (feeId, requests) =>
  requests.find((r) => r.fees.some((f) => f.id === feeId)) || null;

export const feeValid = (fee, draft) => amountValid(fee, draft) && remitterValid(fee, draft);

export const draftTotal = (draft) =>
  selectedFees(draft).reduce((s, f) => s + (amountValid(f, draft) ? refundCents(f, draft) : 0), 0);

export const justificationValid = (draft) => Boolean(draft.justification.code);

// The Requester Remark (a short summary of what is refunded and why) is required on every request.
export const remarkValid = (draft) => Boolean(draft.remark.trim());

export const step2Valid = (draft) =>
  selectedFees(draft).every((f) => feeValid(f, draft)) &&
  justificationValid(draft) &&
  remarkValid(draft);

// Notes recorded on the request document when a remitter was changed or
// entered manually. Works for both drafts (via accessor fns) and submitted
// requests (which store remitterSource/recordRemitter on each fee).
export const remitterNotes = (fees, getSource, getRecord) =>
  fees
    .map((f) => {
      const src = getSource(f);
      if (src === 'record') return null;
      if (src === 'manual')
        return {
          feeId: f.id,
          text: 'Remitter entered manually by the submitter; the payment record has no remitter on file.',
        };
      const o = getRecord(f);
      return {
        feeId: f.id,
        text: `Remitter changed from the payment record by the submitter. Record shows: ${o.name}, ${o.address}; refund method: ${methodLabel(f, o.method)}.`,
      };
    })
    .filter(Boolean);

// The request a draft would become, minus what only exists once it's sent (ID, timestamps,
// timeline, notifications). Submission builds on this, and Step 3 previews it, so what the
// analyst certifies is exactly what gets recorded.
export const draftRequest = (draft) => {
  const customer = CUSTOMERS[draft.customer];
  const fees = customer.fees
    .filter((f) => draft.selected.has(f.id))
    .map((f) => {
      const r = draft.remitters[f.id];
      return {
        id: f.id,
        desc: f.desc,
        date: f.date,
        cents: f.cents,
        refund: refundCents(f, draft),
        bank: f.bank,
        acct: f.acct,
        method: f.method,
        card: f.card,
        instrument: f.instrument,
        items: f.items || null,
        remitter: { name: r.name.trim(), address: r.address.trim(), method: r.method },
        remitterSource: remitterSource(f, draft),
        recordRemitter: f.remitter ? { ...f.remitter } : null,
      };
    });
  return {
    customer: customer.id,
    submittedBy: SUBMITTER,
    justification: {
      code: draft.justification.code,
      definition: JUSTIFICATION_DEFINITION[draft.justification.code],
    },
    remark: draft.remark.trim(),
    fees,
    total: fees.reduce((s, f) => s + f.refund, 0),
  };
};

// Wording for a submitted request's record. Shared by the request modal and its PDF so the two
// always say the same thing; stated literally, since the record is used for legal purposes.

// How a fee was paid: "Visa credit card ••••2210" for cards; otherwise the method ("ACH",
// "PayPal"). The masked number is joined with a non-breaking space so it never splits across lines.
export const paymentMethodLabel = (f) => {
  if (f.card === '—') return f.method;
  const [brand, number] = f.card.split(' ');
  return `${brand} ${f.method.toLowerCase()}\u00a0${number}`;
};

export const paidLabel = (f) => `${fmt(f.cents)} by ${paymentMethodLabel(f)}`;

export const refundMethodLabel = (f, method = f.remitter.method) =>
  `Refund method: ${methodLabel(f, method)}`;

export const refundExtentLabel = (f) => (f.refund < f.cents ? 'Partial refund' : 'Full refund');

export const deliveryLabel = (n) => `Emailed to ${n.to}`;

// Requests store the definition in force when they were certified; older records predate that,
// so they fall back to the current one. Some definitions are still pending from the business.
export const justificationDefinition = (j) =>
  j.definition ?? JUSTIFICATION_DEFINITION[j.code] ?? 'Definition to be provided.';

// Status changes and E-Note deliveries as one chronological list. Notifications sent at the same
// moment form one E-Note entry, placed right after the status change that triggered it.
export const requestActivity = (request) => {
  const events = request.timeline.map((t) => ({ ...t, kind: 'status' }));
  [...new Set(request.notifications.map((n) => n.at))].forEach((at) =>
    events.push({ kind: 'enote', at, notified: request.notifications.filter((n) => n.at === at) })
  );
  const order = { status: 0, enote: 1 };
  return events.sort((a, b) =>
    a.at < b.at ? -1 : a.at > b.at ? 1 : order[a.kind] - order[b.kind]
  );
};

export const enoteTitle = (e) =>
  `E-Note Sent ${e.notified.length} Notification${e.notified.length === 1 ? '' : 's'}`;
