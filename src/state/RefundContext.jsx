import { createContext, useContext, useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { SEED_REQUESTS, DEMO_ACCOUNTS, ROLE_LABEL, buildNotifications } from '../data/mockData';
import { nowISO } from '../lib/format';
import {
  draftCustomer,
  selectedFees,
  initialFeeState,
  draftTotal,
  draftRequest,
  canSubmit,
} from '../lib/selectors';

const RefundContext = createContext(null);

export function RefundProvider({ children }) {
  // In production the auth system supplies the signed-in user (name, email, role, office).
  const [currentUser, setCurrentUser] = useState(DEMO_ACCOUNTS[0]);
  const [requests, setRequests] = useState(SEED_REQUESTS);
  const [nextSeq, setNextSeq] = useState(206);
  const [view, setView] = useState('home'); // 'home' | 'flow' | 'confirm'
  const [step, setStep] = useState(1);
  // One draft at a time per office (a business rule): it must be submitted or discarded before
  // anyone in the office starts another request. Staff hand a finished draft to a Supervisor by
  // saving it; the Supervisor resumes it, can edit anything, then certifies and submits.
  const [draft, setDraft] = useState(null);
  const [lastSubmittedId, setLastSubmittedId] = useState(null);
  const [sending, setSending] = useState(false);

  const patchDraft = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const startDraft = (customerId) => {
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
  const signInAs = (user) => {
    setCurrentUser(user);
    // Certifying is the signed-in person's own statement, so it never carries over to someone else.
    setDraft((d) => (d ? { ...d, certified: false } : d));
    setView('home');
    notifications.show({
      message: `Signed in as ${user.name} (${ROLE_LABEL[user.role]})`,
      color: 'brand',
    });
  };

  const resumeDraft = () => setView('flow');

  const toggleFee = (fee) =>
    setDraft((d) => {
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
    });

  const toggleCollapsed = (feeId) =>
    setDraft((d) => {
      const collapsed = new Set(d.collapsed);
      collapsed.has(feeId) ? collapsed.delete(feeId) : collapsed.add(feeId);
      return { ...d, collapsed };
    });

  const setAmount = (feeId, patch) =>
    setDraft((d) => ({ ...d, amounts: { ...d.amounts, [feeId]: { ...d.amounts[feeId], ...patch } } }));

  const setRemitter = (feeId, patch) =>
    setDraft((d) => ({
      ...d,
      remitters: { ...d.remitters, [feeId]: { ...d.remitters[feeId], ...patch } },
    }));

  const restoreRemitter = (fee) => {
    setRemitter(fee.id, {
      name: fee.remitter.name,
      address: fee.remitter.address,
      method: fee.remitter.method,
      editing: false,
      touched: false,
    });
    notifications.show({ message: 'Remitter restored from the payment record', color: 'brand' });
  };

  const setJustification = (patch) =>
    setDraft((d) => ({ ...d, justification: { ...d.justification, ...patch } }));

  const setRemark = (remark) => setDraft((d) => ({ ...d, remark }));

  const submit = () => {
    if (!draft || !canSubmit(currentUser)) return;
    const d = draft;
    setSending(true);
    // Simulated latency of the digital submission to the OCFO.
    setTimeout(() => {
      {
        const at = nowISO();
        const id = `RR-2026-${String(nextSeq).padStart(4, '0')}`;
        const base = draftRequest(d, currentUser);
        const request = {
          ...base,
          id,
          submittedAt: at,
          status: 'submitted',
          statusDate: at.slice(0, 10),
          certifiedAt: at,
          timeline: [{ status: 'submitted', at }],
          notifications: buildNotifications(at, currentUser, d.createdBy),
        };
        setRequests((rs) => [...rs, request]);
        setNextSeq((n) => n + 1);
        setLastSubmittedId(id);
        setSending(false);
        setStep(1);
        setView('confirm');
        setDraft(null); // draft is consumed
      }
    }, 900);
  };

  const value = useMemo(
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
    [currentUser, requests, view, step, draft, sending, lastSubmittedId, nextSeq]
  );

  return <RefundContext.Provider value={value}>{children}</RefundContext.Provider>;
}

export const useRefund = () => useContext(RefundContext);
