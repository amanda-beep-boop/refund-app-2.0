import { useEffect, useRef } from 'react';
import {
  Alert,
  Button,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import type { Fee } from '../types';
import type { AmountMode } from '../state/draft';
import { useActiveDraft, useRefund } from '../state/RefundContext';
import { fmt, dollars, methodLabel, capitalize } from '../lib/format';
import {
  amountEntered,
  amountValid,
  checkOnly,
  remitterSource,
  remitterValid,
  refundCents,
  refundMethodLabel,
} from '../lib/selectors';
import { Mono, Amount, FieldGroup, IncompleteLabel, RemitterSourceAnnotation } from './shared';

// One card per fee holds the two decisions for it: how much to refund, and to whom. What was
// paid (date, payment method, line items) is shown once, in the reference panel above the cards.

export default function FeeCard({ fee }: { fee: Fee }) {
  const { setAmount, setRemitter, restoreRemitter } = useRefund();
  const { draft } = useActiveDraft();
  const amount = draft.amounts[fee.id];
  const remitter = draft.remitters[fee.id];
  const record = fee.remitter;
  const source = remitterSource(fee, draft);
  const partial = amount.mode === 'partial';
  const amountOk = amountValid(fee, draft);
  const remitterOk = remitterValid(fee, draft);
  const showForm = remitter.editing || (source === 'manual' && !remitter.name.trim());

  // Warnings appear only for a real problem: an amount that was entered and is wrong, or a
  // remitter field the user has left empty. A card that simply hasn't been filled in yet
  // stays neutral; the hint by the Continue button lists what's still needed.
  const amountProblem = partial && amountEntered(fee, draft) && !amountOk;
  const nameError =
    (remitter.touched || remitter.nameTouched) && !remitter.name.trim()
      ? "Enter the remitter's full name."
      : null;
  const addressError =
    (remitter.touched || remitter.addressTouched) && !remitter.address.trim()
      ? 'Enter the remittance address.'
      : null;
  const invalid = amountProblem || Boolean(nameError || addressError);
  const partialCents = refundCents(fee, draft);
  const amountError = !amountProblem
    ? null
    : partialCents >= fee.cents
      ? `Enter less than the full ${fmt(fee.cents)}. To refund all of it, choose Full.`
      : 'Enter an amount greater than $0.00.';
  // Don't flag "Entered manually" on a remitter that hasn't been entered yet.
  const showSource = source !== 'manual' || Boolean(remitter.name.trim() || remitter.address.trim());

  // Choosing Partial clears the amount and moves focus into it.
  const amountRef = useRef<HTMLInputElement>(null);
  const focusAmount = useRef(false);
  useEffect(() => {
    if (partial && focusAmount.current) {
      focusAmount.current = false;
      amountRef.current?.focus();
    }
  }, [partial]);

  return (
    <Paper
      withBorder
      radius="sm"
      component="section"
      aria-labelledby={`fee-${fee.id}-title`}
      style={invalid ? { borderColor: 'var(--border-warning)' } : undefined}
    >
      <Group justify="space-between" p="md" wrap="wrap" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <Group gap="sm" align="baseline">
            <Title order={2} fz="md" id={`fee-${fee.id}-title`}>
              {fee.desc}
            </Title>
            {invalid && <IncompleteLabel />}
          </Group>
          <Text fz="sm" c="dimmed">
            Fee ID <Mono fz={13} c="inherit">{fee.id}</Mono>
          </Text>
        </div>
        {/* Labeled "Paid" so it isn't read as the refund amount, which can differ. */}
        <Text>
          Paid{' '}
          <Text component="span" inherit fw={600}>
            <Amount cents={fee.cents} />
          </Text>
        </Text>
      </Group>

      <div className="fee-decisions">
        <FieldGroup legend="Refund Amount" heading={3}>
          <Stack gap="xs">
            <Group gap="sm" align={partial ? 'flex-start' : 'center'}>
              <SegmentedControl
                size="sm"
                data={[
                  { value: 'full', label: 'Full' },
                  { value: 'partial', label: 'Partial' },
                ]}
                value={amount.mode}
                onChange={(value) => {
                  const mode: AmountMode = value === 'partial' ? 'partial' : 'full';
                  focusAmount.current = mode === 'partial';
                  setAmount(fee.id, { mode, input: mode === 'full' ? dollars(fee.cents) : '' });
                }}
              />
              {partial ? (
                <NumberInput
                  ref={amountRef}
                  value={amount.input}
                  onChange={(value) => setAmount(fee.id, { input: String(value) })}
                  prefix="$"
                  thousandSeparator=","
                  decimalScale={2}
                  hideControls
                  w={150}
                  error={Boolean(amountError)}
                  aria-label={`Partial refund amount for ${fee.desc}, less than ${fmt(fee.cents)}`}
                />
              ) : null}
            </Group>
            {/* The message sits under the whole row; inside the narrow input it wraps to 3 lines. */}
            {amountError && (
              <Text fz="sm" c="var(--mantine-color-error)" role="alert">
                {amountError}
              </Text>
            )}
            {partial && !amountEntered(fee, draft) && (
              <Text fz="sm" c="dimmed">
                Enter an amount less than the full <Amount cents={fee.cents} />.
              </Text>
            )}
            {/* The amount that will be refunded, in one place and large, for Full and Partial
                alike. Shown only once there's a valid amount, so it never stands in for one. */}
            {(!partial || amountOk) && (
              <div>
                <Text fz="h2" fw={600} lh={1.2}>
                  <Amount cents={partial ? partialCents : fee.cents} />
                </Text>
                <Text fz="sm" c="dimmed">
                  {partial ? 'Partial' : 'Full'} refund of <Amount cents={fee.cents} /> paid
                </Text>
              </div>
            )}
          </Stack>
        </FieldGroup>

        <FieldGroup legend="Remit To" heading={3}>
          {showForm ? (
            <Stack gap="sm">
              {!fee.remitter ? (
                <Alert color="gray" variant="light" radius="sm" p="xs">
                  {checkOnly(fee)
                    ? 'Paid by money order, so the refund is a check, and the payment record has no remitter on file. Enter who the check should be mailed to.'
                    : 'The payment record has no remitter on file. Enter who this refund should go to.'}
                </Alert>
              ) : (
                <Alert color="yellow" variant="light" radius="sm" p="xs">
                  Change this only if you know the payment record is wrong. The change is noted on
                  the request sent to the OCFO.
                </Alert>
              )}
              <TextInput
                label="Remittance full name"
                required
                value={remitter.name}
                onChange={(e) => setRemitter(fee.id, { name: e.currentTarget.value })}
                onBlur={() => setRemitter(fee.id, { nameTouched: true })}
                error={nameError}
              />
              <TextInput
                label="Remittance address"
                required
                value={remitter.address}
                onChange={(e) => setRemitter(fee.id, { address: e.currentTarget.value })}
                onBlur={() => setRemitter(fee.id, { addressTouched: true })}
                error={addressError}
              />
              {/* A money order has no account to return funds to: the method is fixed, so it's
                  stated rather than offered as a choice of one. */}
              {checkOnly(fee) ? (
                <Text fz="sm">{refundMethodLabel(fee, 'check')}</Text>
              ) : (
                <Select
                  label="Refund method"
                  data={[
                    { value: 'original', label: capitalize(methodLabel(fee, 'original')) },
                    { value: 'check', label: capitalize(methodLabel(fee, 'check')) },
                  ]}
                  value={remitter.method}
                  onChange={(method) =>
                    setRemitter(fee.id, { method: method === 'check' ? 'check' : 'original' })
                  }
                />
              )}
              <Group gap="xs">
                {showSource && <RemitterSourceAnnotation source={source} />}
                <Button
                  size="sm"
                  variant="default"
                  disabled={!remitterOk}
                  onClick={() => setRemitter(fee.id, { editing: false, touched: true })}
                >
                  Done
                </Button>
                {fee.remitter && source !== 'record' && (
                  <Button size="sm" variant="subtle" onClick={() => restoreRemitter(fee)}>
                    Restore Record
                  </Button>
                )}
                {record && source === 'record' && (
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() =>
                      setRemitter(fee.id, {
                        name: record.name,
                        address: record.address,
                        method: record.method,
                        editing: false,
                      })
                    }
                  >
                    Cancel
                  </Button>
                )}
              </Group>
            </Stack>
          ) : (
            <Stack gap="xs">
              <Text component="div" fz="sm">
                <Text inherit fw={600}>
                  {remitter.name}
                </Text>
                <Text inherit c="dimmed">
                  {remitter.address}
                </Text>
                <Text inherit c="dimmed">
                  {refundMethodLabel(fee, remitter.method)}
                </Text>
              </Text>
              <Group gap="xs">
                <RemitterSourceAnnotation source={source} />
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setRemitter(fee.id, { editing: true })}
                  aria-label={`Change remitter for ${fee.desc}`}
                >
                  Change
                </Button>
                {source === 'customized' && (
                  <Button size="sm" variant="subtle" onClick={() => restoreRemitter(fee)}>
                    Restore Record
                  </Button>
                )}
              </Group>
            </Stack>
          )}
        </FieldGroup>
      </div>
    </Paper>
  );
}
