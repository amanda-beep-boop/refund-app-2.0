# Fee Refund Requests — POC

A working proof of concept of the fee refund request feature: authorized users look up a
customer account, select fees eligible for refund, confirm amounts and remitters, and
submit the request to the Office of the Chief Financial Officer (OCFO) for review.

This POC was produced by design to communicate the intended flow and interaction detail to
the dev team and the business. It runs entirely on mock data (`src/data/mockData.js`) — no
backend, no auth. Anything the backend would own is marked in code comments.

## Stack

- [Vite](https://vitejs.dev) + React 18
- [Mantine 7](https://mantine.dev) for UI components
- `jspdf` + `jspdf-autotable` and `docx` for the client-side export stand-ins

## Run it

```bash
npm install
npm run dev
```

Sample customer IDs for the search: `C-104822`, `C-220917`, `C-301550` (click one under the
search field to look it up). `C-104822` is the richest walkthrough — it covers a lump-sum PayPal
fee, a fee with no remitter on file (manual entry required), and partial refunds. `C-220917`
shows the most fees already in a request (approved, under review, submitted, partial).

To walk through the Staff-to-Supervisor handoff, start a request as Jordan Ellis (Staff), save it
on Step 3, then open the account menu at the top right and switch to Simone Hart (Supervisor)
to resume, certify and submit it.

## Roles and access

Every user signs in with one of two roles. The auth system supplies the user's name, email, role
and office; requests and the draft are scoped to that office. The POC's office name, "New York
Office", is a placeholder for that value (`OFFICE` in `src/data/mockData.js`).

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
2. **Select Fees** — every paid fee, with checkbox selection; lump-sum payments (PayPal,
   Splitwise) expanded by default, selectable only as a whole. Fees already in a request
   (any status) can't be requested twice; they sit in a collapsed "Already in a Refund
   Request (n)" group at the bottom of the table, read-only, each linking to its request.
   (Open question for the business: keep this group, or omit these fees.)
3. **Confirm Details** — per-fee card with full/partial refund amount and the remitter from
   the payment record. Partial starts empty and must be less than the fee (refunding all of it
   is Full). Warnings appear only for real problems (an invalid amount, a remitter field left
   empty), not for fields that haven't been filled in yet; the hint by the disabled Continue
   button lists what's still needed. Remitters can be corrected (recorded as a note on the request) or
   entered when the record has none. One request-level justification
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
  be provided" until they're added in `src/data/mockData.js`. In production the backend should store the
  definition with each request, as the POC does at submission.
- Fee names are hard-coded in the mock data. In production the API should send them
  display-ready from the source (see "Data display" in [DESIGN.md](DESIGN.md)).
- E-Note deliveries are simulated; notifications currently go out only at submission.
- No real auth: two mock accounts and the demo account switch stand in for it (see "Roles and
  access"). No "returned for correction" resubmit flow yet, no pagination on the history table.
