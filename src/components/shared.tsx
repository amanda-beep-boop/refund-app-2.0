import { useState, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Title,
  VisuallyHidden,
  type MantineSize,
  type TextProps,
  type TitleOrder,
} from '@mantine/core';
import type { Customer, Notification, RemitterSource, Status } from '../types';
import { STATUS_META } from '../theme';
import { useRefund } from '../state/RefundContext';
import { fmt } from '../lib/format';
import { deliveryLabel } from '../lib/selectors';

// Two ways to mark something, and only two:
// - StatusBadge: a filled pill, reserved for a request's workflow status. Nothing else is filled,
//   so a filled shape is never mistaken for a control.
// - Annotation: an icon plus text, no fill or border, for flags about a piece of data. Neutral
//   (gray) states a fact; attention (amber) marks something the user should check, such as
//   anything that departs from the system of record or is incomplete.
export const StatusBadge = ({ status }: { status: Status }) => (
  // Never truncated: a cut-off status hides what the pill is for. Its column widens instead.
  <Badge
    variant="light"
    color={STATUS_META[status].color}
    radius="xl"
    size="lg"
    fw={600}
    tt="none"
    styles={{ root: { maxWidth: 'none', flexShrink: 0 }, label: { overflow: 'visible' } }}
  >
    {STATUS_META[status].label}
  </Badge>
);

// Text props plus the element to render as, for components that wrap Mantine's Text.
type TextLike = Omit<TextProps, 'component'> & { component?: ElementType; children?: ReactNode; id?: string };
// Mantine's Text is polymorphic over its `component`. Narrowing the element type here keeps the
// wrappers' `component` open to any element while every other prop stays checked.
const asElement = (component: ElementType) => component as 'p';

// Identifiers only (customer, fee, request IDs). Amounts use <Amount>.
export const Mono = ({ children, component = 'span', ...props }: TextLike) => (
  <Text component={asElement(component)} ff="monospace" fz="sm" {...props}>
    {children}
  </Text>
);

// Dollar amount in the body font with tabular figures, so columns of amounts line up.
export const Amount = ({ cents, ...props }: TextProps & { cents: number }) => (
  <Text component="span" inherit className="tabular" {...props}>
    {fmt(cents)}
  </Text>
);

// Small sentence-case label above a value.
export const FieldLabel = ({ children, component = 'p', ...props }: TextLike) => (
  <Text component={asElement(component)} fz="sm" fw={600} c="dimmed" {...props}>
    {children}
  </Text>
);

// A label above its value. Values are 14px; pass several lines as children with the first dark
// and any details after it gray (<Text inherit c="dimmed">).
// Renders a term/description pair, so it must sit inside a <dl>: screen readers then announce
// each value with its label.
export const Field = ({ label, children }: { label: ReactNode; children: ReactNode }) => (
  <div>
    <dt>
      <FieldLabel component="span">{label}</FieldLabel>
    </dt>
    <dd>
      <Text component="div" fz="sm" mt={2}>
        {children}
      </Text>
    </dd>
  </div>
);

// Groups related controls under a legend without the visual weight of Mantine's Fieldset.
// `heading` (a level) makes the legend a heading, for a group that is one of the page's main
// decisions: it reads as one, and screen reader users can reach it with heading navigation.
export const FieldGroup = ({
  legend,
  heading,
  children,
  ...props
}: { legend: ReactNode; heading?: TitleOrder; children: ReactNode } & ComponentPropsWithoutRef<'fieldset'>) => (
  <fieldset className="plain-fieldset" {...props}>
    <legend>
      {heading ? (
        <Title order={heading} fz="md">
          {legend}
        </Title>
      ) : (
        <FieldLabel component="span">{legend}</FieldLabel>
      )}
    </legend>
    {children}
  </fieldset>
);

// Who the customer is, the same everywhere: full name as the heading, customer ID beside it.
export const CustomerSummary = ({
  customer,
  order = 2,
}: {
  customer: Pick<Customer, 'id' | 'name'>;
  order?: TitleOrder;
}) => (
  <Group gap="sm" align="baseline" wrap="wrap">
    <Title order={order} fz="lg">
      {customer.name}
    </Title>
    <Mono c="dimmed">
      <VisuallyHidden>Customer ID </VisuallyHidden>
      {customer.id}
    </Mono>
  </Group>
);

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

// Text cue for incomplete sections, so the warning border isn't the only signal.
export const IncompleteLabel = ({ children = 'Incomplete' }: { children?: ReactNode }) => (
  <Annotation tone="attention">{children}</Annotation>
);

const WarningIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M8 1.5 15 14H1L8 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8 6v3.5M8 11.6v.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 7.2v4M8 4.6v.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// Marks a row that can't be selected. Decorative; pair it with text for assistive technology.
// Drawn in currentColor, so in the secondary gray it keeps 3:1 against white (WCAG 1.4.11).
export const LockIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" style={{ display: 'block' }}>
    <rect x="3" y="7" width="10" height="7.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

// Decorative chevron for buttons and disclosures; hidden from assistive technology.
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

// Explains why the adjacent primary button is disabled. Polite live region so the hint is
// announced as it changes.
export const DisabledHint = ({ items }: { items: string[] }) => (
  <div role="status" aria-live="polite">
    {items.length > 0 && (
      // Gray, not amber: it's guidance about what's left to do, not a warning. Secondary gray
      // meets 4.5:1 on the canvas (WCAG 1.4.3), and the words carry the meaning, not the color.
      <Text fz="sm" c="dimmed">
        <Text component="span" fw={600} inherit>
          To continue:
        </Text>{' '}
        {items.join('; ')}.
      </Text>
    )}
  </div>
);

// Discarding a draft can't be undone, so it always asks first.
export const DiscardDraftButton = ({ size = 'sm' }: { size?: MantineSize }) => {
  const { discardDraft } = useRefund();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={size} variant="subtle" color="red" onClick={() => setOpen(true)}>
        Discard Draft
      </Button>
      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Discard This Draft?"
        centered
        closeButtonProps={{ 'aria-label': 'Close' }}
      >
        <Text>
          The draft's fees, amounts and details will be deleted for everyone in the office. This
          can't be undone.
        </Text>
        <Group justify="flex-end" mt="lg" gap="xs">
          <Button variant="default" onClick={() => setOpen(false)} data-autofocus>
            Keep Draft
          </Button>
          <Button
            color="red"
            onClick={() => {
              setOpen(false);
              discardDraft();
            }}
          >
            Discard Draft
          </Button>
        </Group>
      </Modal>
    </>
  );
};

// Who E-Note notified and how: the recipient's name, then the delivery it made.
export const NotificationList = ({ notifications }: { notifications: Notification[] }) => (
  <Stack gap="xs" component="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
    {notifications.map((n, i) => (
      <Group key={i} gap="md" wrap="nowrap" align="baseline" component="li">
        <Text fz="sm" fw={600} c="dimmed" w={90} style={{ flexShrink: 0 }}>
          {n.role}
        </Text>
        <div>
          <Text fz="sm">{n.name}</Text>
          <Text fz="sm" c="dimmed">
            {deliveryLabel(n)}
          </Text>
        </div>
      </Group>
    ))}
  </Stack>
);

// Where a fee's remitter came from. Anything other than the payment record needs checking.
export const RemitterSourceAnnotation = ({ source }: { source: RemitterSource }) =>
  source === 'record' ? (
    <Annotation>From payment record</Annotation>
  ) : (
    <Annotation tone="attention">
      {source === 'manual' ? 'Entered manually' : 'Changed from payment record'}
    </Annotation>
  );

// `together` adds "refunded together" where the user is choosing fees.
export const LumpSumAnnotation = ({ count, together }: { count?: number; together?: boolean }) => (
  <Annotation>
    Lump sum{count ? ` of ${count} items` : ''}
    {together ? ', refunded together' : ''}
  </Annotation>
);
