# Handoff

Start here: the state of the proof of concept, what to do first, what to keep as is, the open
questions, and where to record decisions made along the way.

## State

- The flow is complete on mock data: look up a customer, select fees, confirm amounts and
  remitters, review, certify and submit; a request record with activity and exports; Staff and
  Supervisor roles; loading, empty and error states.
- Every file is TypeScript under strict settings. `npm run build` runs the type check and the
  data checks first; a failure fails the build.
- The design rules are in [DESIGN.md](DESIGN.md); every component that carries a design decision
  is in `src/ui`, and `/ui` (development only) shows them all.
- The data contract is `src/types.ts`. The UI gets data only through `src/data/api.ts`.
- Stakeholders have reviewed the flow. The decisions below came out of those reviews.

## First week

In this order. Each step is a self-contained change that keeps the app running.

1. **Set up.** Node 22.6 or later, `npm install`, `npm run dev`. Read the README, then
   DESIGN.md, then `src/types.ts`. Open `/ui`. Walk through a request as Staff, then as a
   Supervisor (the README's "Walking through it").
2. **Answer the environment questions** (below) on your side: base path, browsers, fonts, Node
   in CI. These change config, not code.
3. **Connect sign-in.** Replace the body of `getSignedInUser` in `src/data/api.ts`; remove
   `listDemoAccounts` and the account switch in `src/components/ProfileMenu.tsx`. Everything
   else keys off the `Person` it returns.
4. **Connect the customer lookup.** Replace the body of `findCustomer`; map the service's
   response to `Customer`. Keep `customerById` working for customers that loaded requests refer
   to (see question 12). Remove `listSampleCustomerIds` and the sample links.
5. **Connect requests.** Replace the bodies of `listRequests` and `submitRequest`. The service
   assigns the request ID and returns the stored record.
6. **Persist the office's draft** (`src/state/RefundContext.tsx`). One draft per office; see
   question 14 before choosing a locking approach.
7. **Move exports server-side** (`src/lib/exports.ts`), last.

The "What you replace" table in the README names every file involved. If something outside
that table seems to need a change to connect a service, map the service's response to the
contract in `api.ts` instead, and note it under "Decisions made" below.

## Keep as is

These are settled. If a service makes one hard to keep, record it under "Decisions made" and
carry on with the rest.

- **Design and copy.** Layout, colors, wording, casing and voice follow DESIGN.md. New screens
  are built from `src/ui` and Mantine layout primitives, not new components.
- **One draft at a time per office.** It must be submitted or discarded before another starts.
- **Roles.** Staff do every step except certify and submit; only a Supervisor certifies and
  submits. The record keeps who requested and who certified.
- **Payment methods.** ACH, PayPal and money order. A money order has no account to return
  funds to, so its refund is always a paper check to an address entered by hand.
- **Partial refunds are a dollar amount**, not a choice of line items; a lump sum is refunded as
  a whole. This follows from how bundled payments work in the payment system.
- **Data is shown as the system of record holds it.** No re-casing, no `text-transform`, no
  formatting of money outside `src/lib/format.ts`. Submitted requests are snapshots.
- **The record and its PDF show what is refunded**, not a lump sum's line items.
- **Accessibility.** Every change meets WCAG 2.0 AA (Section 508); DESIGN.md has the checklist.

## Not yet

Out of scope until the business decides. Don't start these.

- The "returned for correction" flow (editing and resubmitting a returned request).
- Showing versus omitting fees already in a request on Select Fees (shown, collapsed, today).
- Definitions for Processing Error, Clock Expired and Case Rejected; the certification wording.
  Both are placeholders in `src/data/mockData.ts` and `src/components/Step3Review.tsx`.
- Pagination of the request history.

## Open questions

Answer what you can on your side; the rest are for the business.

Environment
1. Which Node version runs in CI and on developer machines? The POC needs 22.6 or later for
   `npm run check`.
2. Which browsers must be supported? The build targets modern browsers (ES2022).
3. Will the app run at the site root or under a path (for example `/refunds/`)? Vite has a base
   path setting; the development-only catalog and switches assume the root.
4. Can the app load fonts from Google Fonts, or should we self-host Source Sans 3 and IBM Plex
   Mono, or use the organization's fonts?

Sign-in and roles
5. How does the app learn who is signed in: name, email, role (Staff or Supervisor) and office?
6. What account actions does the auth system offer (sign out, switch)?
7. Can a Supervisor certify and submit a request they started themselves? The POC allows it;
   the business should confirm.

Data contract (`src/types.ts`)
8. Do the services send money as integer cents or as decimal dollars? The POC uses cents.
9. Do timestamps carry a timezone offset? The POC's are local time with none; ISO 8601 with an
   offset is preferred.
10. Where do fee names and line-item names come from, and in what case are they stored? Any ALL
    CAPS? The UI shows them as sent.
11. Are lump-sum line items catalog values or typed by people?
12. Should a request carry the customer's name and ID, or should loading requests also load the
    customers they reference? The UI needs the name to render a row.
13. What are the real ID formats for customers, fees and requests?

Requests and drafts
14. How is the office's single draft stored, and what happens if Staff and a Supervisor open it
    at the same time (locking, or last write wins)?
15. Should a draft signal that it's ready for certification once Staff reach Step 3? Not
    built; decide after pilot feedback.
16. How many requests will an office accumulate, and at what count does the history need
    pagination or server-side filtering?
17. Does the request service assign the request ID at submission and return the stored record?

Integrations
18. Does the E-Note system send notifications itself on submission, or does the app ask it to,
    and what does it return for the record?
19. Will the PDF, CSV and Word exports be generated server-side, so the OCFO record and the
    download are the same artifact?
20. Where should failed calls be logged? The UI shows a plain-language notice and reports
    nothing anywhere.

Conventions
21. Which TypeScript version and strictness settings does the organization standardize on? The
    POC pins 5.9 with `strict`; switching is a config change.
22. Which lint and formatting configurations should the repo adopt? None are included, on
    purpose. A rule that blocks UI imports outside `src/ui` would protect the component library.
23. What testing is expected (unit, end-to-end)? The POC ships type and data checks only.
24. Which accessibility tooling and screen-reader setups do you test with?

## Decisions made

Record anything decided or changed as you connect services, one line each, with the date and
why: what a service couldn't provide, a contract field that had to change, a question above
that got an answer. It keeps the design, the contract and the build in step.

- _(none yet)_
