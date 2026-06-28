import type { AgUiEvent } from '@curator/shared';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:4000';

export interface StreamHandlers {
  onEvent: (event: AgUiEvent) => void;
  onError?: (error: Event) => void;
  onDone?: () => void;
}

/**
 * Open an AG-UI SSE stream against the gateway for a single agent run.
 * Returns a disposer that closes the connection.
 *
 * This is the only contract between the UI and the agents — the browser never
 * talks to the agent runtime directly (spec §5, §9.5).
 */
export function streamRun(
  prompt: string,
  handlers: StreamHandlers,
  technologyId?: string,
): () => void {
  const url = new URL('/agui/stream', GATEWAY_URL);
  url.searchParams.set('prompt', prompt);
  if (technologyId) {
    url.searchParams.set('technologyId', technologyId);
  }

  const source = new EventSource(url);

  source.onmessage = (message) => {
    const event = JSON.parse(message.data) as AgUiEvent;
    handlers.onEvent(event);
    if (event.type === 'FINAL_RESPONSE') {
      source.close();
      handlers.onDone?.();
    }
  };

  source.onerror = (error) => {
    handlers.onError?.(error);
    source.close();
  };

  return () => source.close();
}
