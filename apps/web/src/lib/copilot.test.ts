import { afterEach, describe, expect, it, vi } from 'vitest';
import { copilotConfig } from './copilot.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('copilotConfig', () => {
  it('is disabled when VITE_COPILOT_RUNTIME_URL is unset', () => {
    vi.stubEnv('VITE_COPILOT_RUNTIME_URL', '');
    expect(copilotConfig()).toEqual({ runtimeUrl: '', enabled: false });
  });

  it('is enabled and carries the runtime URL when set', () => {
    vi.stubEnv('VITE_COPILOT_RUNTIME_URL', 'http://localhost:4000/copilotkit');
    expect(copilotConfig()).toEqual({
      runtimeUrl: 'http://localhost:4000/copilotkit',
      enabled: true,
    });
  });
});
