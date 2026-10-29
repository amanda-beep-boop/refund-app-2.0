import { Button, Group, Paper, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { useRefund } from '../state/RefundContext';
import { accountAge, fmtDate } from '../lib/format';
import { Mono, Field, DiscardDraftButton } from './shared';
import Step1SelectFees from './Step1SelectFees';
import Step2Details from './Step2Details';
import Step3Review from './Step3Review';

export const STEP_TITLES = ['Select fees', 'Confirm details', 'Review & submit'];

export default function FlowPage() {
  const { step, customer, saveAndExit } = useRefund();

  return (
    <Stack gap="lg">
      {/* Progress is the title plus one line; the Continue buttons also name the next step. Focus
          moves to the title on each step change, so its hidden prefix announces the step count.
          The draft actions sit on the title's row, right-aligned with the cards below. */}
      <div>
        <Group justify="space-between" align="center" wrap="wrap">
          <Title order={1} id="page-heading" tabIndex={-1}>
            <VisuallyHidden>
              Step {step} of {STEP_TITLES.length}:{' '}
            </VisuallyHidden>
            {STEP_TITLES[step - 1]}
          </Title>
          <Group gap="xs">
            <DiscardDraftButton />
            <Button size="sm" variant="default" onClick={saveAndExit}>
              Save draft &amp; exit
            </Button>
          </Group>
        </Group>
        <Text fz="sm" c="dimmed" mt={4}>
          <span aria-hidden="true">
            Step {step} of {STEP_TITLES.length}.{' '}
          </span>
          {step < STEP_TITLES.length ? `Next: ${STEP_TITLES[step]}` : 'Last step'}
        </Text>
      </div>

      {/* A white card like the customer card on the home page. Light blue is reserved for
          selected rows, so it isn't used for anything else. */}
      <Paper withBorder radius="sm" p="md">
        <dl className="field-grid">
          <Field label="Customer">
            <Text inherit>{customer.name}</Text>
            <Text inherit c="dimmed">
              Customer ID <Mono fz={13} c="inherit">{customer.id}</Mono>
            </Text>
          </Field>
          <Field label="Team">{customer.team}</Field>
          <Field label="Position">{customer.position}</Field>
          <Field label="Account age">
            <Text inherit>{accountAge(customer.accountOpened)}</Text>
            <Text inherit c="dimmed">
              Since {fmtDate(customer.accountOpened)}
            </Text>
          </Field>
        </dl>
      </Paper>

      {step === 1 && <Step1SelectFees />}
      {step === 2 && <Step2Details />}
      {step === 3 && <Step3Review />}
    </Stack>
  );
}
