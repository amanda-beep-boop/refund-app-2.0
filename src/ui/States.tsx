// LoadingNotice, TableSkeleton, EmptyState and ErrorNotice — what a piece of the page shows
// while it waits for data, when there is none, and when a call fails.
//
// Rules (see "Loading, empty and error states" in DESIGN.md):
// - Each state appears in the exact spot the content will occupy. The page's structure stays
//   put; no full-page spinners.
// - Loading shows only after a short delay, so fast responses never flicker. A button that
//   starts a write shows its own loading state (Mantine's `loading`), not one of these.
// - An error is inline, never a toast, and its copy says what did NOT change. Its one action
//   names what it will redo ("Search Again", "Reload Requests"); when the original button is
//   the retry, there is no action.
// - Empty is plain text with room around it, in the office's voice.
// Examples:
//   <LoadingNotice>Looking up C-104822…</LoadingNotice>
//   <TableSkeleton widths={[20, 110, 120]} />
//   <EmptyState title="No refund requests yet">Requests from the office will appear here.</EmptyState>
//   <ErrorNotice title="Couldn't look up the customer" action="Search Again" onAction={retry}>
//     The payment system didn't respond. Nothing was changed.
//   </ErrorNotice>
import { useEffect, useState, type ReactNode } from 'react';
import { Box, Button, Group, Loader, Paper, Skeleton, Table, Text, VisuallyHidden } from '@mantine/core';

/** A small spinner and a sentence, shown after `delay` ms (default 300) so quick waits don't flicker. */
export const LoadingNotice = ({ children, delay = 300 }: { children: ReactNode; delay?: number }) => {
  const [visible, setVisible] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return undefined;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <Group gap="xs" wrap="nowrap" role="status" aria-live="polite" mih={24}>
      {visible && (
        <>
          <Loader size="xs" color="gray" />
          <Text fz="sm" c="dimmed">
            {children}
          </Text>
        </>
      )}
    </Group>
  );
};

/**
 * Placeholder rows for a table that is loading, one cell per entry in `widths` (px). Decorative:
 * the table's own status text announces the wait. The shimmer stops under reduced motion.
 */
export const TableSkeleton = ({ widths, rows = 4 }: { widths: number[]; rows?: number }) => (
  <>
    {Array.from({ length: rows }, (_, i) => (
      <Table.Tr key={i} aria-hidden="true">
        {widths.map((w, j) => (
          <Table.Td key={j}>
            <Skeleton height={14} width={w} radius="sm" />
          </Table.Td>
        ))}
      </Table.Tr>
    ))}
    <Table.Tr>
      <Table.Td colSpan={widths.length} p={0}>
        <VisuallyHidden>Loading…</VisuallyHidden>
      </Table.Td>
    </Table.Tr>
  </>
);

/** Nothing to show: a title and a sentence, centered, with room around them. */
export const EmptyState = ({ title, children }: { title: ReactNode; children: ReactNode }) => (
  <Box py={56} px="md" ta="center">
    <Text fw={600}>{title}</Text>
    <Text fz="sm" c="dimmed" mt={4}>
      {children}
    </Text>
  </Box>
);

/** A call failed: a white card with a red bar, what didn't happen, what it means, and at most one action. */
export const ErrorNotice = ({
  title,
  children,
  action,
  onAction,
}: {
  title: ReactNode;
  children: ReactNode;
  action?: string;
  onAction?: () => void;
}) => (
  <Paper p="md" role="alert" style={{ borderLeft: '4px solid var(--mantine-color-red-filled)' }}>
    <Text fw={600}>{title}</Text>
    <Text fz="sm" mt={2} className="readable">
      {children}
    </Text>
    {action && (
      <Button size="sm" variant="default" mt="sm" onClick={onAction}>
        {action}
      </Button>
    )}
  </Paper>
);
