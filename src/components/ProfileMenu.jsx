import { useState } from 'react';
import { Avatar, Button, Divider, Popover, Stack, Text, UnstyledButton } from '@mantine/core';
import { useRefund } from '../state/RefundContext';
import { DEMO_ACCOUNTS, ROLE_LABEL } from '../data/mockData';
import { Chevron, Field, FieldLabel } from './shared';

const initials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

// The signed-in user's login info, from the auth system in production: name, email, role and
// office. A popover (dialog), not a menu, because most of it is information rather than actions.
// Focus moves into it when it opens; Escape closes it and returns focus to the trigger.
//
// "Switch to …" is demo only, so the POC can show both roles. In production, replace it with the
// account actions the auth system provides (typically Sign Out).
export default function ProfileMenu() {
  const { currentUser, signInAs } = useRefund();
  const [opened, setOpened] = useState(false);
  const role = ROLE_LABEL[currentUser.role];
  const others = DEMO_ACCOUNTS.filter((a) => a.email !== currentUser.email);

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      width={320}
      shadow="md"
      trapFocus
      returnFocus
      closeOnEscape
    >
      <Popover.Target>
        <UnstyledButton
          className="profile-trigger"
          onClick={() => setOpened((o) => !o)}
          aria-label={`Account: ${currentUser.name}, ${role}`}
        >
          <Avatar size={28} radius="xl" className="profile-avatar" aria-hidden="true">
            {initials(currentUser.name)}
          </Avatar>
          <Text component="span" fz="sm" fw={600} inherit>
            {currentUser.name}
          </Text>
          <Chevron dir="down" size={12} />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown p="md">
        <Text fw={600}>{currentUser.name}</Text>
        <Text fz="sm" c="dimmed">
          {currentUser.email}
        </Text>
        <dl className="field-stack" style={{ marginTop: 'var(--mantine-spacing-sm)' }}>
          <Field label="Role">{role}</Field>
          <Field label="Office">{currentUser.office}</Field>
        </dl>
        <Divider my="sm" />
        <FieldLabel mb="xs">Demo only: switch account</FieldLabel>
        <Stack gap="xs">
          {others.map((a) => (
            <Button
              key={a.email}
              variant="default"
              size="sm"
              fullWidth
              onClick={() => {
                setOpened(false);
                signInAs(a);
              }}
            >
              Switch to {a.name} ({ROLE_LABEL[a.role]})
            </Button>
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
