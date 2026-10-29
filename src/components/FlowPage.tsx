import { Button, Stack } from '@mantine/core';
import { useRefund } from '../state/RefundContext';
import { PageHeader } from '../ui';
import { DiscardDraftButton } from './DiscardDraftButton';
import Step1SelectFees from './Step1SelectFees';
import Step2Details from './Step2Details';
import Step3Review from './Step3Review';

export const STEP_TITLES = ['Select Fees', 'Confirm Details', 'Review & Submit'];

export default function FlowPage() {
  const { step, saveAndExit } = useRefund();

  return (
    <Stack gap="lg">
      {/* Progress is the title plus one line; the Continue buttons also name the next step. Focus
          moves to the title on each step change, so its hidden prefix announces the step count.
          The draft actions sit on the title's row, right-aligned with the cards below. */}
      <PageHeader
        title={STEP_TITLES[step - 1]}
        hiddenPrefix={`Step ${step} of ${STEP_TITLES.length}: `}
        meta={
          <>
            <span aria-hidden="true">
              Step {step} of {STEP_TITLES.length}.{' '}
            </span>
            {step < STEP_TITLES.length ? `Next: ${STEP_TITLES[step]}` : 'Last step'}
          </>
        }
        actions={
          <>
            <DiscardDraftButton />
            <Button size="sm" variant="default" onClick={saveAndExit}>
              Save Draft &amp; Exit
            </Button>
          </>
        }
      />

      {step === 1 && <Step1SelectFees />}
      {step === 2 && <Step2Details />}
      {step === 3 && <Step3Review />}
    </Stack>
  );
}
