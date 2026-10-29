import { useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Checkbox,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Title,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core';
import { useRefund } from '../state/RefundContext';
import { STATUS_META } from '../theme';
import { fmtDate } from '../lib/format';
import { feeRequest, paymentMethodLabel } from '../lib/selectors';
import {
  Mono,
  Amount,
  Annotation,
  LumpSumAnnotation,
  Chevron,
  DisabledHint,
  LockIcon,
} from './shared';
import RequestModal from './RequestModal';

const COLUMNS = 6;

export default function Step1SelectFees() {
  const { customer, draft, requests, toggleFee, toggleCollapsed, setStep } = useRefund();
  const [openId, setOpenId] = useState(null);
  const [showLocked, setShowLocked] = useState(false);
  const selectedCount = draft.selected.size;
  const eligibleCents = customer.fees
    .filter((f) => draft.selected.has(f.id))
    .reduce((s, f) => s + f.cents, 0);

  // Fees already in a request can't be requested again. They're grouped after the selectable
  // fees, read-only, so the analyst knows about them without having to read past them.
  const withPrior = customer.fees.map((fee) => ({ fee, prior: feeRequest(fee.id, requests) }));
  const available = withPrior.filter((r) => !r.prior);
  const locked = withPrior.filter((r) => r.prior);

  const renderFee = ({ fee, prior }) => {
    const isSelected = draft.selected.has(fee.id);
    const isOpen = fee.items && !draft.collapsed.has(fee.id);
    const checkboxId = `include-${fee.id}`;
    const priorRefund = prior?.fees.find((f) => f.id === fee.id).refund;
    return [
      <Table.Tr key={fee.id} bg={isSelected ? 'brand.0' : undefined} c={prior ? 'dimmed' : undefined}>
        <Table.Td>
          {prior ? (
            // A lock, not a disabled checkbox: a grayed-out box reads as checked or broken.
            <Box c="dimmed" pt={2} pl={2}>
              <LockIcon />
              <VisuallyHidden>Can't be selected</VisuallyHidden>
            </Box>
          ) : (
            <Checkbox
              id={checkboxId}
              checked={isSelected}
              onChange={() => toggleFee(fee)}
              aria-label={`Include ${fee.desc} (${fee.id})`}
            />
          )}
        </Table.Td>
        <Table.Td px={4}>
          {fee.items && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={() => toggleCollapsed(fee.id)}
              aria-expanded={Boolean(isOpen)}
              aria-label={`${isOpen ? 'Hide' : 'Show'} items for ${fee.desc}`}
            >
              <Chevron dir={isOpen ? 'down' : 'right'} />
            </ActionIcon>
          )}
        </Table.Td>
        <Table.Td>
          {prior ? (
            <Text inherit>{fee.desc}</Text>
          ) : (
            <Text component="label" htmlFor={checkboxId} inherit style={{ cursor: 'pointer' }}>
              {fee.desc}
            </Text>
          )}
          <Text inherit c="dimmed">
            Fee ID <Mono fz={13} c="inherit">{fee.id}</Mono>
          </Text>
          {fee.items && (
            <Box mt={4}>
              <LumpSumAnnotation count={fee.items.length} together />
            </Box>
          )}
          {prior && (
            <Box mt={4}>
              {/* One span: Annotation spaces its children apart, which would put a gap before the
                  parenthesis. The link is underlined because color alone doesn't set it apart
                  from the gray text around it (WCAG 1.4.1). */}
              <Annotation>
                <span>
                  {prior.status === 'approved' ? 'Refunded in' : 'In request'}{' '}
                  <Anchor
                    component="button"
                    type="button"
                    ff="monospace"
                    fz={13}
                    underline="always"
                    onClick={() => setOpenId(prior.id)}
                  >
                    {prior.id}
                  </Anchor>
                  {prior.status !== 'approved' && ` (${inSentence(STATUS_META[prior.status].label)})`}
                </span>
              </Annotation>
            </Box>
          )}
        </Table.Td>
        <Table.Td style={{ whiteSpace: 'nowrap' }}>{fmtDate(fee.date)}</Table.Td>
        <Table.Td>
          <Text inherit>{paymentMethodLabel(fee)}</Text>
          <Text inherit c="dimmed">
            {accountLine(fee)}
          </Text>
        </Table.Td>
        <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>
          <Amount cents={fee.cents} />
          {prior && priorRefund < fee.cents && (
            <Text inherit>
              <Amount cents={priorRefund} /> requested
            </Text>
          )}
        </Table.Td>
      </Table.Tr>,
      ...(isOpen
        ? fee.items.map((item, i) => (
            <Table.Tr key={`${fee.id}-item-${i}`} bg="var(--surface-inset)">
              <Table.Td />
              <Table.Td />
              <Table.Td style={{ paddingLeft: 22, borderLeft: '3px solid var(--border-strong)' }}>
                <Text inherit>
                  <VisuallyHidden>Item in {fee.desc}: </VisuallyHidden>
                  {item.desc}
                </Text>
              </Table.Td>
              <Table.Td colSpan={2} />
              {/* Gray, so item amounts aren't read as more fees. */}
              <Table.Td ta="right" c="dimmed">
                <Amount cents={item.cents} />
              </Table.Td>
            </Table.Tr>
          ))
        : []),
    ];
  };

  return (
    <>
      <Paper withBorder radius="sm">
        <Box p="md">
          <Title order={2} fz="lg">
            Paid Fees
          </Title>
          <Text fz="sm" c="dimmed" mt={2}>
            Check each fee to include.
          </Text>
        </Box>
        <Table.ScrollContainer minWidth={900}>
          <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm" styles={{ td: { verticalAlign: 'top' } }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={44}>
                  <VisuallyHidden>Include</VisuallyHidden>
                </Table.Th>
                <Table.Th w={40}>
                  <VisuallyHidden>Items</VisuallyHidden>
                </Table.Th>
                <Table.Th miw={240} w="38%">
                  Fee
                </Table.Th>
                <Table.Th>Paid On</Table.Th>
                <Table.Th>Payment</Table.Th>
                <Table.Th ta="right">Amount</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {available.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={COLUMNS}>
                    <Text inherit c="dimmed">
                      Every paid fee for this customer is already in a refund request.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {available.map(renderFee)}
            </Table.Tbody>
            {locked.length > 0 && (
              // A disclosure, collapsed by default: these fees are context, not something to act
              // on. The heading wraps the button (WAI-ARIA disclosure pattern), so the group is
              // still reachable by heading navigation; aria-expanded announces its state, and the
              // `hidden` rows are skipped by screen readers and Tab while collapsed. The label
              // stays the same either way; only the chevron and the state change.
              <>
                <Table.Tbody className="group-divider">
                  <Table.Tr>
                    <Table.Td colSpan={COLUMNS}>
                      <Title order={3} fz="sm" fw={600}>
                        <UnstyledButton
                          onClick={() => setShowLocked((v) => !v)}
                          aria-expanded={showLocked}
                          aria-controls="locked-fees"
                          fz="sm"
                          fw={600}
                          mih={32}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                        >
                          <Chevron dir={showLocked ? 'down' : 'right'} />
                          Already in a Refund Request ({locked.length})
                        </UnstyledButton>
                      </Title>
                      {showLocked && (
                        <Text inherit c="dimmed" pl={22} mt={6}>
                          Shown for reference. A fee can be requested only once.
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
                <Table.Tbody id="locked-fees" hidden={!showLocked}>
                  {locked.map(renderFee)}
                </Table.Tbody>
              </>
            )}
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Text>
          <Text component="span" fw={600}>
            {selectedCount}
          </Text>{' '}
          fee{selectedCount === 1 ? '' : 's'} selected, totaling{' '}
          <Amount cents={eligibleCents} fw={600} />
        </Text>
        <Stack gap={4} align="flex-end">
          <Button disabled={!selectedCount} onClick={() => setStep(2)} rightSection={<Chevron />}>
            Continue to Details
          </Button>
          <DisabledHint items={selectedCount ? [] : ['select at least one fee']} />
        </Stack>
      </Group>

      <RequestModal requestId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

// Status labels are title case on their own ("Under OCFO Review"); mid-sentence they're lowercase
// except for acronyms ("under OCFO review").
const inSentence = (s) =>
  s
    .split(' ')
    .map((w) => (w === w.toUpperCase() ? w : w.toLowerCase()))
    .join(' ');

// The account a fee was paid from. Services such as PayPal are their own "bank", so only the
// account (an email address) is shown for them. Numbers use non-breaking spaces so they never
// split across lines.
const accountLine = (fee) =>
  fee.bank === fee.method ? fee.acct : `${fee.bank} account ${fee.acct.replace(/ /g, ' ')}`;
