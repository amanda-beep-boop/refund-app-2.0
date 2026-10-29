// FieldLabel, Field and FieldGroup — labels above values and controls.
//
// FieldLabel: the small gray label (14px, semibold) used above a value or a group of controls.
// Field: a label above its value, as a term/description pair. It must sit inside a <dl>
//   (className "field-row" or "field-stack"), so screen readers announce each value with its
//   label. Pass several lines as children with the first dark and details after it gray
//   (<Text inherit c="dimmed">).
// FieldGroup: related controls under a legend, without the visual weight of Mantine's
//   Fieldset. Give it `heading` (a level) when the group is one of the page's main decisions:
//   it then reads as a heading and screen reader users can jump to it.
// Rule: labels are sentence case; headings are title case (see "Text and casing" in DESIGN.md).
// Examples:
//   <dl className="field-row"><Field label="Customer">{name}</Field></dl>
//   <FieldGroup legend="Refund Amount" heading={3}>…</FieldGroup>
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Text, Title, type TitleOrder } from '@mantine/core';
import { asElement, type TextLike } from './Text';

export const FieldLabel = ({ children, component = 'p', ...props }: TextLike) => (
  <Text component={asElement(component)} fz="sm" fw={600} c="dimmed" {...props}>
    {children}
  </Text>
);

export const Field = ({ label, children }: { label: ReactNode; children: ReactNode }) => (
  <div>
    <dt>
      <FieldLabel component="span">{label}</FieldLabel>
    </dt>
    <dd>
      <Text component="div" fz="sm" mt={2}>
        {children}
      </Text>
    </dd>
  </div>
);

export const FieldGroup = ({
  legend,
  heading,
  children,
  ...props
}: { legend: ReactNode; heading?: TitleOrder; children: ReactNode } & ComponentPropsWithoutRef<'fieldset'>) => (
  <fieldset className="plain-fieldset" {...props}>
    <legend>
      {heading ? (
        <Title order={heading} fz="md">
          {legend}
        </Title>
      ) : (
        <FieldLabel component="span">{legend}</FieldLabel>
      )}
    </legend>
    {children}
  </fieldset>
);
