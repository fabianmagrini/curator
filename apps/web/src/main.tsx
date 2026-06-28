import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CopilotKit } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';
import { App } from './App.js';
import { copilotConfig } from './lib/copilot.js';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

const { enabled, runtimeUrl } = copilotConfig();

// The CopilotKit provider mounts only when a runtime URL is configured; otherwise
// the app renders its default direct-SSE experience (ADR-0015).
const tree = enabled ? (
  <CopilotKit runtimeUrl={runtimeUrl}>
    <App />
  </CopilotKit>
) : (
  <App />
);

createRoot(rootEl).render(<StrictMode>{tree}</StrictMode>);
