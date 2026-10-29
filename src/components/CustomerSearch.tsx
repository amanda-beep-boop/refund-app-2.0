import { useState } from 'react';
import {
  Anchor,
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
import { Mono, Chevron, CustomerSummary } from './shared';

const SAMPLE_IDS = listSampleCustomerIds();

export default function CustomerSearch() {
  const { startDraft, requests } = useRefund();
  const [query, setQuery] = useState('');
  // undefined = no search yet; null = no match; object = found customer
  const [result, setResult] = useState<Customer | null | undefined>(undefined);
  const [searched, setSearched] = useState('');

  const lookUp = (raw: string) => {
    const id = raw.trim().toUpperCase();
    setSearched(id);
    setResult(id ? findCustomer(id) : undefined);
  };
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
    <Paper withBorder radius="sm" p="md">
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

      {/* Announces the search outcome to screen readers. */}
      <div role="status" aria-live="polite">
        {result === null && (
          <Paper withBorder radius="sm" p="md" mt="md" style={{ borderStyle: 'dashed' }}>
            <Text>
              No account matches <Mono>{searched}</Mono>. Check the ID and try again.
            </Text>
          </Paper>
        )}
        {result && (
          <VisuallyHidden>
            Found {result.name}, {result.id}.
          </VisuallyHidden>
        )}
      </div>

      {result && (
        <Card withBorder radius="sm" p="lg" mt="md">
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
