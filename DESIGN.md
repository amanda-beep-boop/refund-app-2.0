# Design Guide

The rules behind the Fee Refund Requests UI. Follow them when adding screens or components so
the app stays consistent. For what the app does and how to run it, see the [README](README.md).

## Color and surfaces

- Colors live as semantic tokens in `src/theme.js` (`--surface-*`, `--border-*`, `--text-*`).
  Components reference a token, never a hex value. Where a Mantine color matches, the token
  points to it.
- Surfaces: dark blue nav bar, near-white canvas, white cards with gray borders, gray inset for
  table headers and nested rows.
- One secondary gray (`c="dimmed"`) for labels, details, hints, table headers and disabled
  button text, so a disabled action stays readable.
- Light blue (`brand.0`) means one thing only: a checked row, in any table.
- Amber and red mean something is wrong, never just "not filled in yet."

## Status and flags

- A filled pill (`StatusBadge`) is reserved for workflow status.
- Flags about data use `Annotation`: an icon plus text with no fill, so they can't be mistaken
  for buttons. Neutral gray states a fact; amber marks something the user should check.

## Forms and validation

- Required fields that haven't been started stay neutral. Warnings appear only for real
  problems, such as an invalid amount or a field left empty after it was touched.
- A disabled primary button always has a gray "To continue: …" hint beside it listing what's
  left.
- A row that can't be selected shows a lock icon, not a disabled checkbox.

## Text and casing

- **Title case** for headings, buttons, menu items, table headers and status labels ("Save
  Draft & Exit", "Under OCFO Review"). Articles, short conjunctions and short prepositions stay
  lowercase unless first ("Reason for This Request", "Back to Fees").
- **Sentence case** for field labels, hints and body text.
- A status named mid-sentence is lowercase except for acronyms ("under OCFO review").

### Voice

- **Second person** for the user's own actions in the request flow ("in your own words", "only if
  you know the payment record is wrong"). The certification statement stays in first person,
  because the person certifying makes it.
- **Office level** for anything shared by the office: the request list and the draft. A draft
  belongs to the office, not one person, so name who started it rather than saying "your draft"
  ("The New York Office has a draft in progress …, started by Jordan Ellis").
- Don't assume the current user created what they're looking at: a Supervisor may be submitting
  or discarding a draft Staff started ("this request", not "your request").

## Links

- Links inside a sentence or gray text are always underlined (`underline="always"`), because
  color alone doesn't set them apart (WCAG 1.4.1).
- Links that stand alone (nav, a table cell, a link under its own heading) underline on hover.

## Data display

Data is shown exactly as the system of record holds it. What appears on screen, in exports and
in the record sent to the OCFO must match the source, so the UI never rewrites data values.

| Kind of data | Examples | How it displays |
| --- | --- | --- |
| Controlled vocabulary | Fee names, line-item names, justifications, statuses | Title case, curated at the source as a display name. The UI shows it as received. |
| Proper names and addresses | Customers, remitters, banks | Exactly as stored. Never re-cased: automatic casing breaks names such as McDonald, O'Brien, de la Cruz or LLC. |
| Free text people type | Requester Remark, remitter edits, OCFO notes | Exactly as entered. |

- **Set casing at the source, not in the UI.** The API should send display-ready text (for
  example, fee names from a fee-type table with a curated display name). If a source stores
  values in ALL CAPS, normalize them in the backend with reviewed exceptions, so every screen
  and export gets the same text.
- **Don't use CSS `text-transform` on data.** Copy and paste, exports and some assistive
  technology get the original text, so the screen and the record would disagree.
- **Composed copy:** when the UI builds a phrase around a controlled value ("Visa credit card
  ••••2210", "In request RR-2026-0187 (under OCFO review)"), it may lowercase that value to fit
  the sentence. Proper names and free text are never changed.
- **Submitted records are snapshots.** A request keeps the fee names, remitters and
  justification definition as they were when it was certified. Later edits to the source
  don't rewrite past requests.

In the POC, controlled values live in `src/data/mockData.js` (fees, justifications) and
`src/theme.js` (statuses).

## Accessibility (Section 508 / WCAG 2.0 AA)

Every change meets WCAG 2.0 AA. Text is at least 4.5:1 against its background; borders and
icons that identify a control are at least 3:1.

Tab moves only between things you can act on. Content is read by scrolling (sighted keyboard
users) or with screen reader reading commands, so static text is deliberately not a Tab stop.

### Testing

Check each of these in Chrome, Firefox, Edge and Safari, and with NVDA (Windows) and VoiceOver
(macOS):

- **Request modal, keyboard only:** open a request ID with Enter. Focus lands inside the modal
  and Tab cycles through the close button, "Read the note in Activity" (returned requests only),
  Close and Download without leaving the modal. Arrow keys, Page Down and Home scroll the
  content. Escape closes the modal and focus returns to the request ID you opened.
- **Every overlay closes on Escape** and returns focus to whatever opened it: the request
  modal, the "Discard This Draft?" confirmation (the draft is kept), and the Download menu on
  the history table. This is set app-wide in `theme.js`, so new modals and menus inherit it.
- **"Read the note in Activity":** activating it scrolls to the OCFO note and moves focus there,
  with a visible outline.
- **Screen reader structure:** the close button is announced as "Close request RR-…". The
  headings (H key) are the request ID and status, Submitted Request, Remitter Notes and
  Certification (when present), Activity, then each Activity event. Customer, Requested by and
  Justification are read with their labels. T finds the "Fees in This Request" table, and its
  cells are announced with their column headers. Activity is announced as a list with its
  number of events.
- **Safari:** by default Safari's Tab key skips links (Option+Tab reaches them). Testers should
  turn on Settings → Advanced → "Press Tab to highlight each item" first. This is a browser
  setting, not an app defect.
