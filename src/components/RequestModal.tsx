import { Anchor, Box, Button, Group, Modal, Stack, Text, Timeline, Title } from '@mantine/core';
import type { MouseEvent, ReactNode } from 'react';
import type { RequestStatus, TimelineEvent } from '../types';
import { useRefund } from '../state/RefundContext';
import { STATUS_META } from '../theme';
import { fmtDateTime } from '../lib/format';
import { requestActivity, enoteTitle } from '../lib/selectors';
import { downloadRequestPdf } from '../lib/exports';
import { StatusBadge, Mono, NotificationList, ArrowDownIcon, MailIcon } from '../ui';
import RequestRecord from './RequestRecord';

// The modal is a living record: a snapshot of what was submitted (RequestRecord), then Activity
// (everything after submission), which keeps growing below it. Activity follows the record's
// type rules, with weight also on event titles.
export default function RequestModal({ requestId, onClose }: { requestId: string | null; onClose: () => void }) {
  const { requests } = useRefund();
  const request = requests.find((r) => r.id === requestId);
  if (!request) return <Modal opened={false} onClose={onClose} />;

  // A note on the current status (e.g. why it was returned) is what the user has to act on.
  // It lives in Activity; a pinned notice at the top links to it.
  const latest = request.timeline[request.timeline.length - 1];
  const leadNote = latest.note ? latest : null;
  const events = requestActivity(request);

  return (
    <Modal
      opened
      onClose={onClose}
      size="60rem"
      closeButtonProps={{ 'aria-label': `Close request ${request.id}` }}
      title={
        <Group gap="sm">
          <Mono fz="lg" fw={500}>
            {request.id}
          </Mono>
          <StatusBadge status={request.status} />
        </Group>
      }
    >
      <Stack gap="lg">
        {leadNote && <PinnedNotice event={leadNote} />}

        <RequestRecord request={request} />

        <section aria-labelledby="activity-heading">
          <Title order={3} fz="md" mb="sm" id="activity-heading">
            Activity
          </Title>
          {/* A list of events, each titled by a heading, so screen readers announce how many
              events there are and can jump between them. */}
          <Timeline
            role="list"
            active={events.length - 1}
            bulletSize={14}
            lineWidth={2}
            styles={{ itemTitle: { fontSize: 'var(--mantine-font-size-sm)', fontWeight: 600 } }}
          >
            {events.map((e, i) =>
              e.kind === 'enote' ? (
                <Timeline.Item
                  key={i}
                  role="listitem"
                  title={<EventHeading>{enoteTitle(e)}</EventHeading>}
                  color="var(--mantine-color-gray-6)"
                  bullet={<MailIcon />}
                >
                  <Text fz="sm" c="dimmed">
                    {fmtDateTime(e.at)}
                  </Text>
                  <Box mt="xs">
                    <NotificationList notifications={e.notified} />
                  </Box>
                </Timeline.Item>
              ) : (
                <Timeline.Item
                  key={i}
                  role="listitem"
                  title={<EventHeading>{STATUS_META[e.status].label}</EventHeading>}
                  color={STATUS_META[e.status].color}
                >
                  <Text fz="sm" c="dimmed">
                    {fmtDateTime(e.at)}
                  </Text>
                  {e.note && (
                    <Box mt={6}>
                      <StatusNote id={noteId(e)} status={e.status} at={e.at}>
                        {e.note}
                      </StatusNote>
                    </Box>
                  )}
                </Timeline.Item>
              )
            )}
          </Timeline>
        </section>
      </Stack>

      {/* Pinned to the bottom of the scrolling modal so the actions stay in reach. */}
      <Group
        justify="flex-end"
        gap="xs"
        style={{
          position: 'sticky',
          bottom: 0,
          margin: 'var(--mantine-spacing-lg) calc(var(--mb-padding, var(--mantine-spacing-md)) * -1) calc(var(--mb-padding, var(--mantine-spacing-md)) * -1)',
          padding: 'var(--mantine-spacing-sm) var(--mb-padding, var(--mantine-spacing-md))',
          background: 'var(--mantine-color-body)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <Button variant="default" onClick={onClose}>
          Close
        </Button>
        <Button onClick={() => downloadRequestPdf(request)}>Download Request (PDF)</Button>
      </Group>
    </Modal>
  );
}

const noteId = (e: { at: string }) => `note-${e.at}`;

// Activity sits under an h3, so each event is an h4.
const EventHeading = ({ children }: { children: ReactNode }) => (
  <Title order={4} fz="sm" fw={600} lh="inherit">
    {children}
  </Title>
);

// Short notice above the record that the current status carries an OCFO note. The note itself
// stays in Activity; the link scrolls to it and moves focus there.
const PinnedNotice = ({ event }: { event: TimelineEvent }) => {
  const color = STATUS_META[event.status].color;
  const goToNote = (ev: MouseEvent<HTMLAnchorElement>) => {
    ev.preventDefault();
    const el = document.getElementById(noteId(event));
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.focus({ preventScroll: true });
  };
  return (
    <Group
      justify="space-between"
      gap="xs"
      px="md"
      py="sm"
      bg={`var(--mantine-color-${color}-light)`}
      style={{
        borderLeft: `3px solid var(--mantine-color-${color}-filled)`,
        borderRadius: 'var(--mantine-radius-sm)',
      }}
    >
      <Text fz="sm">
        <Text component="span" inherit fw={600} c={`var(--mantine-color-${color}-light-color)`}>
          {STATUS_META[event.status].label}
        </Text>{' '}
        on {fmtDateTime(event.at)}. The OCFO left a note.
      </Text>
      <Anchor
        href={`#${noteId(event)}`}
        onClick={goToNote}
        fz="sm"
        fw={600}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        Read the note in Activity
        <ArrowDownIcon />
      </Anchor>
    </Group>
  );
};

// A reviewer's note on a status change. Notes can run to several paragraphs, so only the header
// strip carries the status color; the note itself is body text on white at a readable measure.
const StatusNote = ({
  id,
  status,
  at,
  children,
}: {
  id: string;
  status: RequestStatus;
  at: string;
  children: ReactNode;
}) => {
  const color = STATUS_META[status].color;
  return (
    <Box
      id={id}
      tabIndex={-1}
      className="status-note"
      style={{
        border: '1px solid var(--border-subtle)',
        borderLeft: `3px solid var(--mantine-color-${color}-filled)`,
        borderRadius: 'var(--mantine-radius-sm)',
      }}
    >
      <Group justify="space-between" gap="xs" px="md" py={6} bg={`var(--mantine-color-${color}-light)`}>
        <Text fz="sm" fw={600} c={`var(--mantine-color-${color}-light-color)`}>
          Note from the OCFO
        </Text>
        <Text fz="sm" c="dimmed">
          {fmtDateTime(at)}
        </Text>
      </Group>
      <Text fz="sm" px="md" py="sm" className="readable" style={{ whiteSpace: 'pre-line' }}>
        {children}
      </Text>
    </Box>
  );
};
