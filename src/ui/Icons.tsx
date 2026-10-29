// Icons — the app's few icons, drawn inline in currentColor so they take the text color
// around them.
//
// Rule: every icon is decorative (aria-hidden) and is always paired with text, visible or
// visually hidden, that carries the meaning. Drawn in currentColor, a gray icon keeps 3:1
// against white (WCAG 1.4.11).
// - Chevron: expand, collapse, or "go" on a button. Chevrons mean only that in this app.
// - ArrowDownIcon: a link that jumps further down the same page, not a chevron.
// - LockIcon: a row that can't be selected (never a disabled checkbox).
// - InfoIcon / WarningIcon: used by <Annotation>.
// - MailIcon: an E-Note delivery in a timeline.
// Example: <Chevron dir={open ? 'down' : 'right'} />

export const Chevron = ({ dir = 'right', size = 14 }: { dir?: 'right' | 'down' | 'left'; size?: number }) => {
  const rotate = { right: 0, down: 90, left: 180 }[dir];
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ transform: `rotate(${rotate}deg)`, transition: 'transform 120ms' }}
    >
      <path
        d="M4 2l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ArrowDownIcon = () => (
  <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true" style={{ flexShrink: 0 }}>
    <path
      d="M8 2.5v10M3.5 8.5 8 13l4.5-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LockIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" style={{ display: 'block' }}>
    <rect x="3" y="7" width="10" height="7.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const InfoIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 7.2v4M8 4.6v.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const WarningIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M8 1.5 15 14H1L8 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8 6v3.5M8 11.6v.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const MailIcon = () => (
  <svg viewBox="0 0 16 16" width={10} height={10} aria-hidden="true">
    <rect x="1.5" y="3.5" width="13" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="m2 4.5 6 4.5 6-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
