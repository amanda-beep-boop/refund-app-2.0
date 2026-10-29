// CardHeader — the top of a card: a heading, an optional line under it, and something on the
// right (a paid amount, a hint).
//
// Use for: the first thing inside a <Paper> (which the theme styles as a bordered card). A card
// whose body is a table uses `divider` so the header and the table header don't merge.
// Rule: headings are title case; the line under them is sentence case. Pass `order` to fit the
// page's heading outline, and `id` when something refers to the card by its heading
// (aria-labelledby).
// Example:
//   <Paper><CardHeader title="Previous Requests" subtitle="Every request from the office." />…</Paper>
import type { ReactNode } from 'react';
import { Box, Group, Text, Title, type TitleOrder } from '@mantine/core';

export const CardHeader = ({
  title,
  subtitle,
  aside,
  order = 2,
  id,
  divider = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
  order?: TitleOrder;
  id?: string;
  divider?: boolean;
}) => (
  <Group
    justify="space-between"
    align="center"
    p="md"
    wrap="wrap"
    style={divider ? { borderBottom: '1px solid var(--border-subtle)' } : undefined}
  >
    <Box>
      <Title order={order} fz={order >= 3 ? 'md' : 'lg'} id={id}>
        {title}
      </Title>
      {subtitle && (
        <Text fz="sm" c="dimmed" mt={2}>
          {subtitle}
        </Text>
      )}
    </Box>
    {aside}
  </Group>
);
