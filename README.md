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

## What the flow demonstrates

1. **Landing page** — every request submitted by the analyst's office, with who requested
   it (sort, filter, select, download as CSV/Word/PDF). Newest first by default, with a draft
   in progress at the top. "Start a new request" sits above the table. One draft at a time.
   Request IDs open the request record.
2. **Select fees** — every paid fee, with checkbox selection; lump-sum payments (PayPal,
   Splitwise) expanded by default, selectable only as a whole. Fees already in a request
   (any status) can't be requested twice; they sit in a collapsed "Already in a refund
   request (n)" group at the bottom of the table, read-only, each linking to its request.
   (Open question for the business: keep this group, or omit these fees.)
3. **Confirm details** — per-fee card with full/partial refund amount and the remitter from
   the payment record. Partial starts empty and must be less than the fee (refunding all of it
   is Full). Warnings appear only for real problems (an invalid amount, a remitter field left
   empty), not for fields that haven't been filled in yet; the hint by the disabled Continue
   button lists what's still needed. Remitters can be corrected (recorded as a note on the request) or
   entered when the record has none. One request-level justification
   (Processing Error, Clock Expired, Case Rejected or Other) and a required Requester Remark: a
   short summary of what is being refunded and why.
4. **Review & submit** — a preview of the exact record the OCFO will receive, with the legal
   certification (placeholder wording) as its closing line; simulated digital submission.
5. **Confirmation** — permanent request ID, the E-Note emails sent (to the submitter and the
   OCFO; remitters are never notified), and the new row in the history table as "Submitted
   to OCFO".
6. **Request record** — the modal behind each request ID is a living record. On top, a
   snapshot of what was submitted, laid out like an invoice: customer and requester, the
   Requester Remark, the justification with its definition as it stood at submission, fees
   with explicit refund destinations, and the certification. Below it, Activity: status changes, OCFO notes, and
   the deliveries made by E-Note (the automated notification system). A note on the current
   status is pinned at the top and links to Activity. The PDF download mirrors the record
   using the same wording.

### Design system notes

- One secondary gray (`c="dimmed"`) for labels, details, hints, table headers and disabled
  button text (so a disabled action stays readable).
- Colors live as semantic tokens in `src/theme.js` (`--surface-*`, `--border-*`, `--text-*`);
  components reference the token, never a hex value.
- A filled pill (`StatusBadge`) is reserved for workflow status. Flags about data use
  `Annotation`: an icon plus text with no fill, so they can't be mistaken for buttons
  (neutral gray, or amber for anything the analyst should check).
- Surfaces: dark blue nav bar, near-white canvas, white cards with gray borders, gray inset for
  table headers and nested rows.
  Light blue (`brand.0`) means one thing only: a checked row, in any table.
- Amber and red mean something is wrong, never just "not filled in yet." Required fields that
  haven't been started stay neutral; the gray "To continue: …" hint by a disabled button lists
  what's left.
- A row that can't be selected shows a lock icon, not a disabled checkbox.
- Links inside a sentence or gray text are always underlined (`underline="always"`); links that
  stand alone (nav, a table cell, a link under its own heading) underline on hover.

## Accessibility testing (Section 508 / WCAG 2.0 AA)

Tab moves only between things you can act on. Content is read by scrolling (sighted keyboard
users) or with screen reader reading commands, so static text is deliberately not a Tab stop.
Check each of these in Chrome, Firefox, Edge and Safari, and with NVDA (Windows) and VoiceOver
(macOS):

- **Request modal, keyboard only:** open a request ID with Enter. Focus lands inside the modal
  and Tab cycles through the close button, "Read the note in Activity" (returned requests only),
  Close and Download without leaving the modal. Arrow keys, Page Down and Home scroll the
  content. Escape closes the modal and focus returns to the request ID you opened.
- **Every overlay closes on Escape** and returns focus to whatever opened it: the request
  modal, the "Discard this draft?" confirmation (the draft is kept), and the Download menu on
  the history table. This is set app-wide in `theme.js`, so new modals and menus inherit it.
- **"Read the note in Activity":** activating it scrolls to the OCFO note and moves focus there,
  with a visible outline.
- **Screen reader structure:** the close button is announced as "Close request RR-…". The
  headings (H key) are the request ID and status, Submitted request, Remitter notes and
  Certification (when present), Activity, then each Activity event. Customer, Requested by and
  Justification are read with their labels. T finds the "Fees in this request" table, and its
  cells are announced with their column headers. Activity is announced as a list with its
  number of events.
- **Safari:** by default Safari's Tab key skips links (Option+Tab reaches them). Testers should
  turn on Settings → Advanced → "Press Tab to highlight each item" first. This is a browser
  setting, not an app defect.

## Known POC shortcuts

- Request IDs, emails, and PDFs are generated client-side; in production these are
  backend-owned so the OCFO record and the download are the same artifact.
- Certification wording is a placeholder pending counsel. Definitions for Processing Error,
  Clock Expired and Case Rejected are pending from the business; the app shows "Definition to
  be provided" until they're added in `src/data/mockData.js`. In production the backend should store the
  definition with each request, as the POC does at submission.
- E-Note deliveries are simulated; notifications currently go out only at submission.
- No auth (the real page sits behind existing credentials), no "returned for correction"
  resubmit flow yet, no pagination on the history table.
