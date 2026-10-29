import { useState } from 'react';
import { Button, Group, Modal, Text, type MantineSize } from '@mantine/core';
import { useRefund } from '../state/RefundContext';

// Discarding the office's draft can't be undone, so it always asks first. It reads app state,
// which is why it lives here and not in src/ui.
export const DiscardDraftButton = ({ size = 'sm' }: { size?: MantineSize }) => {
  const { discardDraft } = useRefund();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={size} variant="subtle" color="red" onClick={() => setOpen(true)}>
        Discard Draft
      </Button>
      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Discard This Draft?"
        centered
        closeButtonProps={{ 'aria-label': 'Close' }}
      >
        <Text>
          The draft's fees, amounts and details will be deleted for everyone in the office. This
          can't be undone.
        </Text>
        <Group justify="flex-end" mt="lg" gap="xs">
          <Button variant="default" onClick={() => setOpen(false)} data-autofocus>
            Keep Draft
          </Button>
          <Button
            color="red"
            onClick={() => {
              setOpen(false);
              discardDraft();
            }}
          >
            Discard Draft
          </Button>
        </Group>
      </Modal>
    </>
  );
};
