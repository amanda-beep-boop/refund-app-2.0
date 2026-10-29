// Mono and Amount — the two ways a value is set in type.
//
// Mono: identifiers only (customer, fee and request IDs), in the monospace face so they read
// as codes and line up. Never for amounts or names.
// Amount: a dollar amount from integer cents, in the body face with tabular figures so columns
// of amounts line up. Formatting happens here and nowhere else (see src/lib/format.ts).
// Examples: <Mono>{customer.id}</Mono>   <Amount cents={fee.cents} fw={600} />
import type { ElementType, ReactNode } from 'react';
import { Text, type TextProps } from '@mantine/core';
import { fmt } from '../lib/format';

// Text props plus the element to render as, for components that wrap Mantine's Text.
export type TextLike = Omit<TextProps, 'component'> & {
  component?: ElementType;
  children?: ReactNode;
  id?: string;
};

// Mantine's Text is polymorphic over its `component`. Narrowing the element type here keeps the
// wrappers' `component` open to any element while every other prop stays checked.
export const asElement = (component: ElementType) => component as 'p';

export const Mono = ({ children, component = 'span', ...props }: TextLike) => (
  <Text component={asElement(component)} ff="monospace" fz="sm" {...props}>
    {children}
  </Text>
);

export const Amount = ({ cents, ...props }: TextProps & { cents: number }) => (
  <Text component="span" inherit className="tabular" {...props}>
    {fmt(cents)}
  </Text>
);
