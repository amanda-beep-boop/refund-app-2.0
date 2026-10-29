// PageHeader — the title of every page: the H1, an optional description, and actions on the
// right.
//
// Use for: the top of every page and step. There is exactly one per page.
// Rule: the H1 has id "page-heading" and can take focus. When the page or step changes, the
// app moves focus to it (src/App.tsx), so screen readers announce where the user landed.
// `hiddenPrefix` is read before the title but not shown ("Step 1 of 3: "), for context that's
// visible elsewhere. `meta` is a small gray line under the title (step progress); `description`
// is a body-size intro limited to a readable measure.
// Example:
//   <PageHeader title="Select Fees" hiddenPrefix="Step 1 of 3: " meta={…} actions={…} />
import type { ReactNode } from 'react';
import { Group, Text, Title, VisuallyHidden } from '@mantine/core';

export const PageHeader = ({
  title,
  hiddenPrefix,
  description,
  meta,
  actions,
}: {
  title: ReactNode;
  hiddenPrefix?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) => (
  <div>
    <Group justify="space-between" align="center" wrap="wrap">
      <Title order={1} id="page-heading" tabIndex={-1}>
        {hiddenPrefix && <VisuallyHidden>{hiddenPrefix}</VisuallyHidden>}
        {title}
      </Title>
      {actions && <Group gap="xs">{actions}</Group>}
    </Group>
    {description && (
      <Text c="dimmed" mt={6} maw={640}>
        {description}
      </Text>
    )}
    {meta && (
      <Text fz="sm" c="dimmed" mt={4}>
        {meta}
      </Text>
    )}
  </div>
);
