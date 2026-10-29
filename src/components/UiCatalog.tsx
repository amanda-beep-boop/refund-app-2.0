// The component catalog: every component in src/ui, rendered in each of its states with the
// rule it enforces. Development only: open /ui while `npm run dev` is running. It never ships;
// App.tsx renders it only in development builds.
//
// It doubles as the accessibility test bed: every state is on one page, so contrast, focus and
// screen reader behavior can be checked in one pass.
import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { Status } from '../types';
import {
  Amount,
  Annotation,
  ArrowDownIcon,
  CardHeader,
  Chevron,
  CustomerSummary,
  DisabledHint,
  Field,
  FieldGroup,
  FieldLabel,
  IncompleteLabel,
  InfoIcon,
  LockIcon,
  LumpSumAnnotation,
  MailIcon,
  Mono,
  NotificationList,
  PageHeader,
  RemitterSourceAnnotation,
  StatusBadge,
  WarningIcon,
} from '../ui';

const STATUSES: Status[] = ['draft', 'submitted', 'review', 'approved', 'returned'];

// One entry per component: its name, the rule in one line, and its states.
const Entry = ({ name, rule, children }: { name: string; rule: string; children: React.ReactNode }) => (
  <Paper p="md" component="section" aria-labelledby={`catalog-${name}`}>
    <Title order={2} fz="md" id={`catalog-${name}`}>
      <Mono fz="md" fw={600}>
        {name}
      </Mono>
    </Title>
    <Text fz="sm" c="dimmed" mt={2} mb="md" className="readable">
      {rule}
    </Text>
    {children}
  </Paper>
);

export default function UiCatalog() {
  return (
    <Stack gap="lg">
      <PageHeader
        title="Component Catalog"
        description="Every component in src/ui, in each of its states. Development only. Each file in src/ui opens with what the component is for, when not to use it and the rule it enforces; DESIGN.md has the rules behind them."
      />

      <Entry name="StatusBadge" rule="A request's workflow status, and nothing else. The only filled shape in the app.">
        <Group gap="sm">
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </Group>
      </Entry>

      <Entry
        name="Annotation"
        rule="A flag about a piece of data. Neutral states a fact; attention marks something to check. Amber never means 'not filled in yet'."
      >
        <Stack gap="xs">
          <Annotation>Neutral: from payment record</Annotation>
          <Annotation tone="attention">Attention: changed from payment record</Annotation>
          <IncompleteLabel />
          <Group gap="lg">
            <RemitterSourceAnnotation source="record" />
            <RemitterSourceAnnotation source="customized" />
            <RemitterSourceAnnotation source="manual" />
          </Group>
          <Group gap="lg">
            <LumpSumAnnotation count={3} />
            <LumpSumAnnotation count={3} together />
          </Group>
        </Stack>
      </Entry>

      <Entry name="Mono and Amount" rule="Mono is for identifiers only. Amount formats integer cents; nothing else formats money.">
        <Group gap="lg">
          <Mono>C-104822</Mono>
          <Mono c="dimmed">F-88230</Mono>
          <Amount cents={124000} />
          <Amount cents={124000} fw={600} />
          <Amount cents={-9500} />
        </Group>
      </Entry>

      <Entry
        name="FieldLabel, Field, FieldGroup"
        rule="Labels above values and controls. Field must sit in a <dl>; FieldGroup with `heading` is for a page's main decisions."
      >
        <Stack gap="md">
          <FieldLabel>A field label on its own</FieldLabel>
          <dl className="field-row">
            <Field label="Customer">
              <Text inherit>Marisol Ortega</Text>
              <Text inherit c="dimmed">
                Customer ID <Mono fz={13} c="inherit">C-104822</Mono>
              </Text>
            </Field>
            <Field label="Total refund">
              <Amount cents={124000} fw={600} />
            </Field>
          </dl>
          <FieldGroup legend="A group of controls">
            <Button size="sm" variant="default">
              Control
            </Button>
          </FieldGroup>
          <FieldGroup legend="A Decision (Heading)" heading={3}>
            <Button size="sm" variant="default">
              Control
            </Button>
          </FieldGroup>
        </Stack>
      </Entry>

      <Entry name="CustomerSummary" rule="Who the customer is, the same everywhere: full name as a heading, ID beside it.">
        <CustomerSummary customer={{ id: 'C-104822', name: 'Marisol Ortega' }} order={3} />
      </Entry>

      <Entry name="DisabledHint" rule="Why the primary button beside it is disabled. Gray: guidance, not a warning.">
        <Group justify="flex-end">
          <Stack gap={4} align="flex-end">
            <Button disabled rightSection={<Chevron />}>
              Continue to Review
            </Button>
            <DisabledHint items={['choose a justification', 'add a requester remark']} />
          </Stack>
        </Group>
      </Entry>

      <Entry name="NotificationList" rule="Who E-Note notified and how, as a list.">
        <NotificationList
          notifications={[
            { role: 'Submitter', name: 'Simone Hart', to: 'simone.hart@agency.example', at: '2026-10-29T14:10:00' },
            { role: 'Requester', name: 'Jordan Ellis', to: 'jordan.ellis@agency.example', at: '2026-10-29T14:10:00' },
            { role: 'OCFO', name: 'OCFO Refund Review', to: 'refunds@ocfo.example', at: '2026-10-29T14:10:00' },
          ]}
        />
      </Entry>

      <Entry
        name="PageHeader"
        rule="The one H1 per page, with the focus-on-change behavior. This page's own title above is the example; it has a description, and the request flow adds a hidden step prefix, a meta line and actions."
      >
        <Text fz="sm">See the top of this page.</Text>
      </Entry>

      <Entry name="CardHeader" rule="The top of a card: a heading, a line under it, and something on the right. Use `divider` above a table.">
        <Paper>
          <CardHeader
            title="A Card With a Header"
            subtitle="A sentence-case line under it."
            aside={
              <Text fz="sm">
                Paid{' '}
                <Text component="span" inherit fw={600}>
                  <Amount cents={124000} />
                </Text>
              </Text>
            }
            divider
          />
          <Text fz="sm" p="md">
            The card's body.
          </Text>
        </Paper>
      </Entry>

      <Entry name="Icons" rule="Decorative, always paired with text. Chevrons mean expand, collapse or go; the arrow means a jump down the page.">
        <Group gap="lg">
          <Group gap={4}>
            <Chevron /> <Chevron dir="down" /> <Chevron dir="left" />
          </Group>
          <ArrowDownIcon />
          <LockIcon />
          <InfoIcon />
          <WarningIcon />
          <MailIcon />
        </Group>
      </Entry>

      <Entry
        name="Theme defaults"
        rule="A plain Mantine <Paper> is a bordered card with the app's radius; modals, menus and popovers close on Escape and return focus. These come from src/theme.ts, so raw Mantine still matches."
      >
        <Paper p="md">
          <Text fz="sm">A plain &lt;Paper p="md"&gt; with no other props.</Text>
        </Paper>
      </Entry>
    </Stack>
  );
}
