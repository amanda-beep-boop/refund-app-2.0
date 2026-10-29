import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { notifications } from '@mantine/notifications';
import type { Customer, Fee, JustificationCode, Person, RefundRequest } from '../types';
import type { AmountState, Draft, RemitterState } from './draft';
import {
  allocateRequestId,
  getSignedInUser,
  listRequests,
  submitRequest,
} from '../data/api';
import { ROLE_LABEL, buildNotifications } from '../data/mockData';
import { nowISO } from '../lib/format';
import {
  draftCustomer,
  selectedFees,
  initialFeeState,
  draftTotal,
  draftRequest,
  canSubmit,
} from '../lib/selectors';

export type View = 'home' | 'flow' | 'confirm';

export interface RefundState {
  currentUser: Person;
  requests: RefundRequest[];
  view: View;
  step: number;
  draft: Draft | null;
  sending: boolean;
  lastSubmitted: RefundRequest | null;
  customer: Customer | null;
  fees: Fee[];
  total: number;
  setView: (view: View) => void;
  setStep: (step: number) => void;
  startDraft: (customerId: string) => void;
  discardDraft: () => void;
  saveAndExit: () => void;
  resumeDraft: () => void;
  signInAs: (user: Person) => void;
  toggleFee: (fee: Fee) => void;
  toggleCollapsed: (feeId: string) => void;
  setAmount: (feeId: string, patch: Partial<AmountState>) => void;
  setRemitter: (feeId: string, patch: Partial<RemitterState>) => void;
  restoreRemitter: (fee: Fee) => void;
  setJustification: (patch: { code: JustificationCode | null }) => void;
  setRemark: (remark: string) => void;
  setCertified: (certified: boolean) => void;
  submit: () => void;
}

const RefundContext = createContext<RefundState | null>(null);

// Patches the draft in place; a no-op when there is no draft.
const withDraft = (fn: (d: Draft) => Draft) => (d: Draft | null) => (d ? fn(d) : d);

export function RefundProvider({ children }: { children: ReactNode }) {
  // In production the auth system supplies the signed-in user (name, email, role, office).
  const [currentUser, setCurrentUser] = useState<Person>(getSignedInUser);
  const [requests, setRequests] = useState<RefundRequest[]>(listRequests);
  const [view, setView] = useState<View>('home');
  const [step, setStep] = useState(1);
  // One draft at a time per office (a business rule): it must be submitted or discarded before
  // anyone in the office starts another request. Staff hand a finished draft to a Supervisor by
  // saving it; the Supervisor resumes it, can edit anything, then certifies and submits.
  const [draft, setDraft] = useState<Draft | null>(null);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const patchDraft = (patch: Partial<Draft>) => setDraft(withDraft((d) => ({ ...d, ...patch })));

  const startDraft = (customerId: string) => {
    setDraft({
      customer: customerId,
      selected: new Set(),
      collapsed: new Set(),
      amounts: {},
      remitters: {},
      justification: { code: null },
      remark: '',
      certified: false,
      startedAt: nowISO(),
      createdBy: currentUser,
    });
    setStep(1);
    setView('flow');
  };

  const discardDraft = () => {
    setDraft(null);
    setStep(1);
    setView('home');
    notifications.show({ message: 'Draft discarded', color: 'gray' });
  };

  const saveAndExit = () => {
    setView('home');
    notifications.show({
      message:
        view === 'flow' && step === 3 && !canSubmit(currentUser)
          ? 'Draft saved. A Supervisor can now resume it to certify and submit.'
          : 'Draft saved',
      color: 'brand',
    });
  };

  // Demo only: stands in for signing out and back in as someone else. The office's draft is kept,
  // and like a fresh sign-in the user lands on the home page.
  const signInAs = (user: Person) => {
    setCurrentUser(user);
    // Certifying is the signed-in person's own statement, so it never carries over to someone else.
    setDraft(withDraft((d) => ({ ...d, certified: false })));
    setView('home');
    notifications.show({
      message: `Signed in as ${user.name} (${ROLE_LABEL[user.role]})`,
      color: 'brand',
    });
  };

  const resumeDraft = () => setView('flow');

  const toggleFee = (fee: Fee) =>
    setDraft(
      withDraft((d) => {
        const selected = new Set(d.selected);
        const amounts = { ...d.amounts };
        const remitters = { ...d.remitters };
        if (selected.has(fee.id)) {
          selected.delete(fee.id);
        } else {
          selected.add(fee.id);
          if (!amounts[fee.id]) {
            const init = initialFeeState(fee);
            amounts[fee.id] = init.amount;
            remitters[fee.id] = init.remitter;
          }
        }
        return { ...d, selected, amounts, remitters };
      })
    );

  const toggleCollapsed = (feeId: string) =>
    setDraft(
      withDraft((d) => {
        const collapsed = new Set(d.collapsed);
        if (collapsed.has(feeId)) collapsed.delete(feeId);
        else collapsed.add(feeId);
        return { ...d, collapsed };
      })
    );

  const setAmount = (feeId: string, patch: Partial<AmountState>) =>
    setDraft(
      withDraft((d) => ({ ...d, amounts: { ...d.amounts, [feeId]: { ...d.amounts[feeId], ...patch } } }))
    );

  const setRemitter = (feeId: string, patch: Partial<RemitterState>) =>
    setDraft(
      withDraft((d) => ({
        ...d,
        remitters: { ...d.remitters, [feeId]: { ...d.remitters[feeId], ...patch } },
      }))
    );

  const restoreRemitter = (fee: Fee) => {
    if (!fee.remitter) return;
    setRemitter(fee.id, {
      name: fee.remitter.name,
      address: fee.remitter.address,
      method: fee.remitter.method,
      editing: false,
      touched: false,
    });
    notifications.show({ message: 'Remitter restored from the payment record', color: 'brand' });
  };

  const setJustification = (patch: { code: JustificationCode | null }) =>
    setDraft(withDraft((d) => ({ ...d, justification: { ...d.justification, ...patch } })));

  const setRemark = (remark: string) => setDraft(withDraft((d) => ({ ...d, remark })));

  const submit = () => {
    if (!draft || !canSubmit(currentUser)) return;
    const d = draft;
    setSending(true);
    // Simulated latency of the digital submission to the OCFO.
    setTimeout(() => {
      const at = nowISO();
      const request: RefundRequest = {
        ...draftRequest(d, currentUser),
        id: allocateRequestId(),
        submittedAt: at,
        status: 'submitted',
        statusDate: at.slice(0, 10),
        certifiedAt: at,
        timeline: [{ status: 'submitted', at }],
        notifications: buildNotifications(at, currentUser, d.createdBy),
      };
      const stored = submitRequest(request);
      setRequests((rs) => [...rs, stored]);
      setLastSubmittedId(stored.id);
      setSending(false);
      setStep(1);
      setView('confirm');
      setDraft(null); // draft is consumed
    }, 900);
  };

  const value = useMemo<RefundState>(
    () => ({
      currentUser,
      requests,
      view,
      step,
      draft,
      sending,
      lastSubmitted: requests.find((r) => r.id === lastSubmittedId) || null,
      customer: draftCustomer(draft),
      fees: selectedFees(draft),
      total: draft ? draftTotal(draft) : 0,
      setView,
      setStep,
      startDraft,
      discardDraft,
      saveAndExit,
      resumeDraft,
      signInAs,
      toggleFee,
      toggleCollapsed,
      setAmount,
      setRemitter,
      restoreRemitter,
      setJustification,
      setRemark,
      setCertified: (certified) => patchDraft({ certified }),
      submit,
    }),
    [currentUser, requests, view, step, draft, sending, lastSubmittedId]
  );

  return <RefundContext.Provider value={value}>{children}</RefundContext.Provider>;
}

/** The draft and its customer, for the request flow, which renders only while a draft exists. */
export const useActiveDraft = (): { draft: Draft; customer: Customer } => {
  const { draft, customer } = useRefund();
  if (!draft || !customer) throw new Error('The request flow rendered without a draft.');
  return { draft, customer };
};

export const useRefund = (): RefundState => {
  const ctx = useContext(RefundContext);
  if (!ctx) throw new Error('useRefund must be used inside <RefundProvider>.');
  return ctx;
};
