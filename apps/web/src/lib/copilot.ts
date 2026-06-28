/**
 * CopilotKit web gate. The sidebar is opt-in: it renders only when
 * `VITE_COPILOT_RUNTIME_URL` points at the gateway's CopilotKit runtime
 * (ADR-0015). When unset, the app renders its default direct-SSE experience.
 */
export interface CopilotConfig {
  /** Gateway CopilotKit runtime endpoint, e.g. http://localhost:4000/copilotkit. */
  runtimeUrl?: string;
  /** Whether the CopilotKit provider + sidebar should mount. */
  enabled: boolean;
}

export function copilotConfig(): CopilotConfig {
  const runtimeUrl = import.meta.env.VITE_COPILOT_RUNTIME_URL;
  return { runtimeUrl, enabled: Boolean(runtimeUrl) };
}
