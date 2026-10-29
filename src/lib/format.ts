// Money is handled in integer cents everywhere; formatting happens at the edge.
import type { Cents, Fee, RefundMethod, RequestFee } from '../types';

export const fmt = (cents: Cents): string =>
  (cents < 0 ? '-' : '') +
  '$' +
  (Math.abs(cents) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const dollars = (cents: Cents): string => (cents / 100).toFixed(2);

export const parseCents = (value: string | number): Cents => {
  const n = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

export const fmtDate = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

export const fmtDateTime = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

export const nowISO = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`;
};

export const todayISO = () => nowISO().slice(0, 10);

// How a refund is paid out, stated literally. Lowercase so it reads inside a sentence
// ("Refund method: …"); capitalize it where it stands alone, such as a select option.
// A masked number stays on the line with the word before it ("Truist ••••4471").
export const methodLabel = (fee: Fee | RequestFee, method: RefundMethod): string =>
  method === 'check'
    ? 'paper check mailed to the remittance address'
    : `returned to the original payment, ${(fee.instrument ?? fee.method).replace(/ (?=••••)/g, ' ')}`;

export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
