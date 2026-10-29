import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useRefund } from '../state/RefundContext';
import { CUSTOMERS } from '../data/mockData';
import { Mono, DiscardDraftButton } from './shared';
import CustomerSearch from './CustomerSearch';
import HistoryTable from './HistoryTable';

export default function HomePage() {
  const { currentUser, draft, resumeDraft } = useRefund();
  const draftCustomer = draft ? CUSTOMERS[draft.customer] : null;
  const office = currentUser.office;

  return (
    <Stack gap="lg">
      <div>
        <Title order={1} id="page-heading" tabIndex={-1}>
          Fee Refund Requests
        </Title>
        <Text c="dimmed" mt={6} maw={640}>
          Look up a customer account, select the fees eligible for refund, and submit a refund
          request to the Office of the Chief Financial Officer (OCFO) for review. Every request from
          the {office}, with its current status, is listed below.
        </Text>
      </div>

      {draft ? (
        // The draft belongs to the office, not to one person (one draft at a time per office), so
        // the copy speaks at the office level and names whoever started it. A white card with a
        // primary-blue accent bar (5.2:1 on white) makes it prominent without the amber that means
        // something is wrong.
        <Paper
          withBorder
          radius="sm"
          p="md"
          style={{ borderLeft: '4px solid var(--mantine-color-brand-6)' }}
        >
          <Group justify="space-between" wrap="nowrap" gap="lg">
            <Text maw={760}>
              <Text component="span" fw={600}>
                The {office} has a draft in progress
              </Text>{' '}
              for {draftCustomer.name} (<Mono>{draft.customer}</Mono>), started by{' '}
              {draft.createdBy.name}.
            </Text>
            <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
              <DiscardDraftButton />
              <Button size="sm" onClick={resumeDraft}>
                Resume Draft
              </Button>
            </Group>
          </Group>
        </Paper>
      ) : (
        <CustomerSearch />
      )}

      <HistoryTable />
    </Stack>
  );
}
