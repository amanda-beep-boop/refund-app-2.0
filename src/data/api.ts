// The one place the UI gets its data. Every function here is implemented against the mock data
// today; connecting real services means replacing the body of each one, and nothing in the
// components changes. The shapes they return are the contract in src/types.ts.
//
// In production these calls go over the network, so each becomes async. The state layer
// (src/state/RefundContext.tsx) is the only caller, so that change stays contained there.
import type { Customer, JustificationOption, Person, RefundRequest } from '../types';
import { CUSTOMERS, DEMO_ACCOUNTS, JUSTIFICATIONS, SEED_REQUESTS } from './mockData';

// --- Auth service -----------------------------------------------------------

/** The signed-in user: name, email, role and office. */
export const getSignedInUser = (): Person => DEMO_ACCOUNTS[0];

/** Demo only: the accounts the account menu can switch between. Not part of the real app. */
export const listDemoAccounts = (): Person[] => DEMO_ACCOUNTS;

// --- Payment system of record ------------------------------------------------

/** Look up a customer by ID; null when there is no such customer. */
export const findCustomer = (id: string): Customer | null => CUSTOMERS[id] ?? null;

/**
 * A customer that must exist: one referenced by a request or the draft. A missing customer here
 * is a data error, not a user mistake, so it fails loudly rather than rendering a blank.
 */
export const customerById = (id: string): Customer => {
  const customer = CUSTOMERS[id];
  if (!customer) throw new Error(`Customer ${id} is not in the system of record.`);
  return customer;
};

/** Demo only: IDs offered under the search field. */
export const listSampleCustomerIds = (): string[] => Object.keys(CUSTOMERS);

// --- Refund-request service ----------------------------------------------------

/** The reasons a refund can be requested, with the business's current definitions. */
export const listJustifications = (): JustificationOption[] => JUSTIFICATIONS;

/** Every request from the signed-in user's office. */
export const listRequests = (): RefundRequest[] => SEED_REQUESTS;

/**
 * Assigns the next request ID. In production the service assigns IDs at submission; the POC
 * counts on from the seed data.
 */
let nextSeq = 206;
export const allocateRequestId = (): string => `RR-2026-${String(nextSeq++).padStart(4, '0')}`;

/** Records a certified request. In production this is the submission to the OCFO. */
export const submitRequest = (request: RefundRequest): RefundRequest => request;
