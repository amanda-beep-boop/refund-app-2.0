// Annotation — an icon plus text, with no fill or border, for a flag about a piece of data.
//
// Use for: stating a fact about data ("From payment record", "Lump sum of 3 items") or
// marking something the user should check ("Changed from payment record", "Incomplete").
// Don't use for: workflow status (<StatusBadge>) or guidance about what to do next
// (<DisabledHint>).
// Rule: neutral (gray) states a fact. Attention (amber) marks something that departs from the
// system of record or is incomplete; amber and red mean something is wrong, never "not filled
// in yet". The icon is decorative; the words carry the meaning.
// Example: <Annotation tone="attention">Changed from payment record</Annotation>
import type { ReactNode } from 'react';
import { Text } from '@mantine/core';
import type { RemitterSource } from '../types';
import { InfoIcon, WarningIcon } from './Icons';

export const Annotation = ({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'attention';
  children: ReactNode;
}) => {
  const attention = tone === 'attention';
  return (
    <Text
      component="span"
      fz="sm"
      fw={attention ? 600 : 400}
      c={attention ? 'var(--mantine-color-yellow-light-color)' : 'dimmed'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
    >
      {attention ? <WarningIcon /> : <InfoIcon />}
      {children}
    </Text>
  );
};

// IncompleteLabel — the text cue beside a section that has a real problem, so a warning
// border is never the only signal.
// Example: {invalid && <IncompleteLabel />}
export const IncompleteLabel = ({ children = 'Incomplete' }: { children?: ReactNode }) => (
  <Annotation tone="attention">{children}</Annotation>
);

// RemitterSourceAnnotation — where a fee's remitter came from. Anything other than the
// payment record needs checking, so it's marked for attention.
// Example: <RemitterSourceAnnotation source={fee.remitterSource} />
export const RemitterSourceAnnotation = ({ source }: { source: RemitterSource }) =>
  source === 'record' ? (
    <Annotation>From payment record</Annotation>
  ) : (
    <Annotation tone="attention">
      {source === 'manual' ? 'Entered manually' : 'Changed from payment record'}
    </Annotation>
  );

// LumpSumAnnotation — marks a fee paid as one lump sum. `together` adds "refunded together"
// where the user is choosing fees, since a lump sum can only be refunded as a whole.
// Example: <LumpSumAnnotation count={fee.items.length} together />
export const LumpSumAnnotation = ({ count, together }: { count?: number; together?: boolean }) => (
  <Annotation>
    Lump sum{count ? ` of ${count} items` : ''}
    {together ? ', refunded together' : ''}
  </Annotation>
);
