// The one place the UI gets its data. Every function here is implemented against the mock data
// today; connecting real services means replacing the body of each one, and nothing in the
// components changes. The shapes they return are the contract in src/types.ts.
//
// Calls that go to a service return promises, as they will in production, so the state layer
// (src/state/RefundContext.tsx) already handles waiting and failure. There is no artificial
// delay. In development builds, two query parameters make those states visible:
//   ?latency=1500            every call takes 1.5 seconds
//   ?fail=customer|requests|submit   that call fails
//   ?empty=requests          the office has no requests yet
import type { Customer, JustificationOption, Person, RefundRequest } from '../types';
import { CUSTOMERS, DEMO_ACCOUNTS, JUSTIFICATIONS, SEED_REQUESTS } from './mockData';

type Call = 'customer' | 'requests' | 'submit';

const devSwitches = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
const latency = Number(devSwitches?.get('latency')) || 0;
const failing = devSwitches?.get('fail') ?? null;

// Stands in for a round trip to a service, honoring the development switches above.
const respond = <T>(call: Call, value: () => T): Promise<T> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failing === call) reject(new Error(`${call}: failed by the ?fail development switch`));
      else resolve(value());
    }, latency);
  });

// --- Auth service -----------------------------------------------------------

/** The signed-in user: name, email, role and office. Resolved before the app renders. */
export const getSignedInUser = (): Person => DEMO_ACCOUNTS[0];

/** Demo only: the accounts the account menu can switch between. Not part of the real app. */
export const listDemoAccounts = (): Person[] => DEMO_ACCOUNTS;

// --- Payment system of record ------------------------------------------------

/** Look up a customer by ID; null when there is no such customer. */
export const findCustomer = (id: string): Promise<Customer | null> =>
  respond('customer', () => CUSTOMERS[id] ?? null);

/**
 * A customer the UI already has: one referenced by a loaded request or the draft. A missing
 * customer here is a data error, not a user mistake, so it fails loudly rather than rendering a
 * blank. In production, either a request carries what the UI shows about its customer (name and
 * ID), or listRequests loads those customers along with the requests.
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
export const listRequests = (): Promise<RefundRequest[]> =>
  respond('requests', () => (devSwitches?.get('empty') === 'requests' ? [] : SEED_REQUESTS));

/**
 * Submits a certified request to the OCFO and returns it as recorded, with the ID the service
 * assigned. The POC counts on from the seed data.
 */
let nextSeq = 206;
export const submitRequest = (request: Omit<RefundRequest, 'id'>): Promise<RefundRequest> =>
  respond('submit', () => ({ ...request, id: `RR-2026-${String(nextSeq++).padStart(4, '0')}` }));
