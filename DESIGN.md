# Design Guide

The rules behind the Fee Refund Requests UI. Follow them when adding screens or components so
the app stays consistent. For what the app does and how to run it, see the [README](README.md).

## Color and surfaces

- Colors live as semantic tokens in `src/theme.ts` (`--surface-*`, `--border-*`, `--text-*`).
  Components reference a token, never a hex value. Where a Mantine color matches, the token
  points to it.
- Surfaces: dark blue nav bar, near-white canvas, white cards with gray borders, gray inset for
  table headers and nested rows.
- One secondary gray (`c="dimmed"`) for labels, details, hints, table headers and disabled
  button text, so a disabled action stays readable.
- Light blue (`brand.0`) means one thing only: a checked row, in any table.
- Amber and red mean something is wrong, never just "not filled in yet."

## Component library

Everything that carries a design decision comes from `src/ui`: one concept per file, each
opening with what the component is for, when not to use it, the rule it enforces and an
example. Layout primitives (`Group`, `Stack`, `Paper`, `Table`, inputs, buttons) come from
Mantine, which `src/theme.ts` styles to match, so a plain `<Paper>` is already a card.

While `npm run dev` is running, `/ui` shows every component in each of its states. It never
ships.

| When you need… | Use | Not |
| --- | --- | --- |
| A request's status | `StatusBadge` | A badge, pill or colored text of your own |
| A flag about a piece of data | `Annotation` (`RemitterSourceAnnotation`, `LumpSumAnnotation`, `IncompleteLabel`) | An alert, a badge |
| An identifier (customer, fee, request ID) | `Mono` | Monospace styling by hand |
| A dollar amount | `Amount` (integer cents) | Formatting money anywhere else |
| A label above a value | `Field` inside a `<dl>` | A label and value as loose text |
| A label above a group of controls | `FieldGroup` (`heading` for a main decision) | Mantine `Fieldset` |
| Who the customer is | `CustomerSummary` | The name and ID laid out by hand |
| Why a primary button is disabled | `DisabledHint` | A tooltip, a disabled button alone |
| Who E-Note notified | `NotificationList` | A table |
| The title of a page or step | `PageHeader` | A `Title` of your own |
| The top of a card | `CardHeader` | A `Title` and `Text` of your own |
| An icon | `Icons` (`Chevron`, `LockIcon`, …) | An icon library |
| A card | Mantine `Paper` | Styling a border and radius by hand |
| Waiting on a result or a table | `LoadingNotice`, `TableSkeleton` | A full-page spinner |
| Nothing to show | `EmptyState` | An empty table, a dashed box |
| A call that failed | `ErrorNotice` | A toast, an alert banner |

Library components take props only and never read app state; components that do (such as
the draft's Discard button) live in `src/components`.

## Page patterns

- **Customer summary:** the customer's full name as a heading with the customer ID beside it
  (`CustomerSummary`). It's the same wherever a customer appears: the home page search result,
  above the fees in Step 1, and at the top of Step 2.
- **Reference, then decisions:** on Confirm Details, what the system pulled up (the customer and
  each fee as paid) is shown once at the top. The fee cards below hold only what the user
  decides, and each decision group (Refund Amount, Remit To) is a heading.
- **The refund amount is shown large** under its controls, the same for Full and Partial, and
  only once there's a valid amount. "Paid" amounts are always labeled so they aren't mistaken
  for it.
- **Line items:** a lump sum's items are indented under their fee, with gray amounts so they
  aren't added up as more fees. A total row starts with a strong rule.

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

## Loading, empty and error states

Every call to a service can be slow or fail, and a list can be empty. Each case has one
pattern, from `src/ui/States.tsx`, shown in the exact spot the content will occupy. The page's
structure stays put; there are no full-page spinners.

- **Loading:** `LoadingNotice` (a small spinner and a sentence) for a single result;
  `TableSkeleton` (shimmering rows under the real column headers) for a table. Loading shows
  only after a short delay, so fast responses never flicker. The shimmer stops under reduced
  motion, and a live region announces the wait. A button that starts a write shows its own
  loading state instead.
- **Empty:** `EmptyState`, plain text with room around it, in the office's voice. "No history
  yet" hides the filters, since there is nothing to filter; "no matches" keeps them.
- **Error:** `ErrorNotice`, a white card with a red bar: what didn't happen, what it means, and
  at most one action. It's inline, never a toast, and its copy always says what did *not* change
  ("Nothing was sent to the OCFO, and the draft is unchanged"). The action names what it will
  redo ("Search Again", "Reload Requests"); when the original button is the retry, there is no
  action and the user's input, including a checked certification, is kept.

In development, `?latency=1500` slows every call and `?fail=customer`, `?fail=requests` or
`?fail=submit` makes that call fail, and `?empty=requests` shows an office with no history, so
each state can be seen live.

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
- **Composed copy:** when the UI builds a phrase around a controlled value ("In request
  RR-2026-0187 (under OCFO review)"), it may lowercase that value to fit the sentence. Proper names and free text are never changed.
- **Submitted records are snapshots.** A request keeps the fee names, remitters and
  justification definition as they were when it was certified. Later edits to the source
  don't rewrite past requests.

In the POC, controlled values live in `src/data/mockData.ts` (fees, justifications) and
`src/theme.ts` (statuses).

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
  the history table. This is set app-wide in `src/theme.ts`, so new modals and menus inherit it.
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
