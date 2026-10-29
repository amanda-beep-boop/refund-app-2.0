import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './styles.css';
import { theme, cssVariablesResolver } from './theme';
import { RefundProvider } from './state/RefundContext';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root element.');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} forceColorScheme="light">
      <Notifications position="bottom-center" />
      <RefundProvider>
        <App />
      </RefundProvider>
    </MantineProvider>
  </React.StrictMode>
);
