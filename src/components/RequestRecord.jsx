import { Box, List, Table, Text, Title, VisuallyHidden } from '@mantine/core';
import { CUSTOMERS, JUSTIFICATION_LABEL } from '../data/mockData';
import { fmtDate, fmtDateTime } from '../lib/format';
import {
  remitterNotes,
  justificationDefinition,
  paidLabel,
  refundMethodLabel,
  refundExtentLabel,
} from '../lib/selectors';
import { Mono, Amount, Field, FieldLabel, RemitterSourceAnnotation, LumpSumAnnotation } from './shared';

// Everything entered at submission, as one record laid out like an invoice. The request modal
// shows it for submitted requests; Step 3 previews it from the draft (with the certification
// checkbox as its footer), so what the analyst certifies is exactly what gets recorded.
// Type rules: section headings 16/600; labels 14/600 gray; values 14/400 dark; details 14/400
// in the same gray; weight otherwise only on the total.
export default function RequestRecord({
  request,
  title = 'Submitted request',
  headingOrder = 3,
  footer,
}) {
  const c = CUSTOMERS[request.customer];
  const notes = remitterNotes(
    request.fees,
    (f) => f.remitterSource,
    (f) => f.recordRemitter
  );
  const { code } = request.justification;
  const headingId = `record-heading-${request.id || 'draft'}`;
  // Sections inside the record are headings one level below its title, so screen reader users
  // can jump between them.
  const sectionHeading = `h${headingOrder + 1}`;

  return (
    <section className="form-record" aria-labelledby={headingId}>
      <div className="form-record-header">
        <Title order={headingOrder} fz="md" id={headingId}>
          {title}
        </Title>
      </div>

      <dl className="form-record-fields">
        <Field label="Customer">
          <Text inherit>{c.name}</Text>
          <Text inherit c="dimmed">
            Customer ID <Mono fz={13} c="inherit">{c.id}</Mono>
          </Text>
          <Text inherit c="dimmed">
            {c.team}, {c.position}
          </Text>
        </Field>
        <Field label="Requested by">
          <Text inherit>{request.submittedBy.name}</Text>
          <Text inherit c="dimmed">
            {request.submittedBy.email}
          </Text>
        </Field>
      </dl>

      {/* The remark summarizes the whole request, so it leads; the justification follows. */}
      <dl className="form-record-section form-record-pad field-stack">
        <Field label="Requester Remark">
          <Text inherit className="readable" style={{ whiteSpace: 'pre-line' }}>
            {request.remark}
          </Text>
        </Field>
        <Field label="Justification">
          <Text inherit>{JUSTIFICATION_LABEL[code]}</Text>
          <Text inherit c="dimmed" className="readable">
            Definition at the time of submission: {justificationDefinition(request.justification)}
          </Text>
        </Field>
      </dl>

      <div className="form-record-section">
        <Table.ScrollContainer minWidth={760} type="native">
          {/* Invoice layout: refunds sit in the last column so they line up with the total. */}
          <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm" styles={{ td: { verticalAlign: 'top' } }}>
            {/* Names the table for screen readers (T to jump to tables); the column headers
                already make it clear on screen. */}
            <caption>
              <VisuallyHidden>Fees in this request</VisuallyHidden>
            </caption>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w="26%">Fee</Table.Th>
                <Table.Th w="22%">Paid</Table.Th>
                <Table.Th>Refund to</Table.Th>
                <Table.Th ta="right" w={140}>
                  Refund
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {request.fees.map((f) => (
                <Table.Tr key={f.id}>
                  <Table.Td>
                    <Text inherit>{f.desc}</Text>
                    <Text inherit c="dimmed">
                      Fee ID <Mono fz={13} c="inherit">{f.id}</Mono>
                    </Text>
                    {f.items && (
                      <Box mt={4}>
                        <LumpSumAnnotation count={f.items.length} />
                      </Box>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text inherit style={{ whiteSpace: 'nowrap' }}>
                      {fmtDate(f.date)}
                    </Text>
                    <Text inherit c="dimmed">
                      {paidLabel(f)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text inherit>{f.remitter.name}</Text>
                    <Text inherit c="dimmed">
                      {f.remitter.address}
                    </Text>
                    <Text inherit c="dimmed">
                      {refundMethodLabel(f)}
                    </Text>
                    {f.remitterSource !== 'record' && (
                      <Box mt={4}>
                        <RemitterSourceAnnotation source={f.remitterSource} />
                      </Box>
                    )}
                  </Table.Td>
                  <Table.Td ta="right">
                    <Amount cents={f.refund} />
                    <Text inherit c="dimmed">
                      {refundExtentLabel(f)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Tfoot>
              <Table.Tr>
                <Table.Th colSpan={3} scope="row" ta="right">
                  Total refund requested
                </Table.Th>
                <Table.Td ta="right">
                  <Amount cents={request.total} fw={600} />
                </Table.Td>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </Table.ScrollContainer>
      </div>

      {notes.length > 0 && (
        <div className="form-record-section form-record-pad">
          <FieldLabel component={sectionHeading}>Remitter notes</FieldLabel>
          <List spacing={4} fz="sm" mt={4} className="readable">
            {notes.map((n) => (
              <List.Item key={n.feeId}>
                <Mono fz={13}>{n.feeId}</Mono>: {n.text}
              </List.Item>
            ))}
          </List>
        </div>
      )}

      <div className="form-record-footer">
        {footer ?? (
          <>
            <FieldLabel component={sectionHeading}>Certification</FieldLabel>
            <Text fz="sm">
              Certified and submitted by {request.submittedBy.name} on{' '}
              {fmtDateTime(request.certifiedAt)}. Routed to the Office of the Chief Financial
              Officer (OCFO), Refund Review.
            </Text>
          </>
        )}
      </div>
    </section>
  );
}
