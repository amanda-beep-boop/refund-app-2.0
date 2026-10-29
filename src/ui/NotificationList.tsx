// NotificationList — who E-Note notified and how: the recipient's role and name, then the
// delivery it made.
//
// Use for: an E-Note event, on the confirmation page and in a request's Activity.
// Rule: rendered as a list, so screen readers announce how many deliveries there were.
// Example: <NotificationList notifications={request.notifications} />
import { Group, Stack, Text } from '@mantine/core';
import type { Notification } from '../types';
import { deliveryLabel } from '../lib/selectors';

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
