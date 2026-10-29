import { Button, Checkbox, Group, Stack, Text, VisuallyHidden } from '@mantine/core';
import { useRefund } from '../state/RefundContext';
import { draftRequest } from '../lib/selectors';
import { Chevron, DisabledHint, FieldLabel } from './shared';
import RequestRecord from './RequestRecord';

// Previews the record the request will become. Certifying is the record's closing line, so the
// checkbox sits where the certification statement appears once it's submitted.
export default function Step3Review() {
  const { draft, sending, setCertified, setStep, submit } = useRefund();

  return (
    <>
      <Text c="dimmed" mt={-8} maw={640}>
        This is the request record the OCFO will receive. Check every detail, then certify and
        submit. It can't be edited afterward.
      </Text>

      <RequestRecord
        request={draftRequest(draft)}
        title="Request to be submitted"
        headingOrder={2}
        footer={
          <>
            <FieldLabel mb="xs">Certification</FieldLabel>
            <Checkbox
              checked={draft.certified}
              onChange={(e) => setCertified(e.currentTarget.checked)}
              label={
                <Text fz="sm" className="readable">
                  I certify that the information in this request is accurate and complete to the
                  best of my knowledge. By submitting, I am legally submitting this fee refund
                  request to the Office of the Chief Financial Officer for review, and I understand
                  that it will be transmitted digitally and recorded under my credentials.{' '}
                  <Text component="span" inherit c="dimmed">
                    (Placeholder wording, to be supplied by counsel.)
                  </Text>
                </Text>
              }
            />
          </>
        }
      />

      <Group justify="flex-end" align="flex-start">
        <Stack gap={4} align="flex-end">
          <Group gap="xs">
            <Button
              variant="default"
              disabled={sending}
              onClick={() => setStep(2)}
              leftSection={<Chevron dir="left" />}
            >
              Back to details
            </Button>
            <Button disabled={!draft.certified} loading={sending} onClick={submit}>
              Submit to OCFO
            </Button>
          </Group>
          <DisabledHint items={draft.certified ? [] : ['check the certification box above']} />
          <VisuallyHidden role="status" aria-live="polite">
            {sending ? 'Submitting your request to the OCFO…' : ''}
          </VisuallyHidden>
        </Stack>
      </Group>
    </>
  );
}
