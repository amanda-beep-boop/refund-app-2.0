// Checks that the mock data keeps the rules the real data must keep. `npm run check` runs the
// type check and then this, so a change to the data that breaks a rule fails before it ships.
// Run on its own with `node scripts/check-data.ts` (Node 22.6 or later).
//
// The rules are the ones the business stated. If a real data source can't keep one of them,
// that's a conversation to have before connecting it, not something to relax here.
import { CUSTOMERS, SEED_REQUESTS } from '../src/data/mockData.ts';
import type { Fee, RefundRequest } from '../src/types.ts';

const problems: string[] = [];
const fail = (message: string) => problems.push(message);

const feesById = new Map<string, { fee: Fee; customerId: string }>();
for (const customer of Object.values(CUSTOMERS)) {
  if (!/^C-\d+$/.test(customer.id)) fail(`${customer.id}: customer IDs are "C-" and digits.`);
  for (const fee of customer.fees) {
    if (!/^F-\d+$/.test(fee.id)) fail(`${fee.id}: fee IDs are "F-" and digits.`);
    if (feesById.has(fee.id)) fail(`${fee.id}: fee IDs are unique across customers.`);
    feesById.set(fee.id, { fee, customerId: customer.id });
    if (!Number.isInteger(fee.cents) || fee.cents <= 0) fail(`${fee.id}: a fee is a positive integer number of cents.`);
    if (fee.items) {
      const sum = fee.items.reduce((s, i) => s + i.cents, 0);
      if (sum !== fee.cents) fail(`${fee.id}: a lump sum's items add up to the fee (${sum} ≠ ${fee.cents}).`);
    }
    const moneyOrder = fee.method === 'Money order';
    if (moneyOrder && (fee.bank || fee.acct || fee.instrument)) fail(`${fee.id}: a money order has no account to return funds to.`);
    if (!moneyOrder && !(fee.bank && fee.acct && fee.instrument)) fail(`${fee.id}: an ACH or PayPal fee names its account.`);
    if (moneyOrder && fee.remitter?.method === 'original') fail(`${fee.id}: a money order can't be refunded to the original payment.`);
  }
}

const requestsByFee = new Map<string, string>();
for (const r of SEED_REQUESTS) {
  if (!/^RR-\d{4}-\d{4}$/.test(r.id)) fail(`${r.id}: request IDs are "RR-", the year and a sequence number.`);
  if (!CUSTOMERS[r.customer]) fail(`${r.id}: refers to customer ${r.customer}, which doesn't exist.`);
  if (r.submittedBy.role !== 'supervisor') fail(`${r.id}: only a Supervisor certifies and submits (certified by ${r.submittedBy.name}).`);
  if (r.requestedBy.office !== r.submittedBy.office) fail(`${r.id}: the requester and the certifier are in the same office.`);

  const total = r.fees.reduce((s, f) => s + f.refund, 0);
  if (r.total !== total) fail(`${r.id}: the total is the sum of the refunds (${r.total} ≠ ${total}).`);

  for (const f of r.fees) {
    const prior = requestsByFee.get(f.id);
    if (prior) fail(`${f.id}: a fee is in at most one request (${prior} and ${r.id}).`);
    requestsByFee.set(f.id, r.id);

    const source = feesById.get(f.id);
    if (!source) {
      fail(`${r.id}: fee ${f.id} isn't on any customer.`);
      continue;
    }
    if (source.customerId !== r.customer) fail(`${r.id}: fee ${f.id} belongs to ${source.customerId}, not ${r.customer}.`);
    // A request is a snapshot of the fee as paid, so these never differ from the source.
    for (const key of ['desc', 'date', 'cents', 'bank', 'acct', 'method', 'instrument'] as const) {
      if (source.fee[key] !== f[key]) fail(`${r.id}: fee ${f.id} ${key} differs from the system of record.`);
    }
    if (JSON.stringify(source.fee.items ?? null) !== JSON.stringify(f.items ?? null)) fail(`${r.id}: fee ${f.id} items differ from the system of record.`);
    if (!Number.isInteger(f.refund) || f.refund < 1 || f.refund > f.cents) fail(`${r.id}: fee ${f.id} refunds between $0.01 and the full fee.`);
    if (f.method === 'Money order' && f.remitter.method !== 'check') fail(`${r.id}: fee ${f.id} was paid by money order, so its refund is a check.`);
    if (f.remitterSource === 'manual' && f.recordRemitter) fail(`${r.id}: fee ${f.id} is "entered manually" but the record had a remitter.`);
    if (f.remitterSource !== 'manual' && !f.recordRemitter) fail(`${r.id}: fee ${f.id} needs the record's remitter to compare against.`);
  }

  const last = r.timeline[r.timeline.length - 1];
  if (!last) fail(`${r.id}: a submitted request has at least one timeline event.`);
  else {
    if (last.status !== r.status) fail(`${r.id}: the status is the latest timeline event's (${last.status} ≠ ${r.status}).`);
    if (last.at.slice(0, 10) !== r.statusDate) fail(`${r.id}: the status date is the date of the latest event.`);
    if (r.timeline[0]?.status !== 'submitted' || r.timeline[0]?.at !== r.submittedAt) fail(`${r.id}: the timeline starts with the submission.`);
  }

  const roles = r.notifications.map((n) => n.role);
  if (!roles.includes('Submitter') || !roles.includes('OCFO')) fail(`${r.id}: E-Note notifies the submitter and the OCFO.`);
  const differentPeople = r.requestedBy.email !== r.submittedBy.email;
  if (roles.includes('Requester') !== differentPeople) fail(`${r.id}: E-Note notifies the requester exactly when someone else submitted.`);
}

const statuses = new Set<RefundRequest['status']>(['submitted', 'review', 'approved', 'returned']);
for (const r of SEED_REQUESTS) if (!statuses.has(r.status)) fail(`${r.id}: unknown status ${r.status}.`);

if (problems.length) {
  console.error(`Data check: ${problems.length} problem${problems.length === 1 ? '' : 's'}`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`Data check: ${Object.keys(CUSTOMERS).length} customers, ${feesById.size} fees, ${SEED_REQUESTS.length} requests. All rules hold.`);
