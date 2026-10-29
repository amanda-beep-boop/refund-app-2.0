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
import { useRefund } from '../state/RefundContext';
import { fmt, fmtDate, dollars, methodLabel, capitalize } from '../lib/format';
import {
  amountEntered,
  amountValid,
  remitterSource,
  remitterValid,
  refundCents,
  paidLabel,
  refundMethodLabel,
} from '../lib/selectors';
import { Mono, Amount, FieldGroup, IncompleteLabel, RemitterSourceAnnotation, LumpSumAnnotation } from './shared';

export default function FeeCard({ fee }) {
  const { draft, setAmount, setRemitter, restoreRemitter } = useRefund();
  const amount = draft.amounts[fee.id];
  const remitter = draft.remitters[fee.id];
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
  const amountRef = useRef(null);
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
          <Group gap="md" align="baseline">
            <Text fz="sm" c="dimmed">
              Fee ID <Mono fz={13} c="inherit">{fee.id}</Mono>
            </Text>
            {fee.items && <LumpSumAnnotation count={fee.items.length} />}
          </Group>
        </div>
        <Text fz="sm">
          Paid {fmtDate(fee.date)}:{' '}
          <Text component="span" inherit c="dimmed">
            {paidLabel(fee)}
          </Text>
        </Text>
      </Group>

      <Group p="md" gap="xl" align="flex-start" wrap="wrap">
        <FieldGroup legend="Refund amount" style={{ flex: '1 1 240px', minWidth: 240 }}>
          <Stack gap="xs">
            <Group gap="sm" align={partial ? 'flex-start' : 'center'}>
              <SegmentedControl
                size="sm"
                data={[
                  { value: 'full', label: 'Full' },
                  { value: 'partial', label: 'Partial' },
                ]}
                value={amount.mode}
                onChange={(mode) => {
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
              ) : (
                <Text fz="sm">
                  Refunding the full <Amount cents={fee.cents} />
                </Text>
              )}
            </Group>
            {/* The message sits under the whole row; inside the narrow input it wraps to 3 lines. */}
            {amountError && (
              <Text fz="sm" c="var(--mantine-color-error)" role="alert">
                {amountError}
              </Text>
            )}
            {partial && amountOk && (
              <Text fz="sm">
                Refunding <Amount cents={partialCents} /> of <Amount cents={fee.cents} />
              </Text>
            )}
            {partial && !amountEntered(fee, draft) && (
              <Text fz="sm" c="dimmed">
                Enter an amount less than the full <Amount cents={fee.cents} />.
              </Text>
            )}
          </Stack>
        </FieldGroup>

        <FieldGroup legend="Remit to" style={{ flex: '1.5 1 300px', minWidth: 280 }}>
          {showForm ? (
            <Stack gap="sm">
              {!fee.remitter ? (
                <Alert color="gray" variant="light" radius="sm" p="xs">
                  The payment record has no remitter on file. Enter who this refund should go to.
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
              <Select
                label="Refund method"
                data={[
                  { value: 'original', label: capitalize(methodLabel(fee, 'original')) },
                  { value: 'check', label: capitalize(methodLabel(fee, 'check')) },
                ]}
                value={remitter.method}
                onChange={(method) => setRemitter(fee.id, { method: method || 'original' })}
              />
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
                {fee.remitter && source === 'record' && (
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() =>
                      setRemitter(fee.id, {
                        name: fee.remitter.name,
                        address: fee.remitter.address,
                        method: fee.remitter.method,
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
                <Text inherit>{remitter.name}</Text>
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
      </Group>
    </Paper>
  );
}
