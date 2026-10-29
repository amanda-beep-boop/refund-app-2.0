// CustomerSummary — who the customer is, the same everywhere: full name as a heading with the
// customer ID beside it.
//
// Use for: every place a customer is identified (the search result, the top of each step, a
// record). Pass `order` to fit the page's heading outline.
// Don't use for: people in the office (requester, submitter); those are names in text.
// Rule: identity leads. Other customer details (team, position) aren't shown; the name and ID
// are what the user needs. Screen readers hear "Customer ID" before the ID.
// Example: <CustomerSummary customer={customer} order={3} />
import { Group, Title, type TitleOrder, VisuallyHidden } from '@mantine/core';
import type { Customer } from '../types';
import { Mono } from './Text';

export const CustomerSummary = ({
  customer,
  order = 2,
}: {
  customer: Pick<Customer, 'id' | 'name'>;
  order?: TitleOrder;
}) => (
  <Group gap="sm" align="baseline" wrap="wrap">
    <Title order={order} fz="lg">
      {customer.name}
    </Title>
    <Mono c="dimmed">
      <VisuallyHidden>Customer ID </VisuallyHidden>
      {customer.id}
    </Mono>
  </Group>
);
