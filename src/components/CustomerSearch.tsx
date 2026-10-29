import { useRef, useState } from 'react';
import {
  Anchor,
  Box,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  VisuallyHidden,
} from '@mantine/core';
import { useRefund } from '../state/RefundContext';
import type { FormEvent } from 'react';
import type { Customer } from '../types';
import { findCustomer, listSampleCustomerIds } from '../data/api';
import { feeRequest } from '../lib/selectors';
import { Mono, Chevron, CustomerSummary, ErrorNotice, LoadingNotice } from '../ui';

const SAMPLE_IDS = listSampleCustomerIds();

// Where a lookup stands: nothing searched yet, waiting, found, no such customer, or the call failed.
type Lookup =
  | { status: 'idle' }
  | { status: 'loading'; id: string }
  | { status: 'found'; customer: Customer }
  | { status: 'none'; id: string }
  | { status: 'error'; id: string };

export default function CustomerSearch() {
  const { startDraft, requests } = useRefund();
  const [query, setQuery] = useState('');
  const [lookup, setLookup] = useState<Lookup>({ status: 'idle' });
  // Only the latest search may set the outcome, if an earlier one is still in flight.
  const latest = useRef(0);

  const lookUp = (raw: string) => {
    const id = raw.trim().toUpperCase();
    const seq = ++latest.current;
    if (!id) {
      setLookup({ status: 'idle' });
      return;
    }
    setLookup({ status: 'loading', id });
    findCustomer(id)
      .then((customer) => {
        if (seq !== latest.current) return;
        setLookup(customer ? { status: 'found', customer } : { status: 'none', id });
      })
      .catch(() => {
        if (seq === latest.current) setLookup({ status: 'error', id });
      });
  };
  const result = lookup.status === 'found' ? lookup.customer : null;
  const search = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    lookUp(query);
  };
  // Demo only: a sample ID fills the field and runs the search.
  const trySample = (id: string) => {
    setQuery(id);
    lookUp(id);
  };

  return (
    <Paper p="md">
      <Title order={2} fz="lg" mb="sm">
        Start a New Refund Request
      </Title>
      <form onSubmit={search}>
        <Group align="flex-end" gap="sm">
          {/* Monospace on the input only; ff would also set the label. */}
          <TextInput
            label="Customer ID"
            placeholder="C-000000"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
            w={320}
            maw="100%"
          />
          <Button type="submit">Search</Button>
        </Group>
      </form>
      <Text fz="sm" c="dimmed" mt="xs">
        Sample accounts:{' '}
        {SAMPLE_IDS.map((id, i) => (
          <span key={id}>
            {i > 0 && ', '}
            {/* Underlined: inside gray text, color alone doesn't mark it as a link (WCAG 1.4.1). */}
            <Anchor
              component="button"
              type="button"
              ff="monospace"
              fz={13}
              underline="always"
              onClick={() => trySample(id)}
            >
              {id}
            </Anchor>
          </span>
        ))}
      </Text>

      {lookup.status === 'loading' && (
        <Box mt="md">
          <LoadingNotice>Looking up {lookup.id}…</LoadingNotice>
        </Box>
      )}
      {lookup.status === 'error' && (
        <Box mt="md">
          <ErrorNotice
            title="Couldn't look up the customer"
            action="Search Again"
            onAction={() => lookUp(lookup.id)}
          >
            The payment system didn't respond. Nothing was changed.
          </ErrorNotice>
        </Box>
      )}
      {/* Announces the search outcome to screen readers. */}
      <div role="status" aria-live="polite">
        {lookup.status === 'none' && (
          <Text fz="sm" c="dimmed" mt="md">
            No account matches <Mono fz={13} c="inherit">{lookup.id}</Mono>. Check the ID and search
            again.
          </Text>
        )}
        {result && (
          <VisuallyHidden>
            Found {result.name}, {result.id}.
          </VisuallyHidden>
        )}
      </div>

      {result && (
        <Card p="lg" mt="md">
          <Group justify="space-between" align="center" wrap="wrap">
            <Stack gap={4} style={{ flex: 1, minWidth: 260 }}>
              <CustomerSummary customer={result} order={3} />
              <Text fz="sm" c="dimmed">
                {result.fees.filter((f) => !feeRequest(f.id, requests)).length} of{' '}
                {result.fees.length} paid fees available for refund
              </Text>
            </Stack>
            <Button onClick={() => startDraft(result.id)} rightSection={<Chevron />}>
              Start Refund Request
            </Button>
          </Group>
        </Card>
      )}
    </Paper>
  );
}
