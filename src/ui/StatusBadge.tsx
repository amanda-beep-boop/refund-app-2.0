// StatusBadge — a request's workflow status as a filled pill.
//
// Use for: a request's status wherever it appears (the history table, the record modal's
// title, the confirmation page).
// Don't use for: anything that isn't a workflow status. Flags about a piece of data use
// <Annotation>.
// Rule: this is the only filled shape in the app, so a filled pill is never mistaken for a
// control. It's never truncated: a cut-off status hides what the pill is for, so its column
// widens instead.
// Example: <StatusBadge status="review" />
import { Badge } from '@mantine/core';
import type { Status } from '../types';
import { STATUS_META } from '../theme';

export const StatusBadge = ({ status }: { status: Status }) => (
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
