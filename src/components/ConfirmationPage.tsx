import { useState } from 'react';
import { Button, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useRefund } from '../state/RefundContext';
import { customerById } from '../data/api';
import { fmtDateTime } from '../lib/format';
import { enoteTitle } from '../lib/selectors';
import { StatusBadge, Mono, Amount, Field, FieldLabel, NotificationList, PageHeader } from '../ui';
import RequestModal from './RequestModal';

export default function ConfirmationPage() {
  const { lastSubmitted, setView } = useRefund();
  const [modalOpen, setModalOpen] = useState(false);
  if (!lastSubmitted) return null;
  const customer = customerById(lastSubmitted.customer);

  return (
    <Stack gap="lg">
      <PageHeader title="Request Submitted to the OCFO" />

      <Paper p="lg">
        <FieldLabel>Request ID</FieldLabel>
        <Mono fz={32} fw={500}>
          {lastSubmitted.id}
        </Mono>
        <Text mt={6} maw={640}>
          Submitted {fmtDateTime(lastSubmitted.submittedAt)}. This ID identifies the request through
          OCFO review and final disposition; use it in any correspondence.
        </Text>

        <Divider my="md" />
        <dl className="field-row">
          <Field label="Status">
            <StatusBadge status={lastSubmitted.status} />
          </Field>
          <Field label="Customer">
            <Text inherit>{customer.name}</Text>
            <Text inherit c="dimmed">
              Customer ID <Mono fz={13} c="inherit">{customer.id}</Mono>
            </Text>
          </Field>
          <Field label="Fees">{lastSubmitted.fees.length}</Field>
          <Field label="Total refund">
            <Amount cents={lastSubmitted.total} fw={600} />
          </Field>
        </dl>
        <Divider my="md" />

        <Title order={2} fz="md" mb="xs">
          {enoteTitle({ notified: lastSubmitted.notifications })}
        </Title>
        <NotificationList notifications={lastSubmitted.notifications} />

        <Group mt="lg" gap="sm">
          <Button onClick={() => setModalOpen(true)}>View Request Details</Button>
          <Button variant="default" onClick={() => setView('home')}>
            Back to Refund Requests
          </Button>
        </Group>
      </Paper>

      <RequestModal
        requestId={modalOpen ? lastSubmitted.id : null}
        onClose={() => setModalOpen(false)}
      />
    </Stack>
  );
}
