import { useMemo, useState } from 'react';
import {
  Anchor,
  Box,
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
import type { Status } from '../types';
import { customerById } from '../data/api';
import { STATUS_META } from '../theme';
import { fmtDate } from '../lib/format';
import { downloadHistoryCsv, downloadHistoryPdf, downloadHistoryDocx, type ExportRow } from '../lib/exports';
import { StatusBadge, Mono, Amount, Chevron, EmptyState, ErrorNotice, LockIcon, TableSkeleton } from '../ui';
import RequestModal from './RequestModal';

// A submitted request's row, or the office's draft (never exported).
type Row =
  | (ExportRow & { isDraft: false })
  | {
      isDraft: true;
      id: null;
      customer: string;
      requestedBy: string;
      submittedAt: null;
      status: 'draft';
      statusDate: string;
      total: null;
    };
type SubmittedRow = Extract<Row, { isDraft: false }>;
type SortKey = keyof ExportRow;
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'id', label: 'Request ID' },
  { key: 'customer', label: 'Customer' },
  { key: 'requestedBy', label: 'Requested By' },
  { key: 'submittedAt', label: 'Date Submitted' },
  { key: 'status', label: 'Status' },
  { key: 'statusDate', label: 'Status Date' },
  { key: 'total', label: 'Amount', align: 'right' },
];

export default function HistoryTable() {
  const { currentUser, requests, requestsStatus, reloadRequests, draft, resumeDraft } = useRefund();
  const [filters, setFilters] = useState<{ status: Status | 'all'; from: string; to: string; q: string }>({
    status: 'all',
    from: '',
    to: '',
    q: '',
  });
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'submittedAt', dir: 'desc' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  const allRows = useMemo(() => {
    const rows: Row[] = requests.map((r) => ({
      id: r.id,
      isDraft: false,
      customer: r.customer,
      requestedBy: r.requestedBy.name,
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
        requestedBy: draft.createdBy.name,
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
          customerById(r.customer).name.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          (r.id || '').toLowerCase().includes(q))
    );
    const dir = sort.dir === 'asc' ? 1 : -1;
    // A draft has no submission date but is the request being worked on now, so by date
    // submitted it counts as the newest: first in the default (newest-first) order.
    const value = (r: Row): string | number =>
      sort.key === 'customer'
        ? customerById(r.customer).name
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

  const exportable = rows.filter((r): r is SubmittedRow => !r.isDraft);
  const selectedRows = exportable.filter((r) => selected.has(r.id));
  const exportRows = selectedRows.length ? selectedRows : exportable;
  const allSelected = exportable.length > 0 && selectedRows.length === exportable.length;
  const anyFilter = filters.status !== 'all' || filters.from || filters.to || filters.q;
  const loading = requestsStatus === 'loading';
  const failed = requestsStatus === 'error';
  // No history at all (and no draft): nothing to filter, so the controls stay out of the way.
  const empty = requestsStatus === 'ready' && allRows.length === 0;
  const columnCount = COLUMNS.length + (draft ? 2 : 1);

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: ['submittedAt', 'statusDate', 'total'].includes(key) ? 'desc' : 'asc' }
    );

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(exportable.map((r) => r.id)));

  const toggleRow = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <Paper>
      <div style={{ padding: 'var(--mantine-spacing-md) var(--mantine-spacing-md) var(--mantine-spacing-sm)' }}>
        <Title order={2} fz="lg">
          Previous Requests
        </Title>
        <Text fz="sm" c="dimmed" mt={2}>
          Every refund request from the {currentUser.office}, whoever started it. Select a request
          ID to view the full request. Check rows to download only those.
        </Text>
      </div>

      {empty ? (
        <EmptyState title="No refund requests yet">
          Requests from the {currentUser.office} will appear here once one is submitted.
        </EmptyState>
      ) : (
        <>
      <Group px="md" pb="md" gap="sm" align="flex-end" wrap="wrap">
        <Select
          label="Status"
          data={[
            { value: 'all', label: 'All Statuses' },
            ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
          ]}
          value={filters.status}
          // The options are the statuses and 'all', so the chosen value is one of them.
          onChange={(status) => setFilters((f) => ({ ...f, status: (status ?? 'all') as Status | 'all' }))}
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
          Clear Filters
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
          {loading ? (
            'Loading requests…'
          ) : failed ? (
            'Requests couldn\'t be loaded'
          ) : (
            <>
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
                ? `Download ${selectedRows.length} Selected`
                : `Download All (${exportable.length})`}
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
              Word Document
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
            {loading && <TableSkeleton widths={[20, 110, 120, 110, 90, 130, 90, 60, ...(draft ? [70] : [])]} />}
            {failed && (
              <Table.Tr>
                <Table.Td colSpan={columnCount} p="md">
                  <ErrorNotice
                    title="Couldn't load the office's requests"
                    action="Reload Requests"
                    onAction={reloadRequests}
                  >
                    The refund-request service didn't respond. You can still start a new request.
                  </ErrorNotice>
                </Table.Td>
              </Table.Tr>
            )}
            {!loading && !failed && rows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={columnCount}>
                  <EmptyState title="No requests match these filters">
                    Clear the filters to see every request from the {currentUser.office}.
                  </EmptyState>
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
                  {r.isDraft ? (
                    // A draft can't be downloaded. A lock, not a disabled checkbox, as in Step 1.
                    <Box c="dimmed" pt={2} pl={2}>
                      <LockIcon />
                      <VisuallyHidden>Draft can't be selected for download</VisuallyHidden>
                    </Box>
                  ) : (
                    <Checkbox
                      checked={selected.has(r.id)}
                      onChange={() => toggleRow(r.id)}
                      aria-label={`Select ${r.id}`}
                    />
                  )}
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
                    {customerById(r.customer).name}
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
        </>
      )}

      <RequestModal requestId={openId} onClose={() => setOpenId(null)} />
    </Paper>
  );
}

// Up/down arrows on every sortable header; the active direction is solid, the rest faint.
const SortIcon = ({ dir }: { dir: SortDir | null }) => (
  <svg viewBox="0 0 10 14" width={8} height={12} aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M5 1 9 5.5H1Z" fill="currentColor" opacity={dir === 'asc' ? 1 : 0.35} />
    <path d="M5 13 1 8.5h8Z" fill="currentColor" opacity={dir === 'desc' ? 1 : 0.35} />
  </svg>
);
