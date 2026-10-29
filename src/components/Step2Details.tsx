import { useState } from 'react';
import {
  Box,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
  VisuallyHidden,
} from '@mantine/core';
import type { Customer, Fee, JustificationCode } from '../types';
import { useActiveDraft, useRefund } from '../state/RefundContext';
import { JUSTIFICATIONS } from '../data/mockData';
import { fmtDate } from '../lib/format';
import {
  amountEntered,
  amountValid,
  justificationValid,
  justificationDefinition,
  remarkValid,
  remitterValid,
  step2Valid,
  accountLine,
} from '../lib/selectors';
import { Amount, Chevron, CustomerSummary, DisabledHint, Mono } from './shared';
import FeeCard from './FeeCard';

// Everything the system pulled up, in one place: the customer, then each selected fee as paid,
// with a lump sum's items beneath it and the total paid. The fee cards below hold only the
// decisions, so reference and decisions don't compete.
function PaidReference({ customer, fees }: { customer: Customer; fees: Fee[] }) {
  return (
    <Paper withBorder radius="sm">
      <Box p="md">
        <CustomerSummary customer={customer} />
      </Box>
      <Table fz="sm" verticalSpacing="sm" horizontalSpacing="md" styles={{ td: { verticalAlign: 'top' } }}>
        <caption>
          <VisuallyHidden>Fees in this request, as paid</VisuallyHidden>
        </caption>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fee</Table.Th>
            <Table.Th>Paid On</Table.Th>
            <Table.Th>Payment</Table.Th>
            <Table.Th ta="right">Amount</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {fees.flatMap((fee) => [
            <Table.Tr key={fee.id}>
              <Table.Td>
                <Text inherit>{fee.desc}</Text>
                <Text inherit c="dimmed">
                  Fee ID <Mono fz={13} c="inherit">{fee.id}</Mono>
                </Text>
              </Table.Td>
              <Table.Td style={{ whiteSpace: 'nowrap' }}>{fmtDate(fee.date)}</Table.Td>
              <Table.Td>
                <Text inherit>{fee.method}</Text>
                {fee.acct && (
                  <Text inherit c="dimmed">
                    {accountLine(fee)}
                  </Text>
                )}
              </Table.Td>
              <Table.Td ta="right">
                <Amount cents={fee.cents} />
              </Table.Td>
            </Table.Tr>,
            // A lump sum's items, indented under it as in Step 1. Item amounts are gray so they
            // aren't added up as more fees.
            ...(fee.items || []).map((item, i) => (
              <Table.Tr key={`${fee.id}-item-${i}`}>
                <Table.Td colSpan={3} className="item-row">
                  <VisuallyHidden>Item in {fee.desc}: </VisuallyHidden>
                  {item.desc}
                </Table.Td>
                <Table.Td ta="right" c="dimmed">
                  <Amount cents={item.cents} />
                </Table.Td>
              </Table.Tr>
            )),
          ])}
        </Table.Tbody>
        <Table.Tfoot className="total-row">
          <Table.Tr>
            <Table.Th scope="row" colSpan={3}>
              Total Paid
            </Table.Th>
            <Table.Td ta="right" fw={600}>
              <Amount cents={fees.reduce((s, f) => s + f.cents, 0)} />
            </Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>
    </Paper>
  );
}

export default function Step2Details() {
  const { fees, total, setJustification, setRemark, setStep } = useRefund();
  const { draft, customer } = useActiveDraft();
  const canContinue = step2Valid(draft);
  const justOk = justificationValid(draft);
  const remarkOk = remarkValid(draft);
  // Flag the remark only once the user has left it empty, not on arrival.
  const [remarkTouched, setRemarkTouched] = useState(false);
  const isOther = draft.justification.code === 'other';

  const missing = [
    ...fees
      .filter((f) => !amountValid(f, draft))
      .map((f) =>
        amountEntered(f, draft)
          ? `fix the refund amount for ${f.desc}`
          : `enter the partial refund amount for ${f.desc}`
      ),
    ...fees.filter((f) => !remitterValid(f, draft)).map((f) => `add the remitter for ${f.desc}`),
    ...(justOk ? [] : ['choose a justification']),
    ...(remarkOk ? [] : ['add a requester remark']),
  ];

  return (
    <>
      <PaidReference customer={customer} fees={fees} />

      <Text c="dimmed" maw={640}>
        Confirm the refund amount and the remitter for each fee. Remitter details come from the
        original payment record; change them only if the record is wrong.
      </Text>

      {fees.map((fee) => (
        <FeeCard key={fee.id} fee={fee} />
      ))}

      <Paper withBorder radius="sm">
        <Group justify="space-between" p="md" wrap="wrap">
          <Title order={2} fz="lg">
            Reason for This Request
          </Title>
          <Text fz="sm" c="dimmed">
            One justification and remark cover every fee in the request.
          </Text>
        </Group>
        <Stack p="md" pt={0} gap="sm">
          <Select
            label="Justification"
            placeholder="Select a reason"
            required
            data={JUSTIFICATIONS}
            value={draft.justification.code}
            // Select returns a string; its options are the justification codes.
            onChange={(code) => setJustification({ code: code as JustificationCode | null })}
            maw={320}
          />
          {/* The definition is recorded with the request, so show what the user is choosing. */}
          {draft.justification.code && (
            <Text fz="sm" c="dimmed" className="readable" mt={-4}>
              Definition: {justificationDefinition({ code: draft.justification.code })}
            </Text>
          )}
          {/* Required on every request, whatever the justification; for "Other" it is also where
              the user explains the reason. */}
          <Textarea
            label="Requester Remark"
            description={
              isOther
                ? "Summarize what is being refunded and explain the reason in your own words, since Other isn't a standard justification."
                : 'A short summary of what is being refunded and why.'
            }
            required
            autosize
            minRows={3}
            maw={640}
            value={draft.remark}
            onChange={(e) => setRemark(e.currentTarget.value)}
            onBlur={() => setRemarkTouched(true)}
            error={remarkTouched && !remarkOk ? 'Enter a requester remark.' : null}
          />
        </Stack>
      </Paper>

      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Text>
          <Text component="span" fw={600}>
            {fees.length}
          </Text>{' '}
          fee{fees.length === 1 ? '' : 's'}, total refund <Amount cents={total} fw={600} />
        </Text>
        <Stack gap={4} align="flex-end" maw={520}>
          <Group gap="xs">
            <Button variant="default" onClick={() => setStep(1)} leftSection={<Chevron dir="left" />}>
              Back to Fees
            </Button>
            <Button disabled={!canContinue} onClick={() => setStep(3)} rightSection={<Chevron />}>
              Continue to Review
            </Button>
          </Group>
          <DisabledHint items={missing} />
        </Stack>
      </Group>
    </>
  );
}
