// ---------------------------------------------------------------------------
// Mock data. In the real feature all of this comes from the backend:
// customers + fees from the payment system of record, requests from the
// refund-request service. Amounts are integer cents.
// ---------------------------------------------------------------------------

// The signed-in user. The history table lists every request from their office, so some
// seed requests are submitted by colleagues.
export const SUBMITTER = { name: 'Jordan Ellis', email: 'jordan.ellis@agency.example' };
const COLLEAGUES = {
  okafor: { name: 'Danielle Okafor', email: 'danielle.okafor@agency.example' },
  lindqvist: { name: 'Marcus Lindqvist', email: 'marcus.lindqvist@agency.example' },
};
export const OCFO = { name: 'OCFO Refund Review', email: 'refunds@ocfo.example' };

// Reasons an analyst can give for a refund. Definitions for the first three are pending from the
// business (null until then). A request stores the definition in force when it was certified, so
// later edits here don't rewrite old records.
export const JUSTIFICATIONS = [
  { value: 'processing', label: 'Processing Error', definition: null },
  { value: 'clockExpired', label: 'Clock Expired', definition: null },
  { value: 'rejected', label: 'Case Rejected', definition: null },
  {
    value: 'other',
    label: 'Other',
    definition:
      'A reason not covered by the standard justifications. The submitter explains it in their own words.',
  },
];

export const JUSTIFICATION_LABEL = Object.fromEntries(
  JUSTIFICATIONS.map((j) => [j.value, j.label])
);

export const JUSTIFICATION_DEFINITION = Object.fromEntries(
  JUSTIFICATIONS.map((j) => [j.value, j.definition])
);

// Each fee carries its own remitter from the payment record (or null when the
// record has none). remitter.method: "original" = refund to the instrument the
// fee was paid with; "check" = paper check to the address.
// Every paid fee is listed. Fees already in a request (see SEED_REQUESTS) show in Step 1 as
// read-only, so the analyst can see they were requested but can't request them again.
export const CUSTOMERS = {
  'C-104822': {
    id: 'C-104822',
    name: 'Marisol Ortega',
    team: 'Metro Transit Authority',
    position: 'Procurement Manager',
    accountOpened: '2019-03-14',
    fees: [
      {
        id: 'F-87455',
        desc: 'Inspection rescheduling fee',
        date: '2026-05-14',
        cents: 22000,
        bank: 'Truist',
        acct: '••••4471',
        method: 'ACH',
        card: '—',
        instrument: 'ACH to Truist ••••4471',
        remitter: {
          name: 'Metro Transit Authority – Accounts Payable',
          address: '600 Fifth St NW, Washington, DC 20001',
          method: 'original',
        },
      },
      {
        id: 'F-88012',
        desc: 'Annual filing fee',
        date: '2026-07-02',
        cents: 45000,
        bank: 'Truist',
        acct: '••••4471',
        method: 'ACH',
        card: '—',
        instrument: 'ACH to Truist ••••4471',
        remitter: {
          name: 'Metro Transit Authority – Accounts Payable',
          address: '600 Fifth St NW, Washington, DC 20001',
          method: 'original',
        },
      },
      {
        id: 'F-87990',
        desc: 'Expedited review fee',
        date: '2026-07-08',
        cents: 18000,
        bank: 'Truist',
        acct: '••••4471',
        method: 'ACH',
        card: '—',
        instrument: 'ACH to Truist ••••4471',
        remitter: {
          name: 'Metro Transit Authority – Accounts Payable',
          address: '600 Fifth St NW, Washington, DC 20001',
          method: 'original',
        },
      },
      {
        id: 'F-88107',
        desc: 'Late processing surcharge',
        date: '2026-07-19',
        cents: 7500,
        bank: 'Truist',
        acct: '••••4471',
        method: 'Credit card',
        card: 'Visa ••••2210',
        instrument: 'Visa ••••2210',
        remitter: {
          name: 'Marisol Ortega',
          address: '1400 Wilson Blvd, Suite 610, Arlington, VA 22209',
          method: 'original',
        },
      },
      {
        id: 'F-88230',
        desc: 'Q3 permit bundle',
        date: '2026-08-05',
        cents: 124000,
        bank: 'PayPal',
        acct: 'm.ortega@mta.example',
        method: 'PayPal',
        card: '—',
        instrument: 'PayPal (m.ortega@mta.example)',
        items: [
          { desc: 'Vehicle permit renewal ×4', cents: 80000 },
          { desc: 'Inspection scheduling fee', cents: 24000 },
          { desc: 'Expedite fee', cents: 20000 },
        ],
        remitter: {
          name: 'Marisol Ortega',
          address: '1400 Wilson Blvd, Suite 610, Arlington, VA 22209',
          method: 'original',
        },
      },
      {
        id: 'F-88311',
        desc: 'Duplicate certificate fee',
        date: '2026-08-22',
        cents: 3500,
        bank: 'Capital One',
        acct: '••••9083',
        method: 'Debit card',
        card: 'Mastercard ••••7745',
        instrument: 'Mastercard ••••7745',
        remitter: null,
      },
    ],
  },
  'C-220917': {
    id: 'C-220917',
    name: 'Devin Achterberg',
    team: 'Parks & Recreation',
    position: 'Facilities Coordinator',
    accountOpened: '2023-11-01',
    fees: [
      {
        id: 'F-89870',
        desc: 'Field reservation deposit (spring)',
        date: '2026-04-02',
        cents: 30000,
        bank: 'Navy Federal',
        acct: '••••1120',
        method: 'ACH',
        card: '—',
        instrument: 'ACH to Navy Federal ••••1120',
        remitter: {
          name: 'Devin Achterberg',
          address: '2100 Clarendon Blvd, Arlington, VA 22201',
          method: 'original',
        },
      },
      {
        id: 'F-90411',
        desc: 'Field reservation deposit',
        date: '2026-06-11',
        cents: 30000,
        bank: 'Navy Federal',
        acct: '••••1120',
        method: 'ACH',
        card: '—',
        instrument: 'ACH to Navy Federal ••••1120',
        remitter: {
          name: 'Devin Achterberg',
          address: '2100 Clarendon Blvd, Arlington, VA 22201',
          method: 'original',
        },
      },
      {
        id: 'F-90520',
        desc: 'Shared event costs',
        date: '2026-06-28',
        cents: 51250,
        bank: 'Splitwise',
        acct: 'd.achterberg',
        method: 'Splitwise',
        card: '—',
        instrument: 'Splitwise (d.achterberg)',
        items: [
          { desc: 'Tent rental share', cents: 21250 },
          { desc: 'Portable restroom share', cents: 18000 },
          { desc: 'Cleanup crew share', cents: 12000 },
        ],
        remitter: {
          name: 'Devin Achterberg',
          address: '2100 Clarendon Blvd, Arlington, VA 22201',
          method: 'original',
        },
      },
      {
        id: 'F-89901',
        desc: 'Vendor badge fee',
        date: '2026-06-30',
        cents: 14500,
        bank: 'Navy Federal',
        acct: '••••1120',
        method: 'Debit card',
        card: 'Visa ••••0417',
        instrument: 'Visa ••••0417',
        remitter: {
          name: 'Devin Achterberg',
          address: '2100 Clarendon Blvd, Arlington, VA 22201',
          method: 'original',
        },
      },
      {
        id: 'F-90588',
        desc: 'Key deposit',
        date: '2026-08-01',
        cents: 6000,
        bank: 'Navy Federal',
        acct: '••••1120',
        method: 'ACH',
        card: '—',
        instrument: 'ACH to Navy Federal ••••1120',
        remitter: {
          name: 'Devin Achterberg',
          address: '2100 Clarendon Blvd, Arlington, VA 22201',
          method: 'original',
        },
      },
    ],
  },
  'C-301550': {
    id: 'C-301550',
    name: 'Priya Raman',
    team: 'Office of Housing',
    position: 'Grants Analyst',
    accountOpened: '2024-05-20',
    fees: [
      {
        id: 'F-90877',
        desc: 'Application processing fee (2025 cycle)',
        date: '2026-05-15',
        cents: 12000,
        bank: 'Wells Fargo',
        acct: '••••3391',
        method: 'Credit card',
        card: 'Amex ••••1009',
        instrument: 'Amex ••••1009',
        remitter: null,
      },
      {
        id: 'F-91002',
        desc: 'Application processing fee',
        date: '2026-09-03',
        cents: 12000,
        bank: 'Wells Fargo',
        acct: '••••3391',
        method: 'Credit card',
        card: 'Amex ••••1009',
        instrument: 'Amex ••••1009',
        remitter: {
          name: 'Priya Raman',
          address: '3500 Fairfax Dr, Arlington, VA 22203',
          method: 'original',
        },
      },
    ],
  },
};

const R = (name, address, method) => ({ name, address, method: method || 'original' });

// E-Note notifies the submitter and the OCFO when a request is submitted. Remitters are never
// notified: they don't interact with this application.
export const buildNotifications = (at, submitter = SUBMITTER) => [
  { role: 'Submitter', name: submitter.name, to: submitter.email, at },
  { role: 'OCFO', name: OCFO.name, to: OCFO.email, at },
];

export const SEED_REQUESTS = [
  {
    id: 'RR-2026-0142',
    customer: 'C-220917',
    submittedAt: '2026-06-18T10:14:00',
    status: 'approved',
    statusDate: '2026-07-09',
    submittedBy: SUBMITTER,
    certifiedAt: '2026-06-18T10:14:00',
    justification: { code: 'rejected' },
    remark:
      'Refund of the $300.00 spring field reservation deposit. The reservation case was rejected, so the deposit is returned in full.',
    fees: [
      {
        id: 'F-89870',
        desc: 'Field reservation deposit (spring)',
        date: '2026-04-02',
        cents: 30000,
        refund: 30000,
        bank: 'Navy Federal',
        acct: '••••1120',
        method: 'ACH',
        card: '—',
        instrument: 'ACH to Navy Federal ••••1120',
        remitter: R(
          'Devin Achterberg',
          '2100 Clarendon Blvd, Arlington, VA 22201',
          'original'
        ),
        remitterSource: 'record',
        recordRemitter: null,
      },
    ],
    timeline: [
      { status: 'submitted', at: '2026-06-18T10:14:00' },
      { status: 'review', at: '2026-06-20T09:30:00' },
      { status: 'approved', at: '2026-07-09T15:02:00' },
    ],
    notifications: buildNotifications('2026-06-18T10:14:00'),
  },
  {
    id: 'RR-2026-0151',
    customer: 'C-104822',
    submittedAt: '2026-07-01T15:40:00',
    status: 'approved',
    statusDate: '2026-07-22',
    submittedBy: COLLEAGUES.okafor,
    certifiedAt: '2026-07-01T15:40:00',
    justification: { code: 'processing' },
    remark:
      'Refund of the $220.00 inspection rescheduling fee, charged in error when staff moved the inspection.',
    fees: [
      {
        id: 'F-87455',
        desc: 'Inspection rescheduling fee',
        date: '2026-05-14',
        cents: 22000,
        refund: 22000,
        bank: 'Truist',
        acct: '••••4471',
        method: 'ACH',
        card: '—',
        instrument: 'ACH to Truist ••••4471',
        remitter: R(
          'Metro Transit Authority – Accounts Payable',
          '600 Fifth St NW, Washington, DC 20001',
          'original'
        ),
        remitterSource: 'record',
        recordRemitter: null,
      },
    ],
    timeline: [
      { status: 'submitted', at: '2026-07-01T15:40:00' },
      { status: 'review', at: '2026-07-03T11:12:00' },
      { status: 'approved', at: '2026-07-22T16:45:00' },
    ],
    notifications: buildNotifications('2026-07-01T15:40:00', COLLEAGUES.okafor),
  },
  {
    id: 'RR-2026-0169',
    customer: 'C-220917',
    submittedAt: '2026-07-24T09:02:00',
    status: 'review',
    statusDate: '2026-07-28',
    submittedBy: SUBMITTER,
    certifiedAt: '2026-07-24T09:02:00',
    justification: { code: 'processing' },
    remark:
      'Partial refund of $95.00 of the $145.00 vendor badge fee. The fee was keyed at the wrong rate; only the overcharge is refunded.',
    fees: [
      {
        id: 'F-89901',
        desc: 'Vendor badge fee',
        date: '2026-06-30',
        cents: 14500,
        refund: 9500,
        bank: 'Navy Federal',
        acct: '••••1120',
        method: 'Debit card',
        card: 'Visa ••••0417',
        instrument: 'Visa ••••0417',
        remitter: R(
          'Devin Achterberg',
          '2100 Clarendon Blvd, Arlington, VA 22201',
          'original'
        ),
        remitterSource: 'record',
        recordRemitter: null,
      },
    ],
    timeline: [
      { status: 'submitted', at: '2026-07-24T09:02:00' },
      { status: 'review', at: '2026-07-28T13:20:00' },
    ],
    notifications: buildNotifications('2026-07-24T09:02:00'),
  },
  {
    id: 'RR-2026-0187',
    customer: 'C-104822',
    submittedAt: '2026-08-11T14:22:00',
    status: 'review',
    statusDate: '2026-08-14',
    submittedBy: COLLEAGUES.lindqvist,
    certifiedAt: '2026-08-11T14:22:00',
    justification: { code: 'clockExpired' },
    remark:
      'Refund of the $180.00 expedited review fee. The expedited review clock expired before the review was completed.',
    fees: [
      {
        id: 'F-87990',
        desc: 'Expedited review fee',
        date: '2026-07-08',
        cents: 18000,
        refund: 18000,
        bank: 'Truist',
        acct: '••••4471',
        method: 'ACH',
        card: '—',
        instrument: 'ACH to Truist ••••4471',
        remitter: R(
          'Marisol Ortega',
          '1400 Wilson Blvd, Suite 610, Arlington, VA 22209',
          'check'
        ),
        remitterSource: 'customized',
        recordRemitter: R(
          'Metro Transit Authority – Accounts Payable',
          '600 Fifth St NW, Washington, DC 20001',
          'original'
        ),
      },
    ],
    timeline: [
      { status: 'submitted', at: '2026-08-11T14:22:00' },
      { status: 'review', at: '2026-08-14T09:05:00' },
    ],
    notifications: buildNotifications('2026-08-11T14:22:00', COLLEAGUES.lindqvist),
  },
  {
    id: 'RR-2026-0203',
    customer: 'C-301550',
    submittedAt: '2026-09-02T11:30:00',
    status: 'returned',
    statusDate: '2026-09-10',
    submittedBy: COLLEAGUES.okafor,
    certifiedAt: '2026-09-02T11:30:00',
    justification: { code: 'other' },
    remark:
      'Refund of the $120.00 application processing fee. The applicant withdrew before the application was reviewed; the fee is refundable under §4.2 of the program rules.',
    fees: [
      {
        id: 'F-90877',
        desc: 'Application processing fee (2025 cycle)',
        date: '2026-05-15',
        cents: 12000,
        refund: 12000,
        bank: 'Wells Fargo',
        acct: '••••3391',
        method: 'Credit card',
        card: 'Amex ••••1009',
        instrument: 'Amex ••••1009',
        remitter: R('Priya Raman', '3500 Fairfax Dr, Arlington, VA 22203', 'original'),
        remitterSource: 'manual',
        recordRemitter: null,
      },
    ],
    timeline: [
      { status: 'submitted', at: '2026-09-02T11:30:00' },
      { status: 'review', at: '2026-09-04T10:00:00' },
      {
        status: 'returned',
        at: '2026-09-10T16:18:00',
        note:
          'The remitter address on this request (3500 Fairfax Dr, Arlington, VA 22203) does not match the W-9 we have on file for Priya Raman, which lists a Falls Church address dated March 2026. We can’t issue a refund to an address that differs from the W-9 without documentation.\n\nPlease either update the remitter to the address on the W-9, or attach proof of the new address (a utility bill or updated W-9 dated within the last 90 days) and resubmit. Once it’s resubmitted, the request keeps its place in the review queue.',
      },
    ],
    notifications: buildNotifications('2026-09-02T11:30:00', COLLEAGUES.okafor),
  },
  {
    id: 'RR-2026-0205',
    customer: 'C-220917',
    submittedAt: '2026-09-19T16:05:00',
    status: 'submitted',
    statusDate: '2026-09-19',
    submittedBy: SUBMITTER,
    certifiedAt: '2026-09-19T16:05:00',
    justification: { code: 'rejected' },
    remark:
      'Refund of the $60.00 key deposit. The facility access case was rejected, so no key was issued.',
    fees: [
      {
        id: 'F-90588',
        desc: 'Key deposit',
        date: '2026-08-01',
        cents: 6000,
        refund: 6000,
        bank: 'Navy Federal',
        acct: '••••1120',
        method: 'ACH',
        card: '—',
        instrument: 'ACH to Navy Federal ••••1120',
        remitter: R(
          'Devin Achterberg',
          '2100 Clarendon Blvd, Arlington, VA 22201',
          'original'
        ),
        remitterSource: 'record',
        recordRemitter: null,
      },
    ],
    timeline: [{ status: 'submitted', at: '2026-09-19T16:05:00' }],
    notifications: buildNotifications('2026-09-19T16:05:00'),
  },
].map((r) => ({ ...r, total: r.fees.reduce((s, f) => s + f.refund, 0) }));
