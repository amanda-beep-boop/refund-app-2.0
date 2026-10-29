import { useEffect, useRef } from 'react';
import { Anchor, Box, Container, Group } from '@mantine/core';
import { useRefund } from './state/RefundContext';
import HomePage from './components/HomePage';
import FlowPage, { STEP_TITLES } from './components/FlowPage';
import ConfirmationPage from './components/ConfirmationPage';
import ProfileMenu from './components/ProfileMenu';

const APP_NAME = 'Fee Refund Requests';

export default function App() {
  const { view, step, setView, saveAndExit } = useRefund();
  const firstRender = useRef(true);

  // A view or step change replaces the page content, so retitle the document and move focus
  // to the new heading. Screen readers then announce where the user landed.
  useEffect(() => {
    const page =
      view === 'flow'
        ? `Step ${step} of ${STEP_TITLES.length}: ${STEP_TITLES[step - 1]}`
        : view === 'confirm'
          ? 'Request Submitted'
          : null;
    document.title = page ? `${page} – ${APP_NAME}` : APP_NAME;

    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById('page-heading')?.focus();
  }, [view, step]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Box component="header" className="app-nav">
        <Container size={1120} py="xs">
          <Group justify="space-between" wrap="nowrap">
            {/* The app name is the way home from every page. From a request in progress it saves
                the draft first (the "Draft saved" message says so), like "Save Draft & Exit". */}
            <Anchor
              href="/"
              onClick={(e) => {
                e.preventDefault();
                if (view === 'flow') saveAndExit();
                else setView('home');
              }}
              aria-current={view === 'home' ? 'page' : undefined}
              fw={600}
              underline="hover"
            >
              {APP_NAME}
            </Anchor>
            <ProfileMenu />
          </Group>
        </Container>
      </Box>
      <Container component="main" id="main-content" tabIndex={-1} size={1120} py="xl" style={{ outline: 'none' }}>
        {view === 'home' && <HomePage />}
        {view === 'flow' && <FlowPage />}
        {view === 'confirm' && <ConfirmationPage />}
      </Container>
    </>
  );
}
