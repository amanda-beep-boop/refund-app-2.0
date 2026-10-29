# Fee Refund Requests — POC

**New to the project?** Start with [HANDOFF.md](HANDOFF.md): the state of the work, what to do
first, what to keep as is, and the open questions.

A working proof of concept of the fee refund request feature: authorized users look up a
customer account, select fees eligible for refund, confirm amounts and remitters, and
submit the request to the Office of the Chief Financial Officer (OCFO) for review.

This POC was produced by design to communicate the intended flow and interaction detail to
the dev team and the business. It runs entirely on mock data (`src/data/mockData.ts`) with a
stand-in for sign-in. "What you replace" below lists every place that changes when it is
connected to real services.

## Stack

- [Vite](https://vitejs.dev) + React 18, written in TypeScript (strict)
- [Mantine 7](https://mantine.dev) for UI components
- `jspdf` + `jspdf-autotable` and `docx` for the client-side export stand-ins

## Run it

```bash
npm install
npm run dev        # local server with hot reload
npm run typecheck  # type check only
npm run check      # type check, then the data checks (scripts/check-data.ts)
npm run build      # the checks, then a production build; a failed check fails the build
```

Calls to services return promises with no artificial delay. To see the loading and error
states while developing, add `?latency=1500` (every call takes 1.5 s) or `?fail=customer`,
`?fail=requests` or `?fail=submit` to the URL; `?empty=requests` shows an office with no history.

### Walking through it

Sample customer IDs for the search: `C-104822`, `C-220917`, `C-301550` (click one under the
search field to look it up). `C-104822` is the richest walkthrough: a lump-sum PayPal fee, a
fee paid by money order (no remitter on file, so it's entered by hand and refunded by check),
and partial refunds. `C-220917` has the most fees already in a request (approved, under review,
submitted, partial).

To walk through the Staff-to-Supervisor handoff, start a request as Jordan Ellis (Staff), save it
on Step 3, then open the account menu at the top right and switch to Simone Hart (Supervisor)
to resume, certify and submit it.

## What you replace

The POC runs on mock data and a stand-in for sign-in. These are the places that change when it
is connected to real services; if something isn't in this table, it shouldn't need to change.

| To connect… | Replace | Where |
| --- | --- | --- |
| Sign-in: the user's name, email, role and office | The body of `getSignedInUser`. Remove `listDemoAccounts` and the account switch in the account menu. | `src/data/api.ts`, `src/components/ProfileMenu.tsx` |
| Customers and their paid fees | The bodies of `findCustomer` and `customerById`. Remove `listSampleCustomerIds` and the sample links under the search field. | `src/data/api.ts`, `src/components/CustomerSearch.tsx` |
| Refund requests | The bodies of `listRequests` and `submitRequest`. The service assigns IDs at submission. | `src/data/api.ts` |
| Justifications and their definitions | The body of `listJustifications`; the pending definitions in `JUSTIFICATIONS`. | `src/data/api.ts`, `src/data/mockData.ts` |
| E-Note notifications | `buildNotifications` becomes the service's record of what it sent. | `src/data/mockData.ts`, `src/state/RefundContext.tsx` |
| The certification wording | The checkbox statement and the "Certified and submitted by" line, once counsel supplies them. | `src/components/Step3Review.tsx`, `src/components/RequestRecord.tsx`, `src/lib/exports.ts` |
| Exports (PDF, CSV, Word) | Generate server-side, so the OCFO record and the download are the same artifact. | `src/lib/exports.ts` |
| The office's draft | Persist it per office; today it lives in memory and is lost on reload. | `src/state/RefundContext.tsx` |

The shapes every function returns are the contract in `src/types.ts`. Map each service's
response to them there, and nothing in the UI changes.

## Where things live

- `src/types.ts` — the data contract: every shape the backend supplies, with a note on each
  field. The UI, the exports and the data checks are all written against it.
- `src/data/api.ts` — the one place the UI gets data. Each function is implemented against the
  mock data today; connecting real services means replacing the body of each one.
- `src/data/mockData.ts` — the mock customers, fees, people and requests, typed against the
  contract.
- `src/state/` — the request in progress (`draft.ts`) and the app's state (`RefundContext.tsx`).
- `src/ui/` — the component library: every component that carries a design decision, with
  its rule. `/ui` shows them all in development (see "Component library" in DESIGN.md).
- `src/components/` — the screens, built from `src/ui` and Mantine.
- `src/lib/` — pure helpers: formatting, selectors over the draft and requests, exports.

## Roles and access

Every user signs in with one of two roles. The auth system supplies the user's name, email, role
and office; requests and the draft are scoped to that office. The POC's office name, "New York
Office", is a placeholder for that value (`OFFICE` in `src/data/mockData.ts`).

| | Staff | Supervisor |
| --- | --- | --- |
| Start a request, select fees, confirm details, review | Yes | Yes |
| Resume and edit the office's draft | Yes | Yes |
| Certify and submit to the OCFO | No | Yes |

- **One draft at a time per office** (a business rule). It must be submitted or discarded before
  anyone in the office can start another request.
- **The draft is the handoff.** Staff complete Steps 1–3 and save the draft; on Step 3 they see
  that a Supervisor needs to certify and submit it. A Supervisor resumes it, can edit anything,
  then certifies and submits.
- **The record keeps both people.** "Requested by" is whoever started the draft; "Certified and
  submitted by" is the Supervisor. When a Supervisor does everything, both are the same person.
- **Account menu:** the button at the top right shows the signed-in user's name, email, role and
  office. Its "switch account" option is for the demo only; in production, replace it with the
  account actions the auth system provides (typically Sign Out).

## What the flow demonstrates

1. **Landing page** — every request submitted by the user's office, with who requested
   it (sort, filter, select, download as CSV/Word/PDF). Newest first by default, with a draft
   in progress at the top. "Start a New Refund Request" sits above the table. One draft at a
   time per office; while there is one, a banner in its place says who started it.
   Request IDs open the request record.
2. **Select Fees** — every paid fee, with checkbox selection; lump-sum payments
   expanded by default, selectable only as a whole. Fees are paid by ACH, PayPal or, rarely,
   money order. Fees already in a request
   (any status) can't be requested twice; they sit in a collapsed "Already in a Refund
   Request (n)" group at the bottom of the table, read-only, each linking to its request.
   (Open question for the business: keep this group, or omit these fees.)
3. **Confirm Details** — reference first, then decisions. A panel at the top shows the customer
   and each selected fee as paid (date, payment method, a lump sum's items, total paid). Below
   it, one card per fee holds the two decisions: Refund Amount (Full or Partial, with the amount
   to be refunded shown large) and Remit To (the remitter from the payment record). Partial
   starts empty and must be less than the fee (refunding all of it is Full). Warnings appear only for real problems (an invalid amount, a remitter field left
   empty), not for fields that haven't been filled in yet; the hint by the disabled Continue
   button lists what's still needed. Remitters can be corrected (recorded as a note on the request) or
   entered when the record has none. A money order has no account to return funds to, so its
   refund is always a paper check. One request-level justification
   (Processing Error, Clock Expired, Case Rejected or Other) and a required Requester Remark: a
   short summary of what is being refunded and why.
4. **Review & Submit** — a preview of the exact record the OCFO will receive, with the legal
   certification (placeholder wording) as its closing line; simulated digital submission. Only a
   Supervisor can certify and submit; Staff see why and save the draft instead.
5. **Confirmation** — permanent request ID, the E-Note emails sent (to the submitter, the
   requester when someone else prepared the request, and the OCFO; remitters are never notified), and the new row in the history table as "Submitted
   to OCFO".
6. **Request record** — the modal behind each request ID is a living record. On top, a
   snapshot of what was submitted, laid out like an invoice: customer and requester, the
   Requester Remark, the justification with its definition as it stood at submission, fees
   with explicit refund destinations, and the certification. Below it, Activity: status changes, OCFO notes, and
   the deliveries made by E-Note (the automated notification system). A note on the current
   status is pinned at the top and links to Activity. The PDF download mirrors the record
   using the same wording.

## Design guide

Color, status, validation, casing, link, data display and accessibility rules, plus the
accessibility test checklist, are in [DESIGN.md](DESIGN.md).

## Known POC shortcuts

- Request IDs, emails, and PDFs are generated client-side; in production these are
  backend-owned so the OCFO record and the download are the same artifact.
- Certification wording is a placeholder pending counsel. Definitions for Processing Error,
  Clock Expired and Case Rejected are pending from the business; the app shows "Definition to
  be provided" until they're added in `src/data/mockData.ts`. In production the backend should store the
  definition with each request, as the POC does at submission.
- Fee names are hard-coded in the mock data. In production the API should send them
  display-ready from the source (see "Data display" in [DESIGN.md](DESIGN.md)).
- E-Note deliveries are simulated; notifications currently go out only at submission.
- The fonts (Source Sans 3, IBM Plex Mono) load from Google Fonts in `index.html`. In production,
  self-host them or substitute the organization's fonts; see `fontFamily` in `src/theme.ts`.
- No real auth: two mock accounts and the demo account switch stand in for it (see "Roles and
  access"). No "returned for correction" resubmit flow yet, no pagination on the history table.
