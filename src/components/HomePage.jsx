import { Alert, Button, Group, Stack, Text, Title } from '@mantine/core';
import { useRefund } from '../state/RefundContext';
import { CUSTOMERS } from '../data/mockData';
import { Mono, DiscardDraftButton } from './shared';
import CustomerSearch from './CustomerSearch';
import HistoryTable from './HistoryTable';

export default function HomePage() {
  const { draft, resumeDraft } = useRefund();
  const draftCustomer = draft ? CUSTOMERS[draft.customer] : null;

  return (
    <Stack gap="lg">
      <div>
        <Title order={1} id="page-heading" tabIndex={-1}>
          Fee Refund Requests
        </Title>
        <Text c="dimmed" mt={6} maw={640}>
          Look up a customer account, select the fees eligible for refund, and submit a refund
          request to the Office of the Chief Financial Officer (OCFO) for review. Every request
          submitted by your office, with its current status, is listed below.
        </Text>
      </div>

      {draft ? (
        <Alert color="yellow" variant="light" radius="sm">
          <Group justify="space-between" wrap="wrap">
            <Text>
              <Text component="span" fw={600}>
                You have a draft in progress
              </Text>{' '}
              for {draftCustomer.name} (<Mono>{draft.customer}</Mono>). Finish or discard it before
              starting a new request.
            </Text>
            <Group gap="xs">
              <DiscardDraftButton />
              <Button size="sm" onClick={resumeDraft}>
                Resume draft
              </Button>
            </Group>
          </Group>
        </Alert>
      ) : (
        <CustomerSearch />
      )}

      <HistoryTable />
    </Stack>
  );
}
