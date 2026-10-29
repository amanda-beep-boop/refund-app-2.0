import { useMemo, useState } from 'react';
import {
  Anchor,
  Button,
  Checkbox,
  Group,
  Menu,
  Paper,
  Select,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core';
import { useRefund } from '../state/RefundContext';
import { CUSTOMERS, SUBMITTER } from '../data/mockData';
import { STATUS_META } from '../theme';
import { fmtDate } from '../lib/format';
import { downloadHistoryCsv, downloadHistoryPdf, downloadHistoryDocx } from '../lib/exports';
import { StatusBadge, Mono, Amount, Chevron } from './shared';
import RequestModal from './RequestModal';

const COLUMNS = [
  { key: 'id', label: 'Request ID' },
  { key: 'customer', label: 'Customer' },
  { key: 'requestedBy', label: 'Requested by' },
  { key: 'submittedAt', label: 'Date submitted' },
  { key: 'status', label: 'Status' },
  { key: 'statusDate', label: 'Status date' },
  { key: 'total', label: 'Amount', align: 'right' },
];

export default function HistoryTable() {
  const { requests, draft, resumeDraft } = useRefund();
  const [filters, setFilters] = useState({ status: 'all', from: '', to: '', q: '' });
  const [sort, setSort] = useState({ key: 'submittedAt', dir: 'desc' });
  const [selected, setSelected] = useState(new Set());
  const [openId, setOpenId] = useState(null);

  const allRows = useMemo(() => {
    const rows = requests.map((r) => ({
      id: r.id,
      isDraft: false,
      customer: r.customer,
      requestedBy: r.submittedBy.name,
      submittedAt: r.submittedAt,
      status: r.status,
      statusDate: r.statusDate,
      total: r.total,
    }));
    if (draft)
      rows.push({
        id: null,
        isDraft: true,
        customer: draft.customer,
        // Drafts are private to the signed-in user.
        requestedBy: SUBMITTER.name,
        submittedAt: null,
        status: 'draft',
        statusDate: draft.startedAt.slice(0, 10),
        total: null,
      });
    return rows;
  }, [requests, draft]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const filtered = allRows.filter(
      (r) =>
        (filters.status === 'all' || r.status === filters.status) &&
        (!filters.from || (r.submittedAt && r.submittedAt.slice(0, 10) >= filters.from)) &&
        (!filters.to || (r.submittedAt && r.submittedAt.slice(0, 10) <= filters.to)) &&
        (!q ||
          CUSTOMERS[r.customer].name.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          (r.id || '').toLowerCase().includes(q))
    );
    const dir = sort.dir === 'asc' ? 1 : -1;
    // A draft has no submission date but is the request being worked on now, so by date
    // submitted it counts as the newest: first in the default (newest-first) order.
    const value = (r) =>
      sort.key === 'customer'
        ? CUSTOMERS[r.customer].name
        : sort.key === 'status'
          ? STATUS_META[r.status].label
          : sort.key === 'total'
            ? (r.total ?? -1)
            : sort.key === 'submittedAt' && r.isDraft
              ? '￿'
              : (r[sort.key] ?? '');
    return [...filtered].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      return (x < y ? -1 : x > y ? 1 : 0) * dir;
    });
  }, [allRows, filters, sort]);

  const exportable = rows.filter((r) => !r.isDraft);
  const selectedRows = exportable.filter((r) => selected.has(r.id));
  const exportRows = selectedRows.length ? selectedRows : exportable;
  const allSelected = exportable.length > 0 && selectedRows.length === exportable.length;
  const anyFilter = filters.status !== 'all' || filters.from || filters.to || filters.q;

  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: ['submittedAt', 'statusDate', 'total'].includes(key) ? 'desc' : 'asc' }
    );

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(exportable.map((r) => r.id)));

  const toggleRow = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <Paper withBorder radius="sm">
      <div style={{ padding: 'var(--mantine-spacing-md) var(--mantine-spacing-md) var(--mantine-spacing-sm)' }}>
        <Title order={2} fz="lg">
          Previous Requests
        </Title>
        <Text fz="sm" c="dimmed" mt={2}>
          Refund requests submitted by you and others in your office. Select a request ID to view
          the full request. Check rows to download only those.
        </Text>
      </div>

      <Group px="md" pb="md" gap="sm" align="flex-end" wrap="wrap">
        <Select
          label="Status"
          data={[
            { value: 'all', label: 'All statuses' },
            ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
          ]}
          value={filters.status}
          onChange={(status) => setFilters((f) => ({ ...f, status: status || 'all' }))}
          w={220}
        />
        <TextInput
          type="date"
          label="Date from"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.currentTarget.value }))}
          w={160}
        />
        <TextInput
          type="date"
          label="Date to"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.currentTarget.value }))}
          w={160}
        />
        <TextInput
          label="Customer or request ID"
          placeholder="Name, customer ID, or RR number"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.currentTarget.value }))}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Button
          variant="subtle"
          size="sm"
          disabled={!anyFilter}
          onClick={() => setFilters({ status: 'all', from: '', to: '', q: '' })}
        >
          Clear filters
        </Button>
      </Group>

      {/* White with a rule above, so it doesn't merge with the inset table header below. */}
      <Group
        justify="space-between"
        px="md"
        py="xs"
        wrap="wrap"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <Text fz="sm" c="dimmed" role="status" aria-live="polite">
          Showing{' '}
          <Text component="span" fw={600} c="dark">
            {rows.length}
          </Text>{' '}
          of {allRows.length}
          {selectedRows.length > 0 && (
            <>
              {' · '}
              <Text component="span" fw={600} c="dark">
                {selectedRows.length}
              </Text>{' '}
              selected
            </>
          )}
        </Text>
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <Button
              variant="default"
              size="sm"
              disabled={!exportable.length}
              rightSection={<Chevron dir="down" size={12} />}
            >
              {selectedRows.length
                ? `Download ${selectedRows.length} selected`
                : `Download all (${exportable.length})`}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => downloadHistoryCsv(exportRows)}>
              CSV
              <Text fz="sm" c="dimmed">
                Spreadsheet-ready table
              </Text>
            </Menu.Item>
            <Menu.Item onClick={() => downloadHistoryDocx(exportRows)}>
              Word document
              <Text fz="sm" c="dimmed">
                .docx with the table
              </Text>
            </Menu.Item>
            <Menu.Item onClick={() => downloadHistoryPdf(exportRows)}>
              PDF
              <Text fz="sm" c="dimmed">
                Printable table
              </Text>
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Table.ScrollContainer minWidth={960}>
        <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={40}>
                <Checkbox
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={!exportable.length}
                  aria-label="Select all shown requests"
                />
              </Table.Th>
              {COLUMNS.map((col) => {
                const active = sort.key === col.key;
                return (
                  <Table.Th
                    key={col.key}
                    ta={col.align}
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <UnstyledButton onClick={() => toggleSort(col.key)}>
                      <Group
                        component="span"
                        gap={4}
                        wrap="nowrap"
                        justify={col.align === 'right' ? 'flex-end' : undefined}
                        fz="sm"
                        fw={600}
                        c={active ? 'dark' : 'dimmed'}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {col.label}
                        <SortIcon dir={active ? sort.dir : null} />
                      </Group>
                    </UnstyledButton>
                  </Table.Th>
                );
              })}
              {draft && (
                <Table.Th>
                  <VisuallyHidden>Actions</VisuallyHidden>
                </Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={COLUMNS.length + (draft ? 2 : 1)}>
                  <Text ta="center" c="dimmed" py="lg">
                    {anyFilter ? 'No requests match these filters.' : 'No refund requests yet.'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {rows.map((r) => (
              // Checked rows are light blue, as in Step 1: the app's one meaning for that color.
              <Table.Tr
                key={r.id || 'draft'}
                bg={r.id && selected.has(r.id) ? 'brand.0' : undefined}
              >
                <Table.Td>
                  <Checkbox
                    checked={Boolean(r.id) && selected.has(r.id)}
                    onChange={() => toggleRow(r.id)}
                    disabled={r.isDraft}
                    aria-label={`Select ${r.id || 'draft'}`}
                  />
                </Table.Td>
                <Table.Td>
                  {r.isDraft ? (
                    <Text inherit c="dimmed">—</Text>
                  ) : (
                    <Anchor component="button" type="button" onClick={() => setOpenId(r.id)} ff="monospace" fz="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
                      {r.id}
                    </Anchor>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text inherit fw={500}>
                    {CUSTOMERS[r.customer].name}
                  </Text>
                  <Mono fz={13} c="dimmed">
                    {r.customer}
                  </Mono>
                </Table.Td>
                <Table.Td>{r.requestedBy}</Table.Td>
                <Table.Td>
                  {r.isDraft ? <Text inherit c="dimmed">Not submitted</Text> : fmtDate(r.submittedAt)}
                </Table.Td>
                <Table.Td>
                  <StatusBadge status={r.status} />
                </Table.Td>
                <Table.Td>{fmtDate(r.statusDate)}</Table.Td>
                <Table.Td ta="right">
                  {r.isDraft ? <Text inherit c="dimmed">—</Text> : <Amount cents={r.total} />}
                </Table.Td>
                {draft && (
                  <Table.Td ta="right">
                    {r.isDraft && (
                      <Button size="sm" variant="default" onClick={resumeDraft}>
                        Resume
                      </Button>
                    )}
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <RequestModal requestId={openId} onClose={() => setOpenId(null)} />
    </Paper>
  );
}

// Up/down arrows on every sortable header; the active direction is solid, the rest faint.
const SortIcon = ({ dir }) => (
  <svg viewBox="0 0 10 14" width={8} height={12} aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M5 1 9 5.5H1Z" fill="currentColor" opacity={dir === 'asc' ? 1 : 0.35} />
    <path d="M5 13 1 8.5h8Z" fill="currentColor" opacity={dir === 'desc' ? 1 : 0.35} />
  </svg>
);
