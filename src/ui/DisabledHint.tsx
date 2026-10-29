// DisabledHint — explains why the primary button beside it is disabled.
//
// Use for: every disabled primary action ("Continue", "Submit"), listing what's left to do.
// Don't use for: errors (those go on the field, in red) or facts about data (<Annotation>).
// Rule: gray, not amber: it's guidance, not a warning. Required fields that haven't been
// started stay neutral; the hint lists them. A polite live region, so the hint is announced as
// it changes.
// Example: <DisabledHint items={missing} />   // "To continue: choose a justification."
import { Text } from '@mantine/core';

export const DisabledHint = ({ items }: { items: string[] }) => (
  <div role="status" aria-live="polite">
    {items.length > 0 && (
      <Text fz="sm" c="dimmed">
        <Text component="span" fw={600} inherit>
          To continue:
        </Text>{' '}
        {items.join('; ')}.
      </Text>
    )}
  </div>
);
