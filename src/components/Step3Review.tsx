import { Button, Checkbox, Group, Stack, Text, VisuallyHidden } from '@mantine/core';
import { useActiveDraft, useRefund } from '../state/RefundContext';
import { canSubmit, draftRequest } from '../lib/selectors';
import { Chevron, DisabledHint, FieldLabel } from '../ui';
import RequestRecord from './RequestRecord';

// Previews the record the request will become. Certifying is the record's closing line, so the
// checkbox sits where the certification statement appears once it's submitted.
// Only a Supervisor can certify and submit. Staff see why in that same spot, and save the draft
// for a Supervisor to resume instead; there's no Submit button they could never use.
export default function Step3Review() {
  const { currentUser, sending, setCertified, setStep, submit, saveAndExit } = useRefund();
  const { draft } = useActiveDraft();
  const supervisor = canSubmit(currentUser);

  return (
    <>
      <Text c="dimmed" mt={-8} maw={640}>
        {supervisor
          ? "This is the request record the OCFO will receive. Check every detail, then certify and submit. It can't be edited afterward."
          : 'This is the request record the OCFO will receive. Check every detail. A Supervisor certifies and submits it to the OCFO.'}
      </Text>

      <RequestRecord
        request={draftRequest(draft, currentUser)}
        title="Request to Be Submitted"
        headingOrder={2}
        footer={
          <>
            <FieldLabel mb="xs">Certification</FieldLabel>
            {supervisor ? (
              <Checkbox
                checked={draft.certified}
                onChange={(e) => setCertified(e.currentTarget.checked)}
                label={
                  <Text fz="sm" className="readable">
                    I certify that the information in this request is accurate and complete to the
                    best of my knowledge. By submitting, I am legally submitting this fee refund
                    request to the Office of the Chief Financial Officer for review, and I
                    understand that it will be transmitted digitally and recorded under my
                    credentials.{' '}
                    <Text component="span" inherit c="dimmed">
                      (Placeholder wording, to be supplied by counsel.)
                    </Text>
                  </Text>
                }
              />
            ) : (
              <Text fz="sm" className="readable">
                A Supervisor needs to certify and submit this request to the OCFO. Save the draft
                so a Supervisor in your office can resume it.
              </Text>
            )}
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
              Back to Details
            </Button>
            {supervisor ? (
              <Button disabled={!draft.certified} loading={sending} onClick={submit}>
                Submit to OCFO
              </Button>
            ) : (
              <Button onClick={saveAndExit}>Save Draft &amp; Exit</Button>
            )}
          </Group>
          {supervisor && (
            <>
              <DisabledHint items={draft.certified ? [] : ['check the certification box above']} />
              <VisuallyHidden role="status" aria-live="polite">
                {sending ? 'Submitting this request to the OCFO…' : ''}
              </VisuallyHidden>
            </>
          )}
        </Stack>
      </Group>
    </>
  );
}
