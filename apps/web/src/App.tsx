import { useState } from 'react';
import type { AgUiEvent } from '@curator/shared';
import { streamRun } from './lib/agui-client.js';
import { cn } from './lib/utils.js';

/**
 * Phase 0 smoke UI: connect to the gateway, run the planner, and render the
 * raw AG-UI event stream. Generative-UI components (RadarVisualization,
 * RingChangeProposalCard, …) replace this list in Phase 1 (spec §9.3).
 */
export function App() {
  const [events, setEvents] = useState<AgUiEvent[]>([]);
  const [running, setRunning] = useState(false);

  const run = (): void => {
    setEvents([]);
    setRunning(true);
    streamRun('Should we move gRPC to Trial?', {
      onEvent: (event) => setEvents((prev) => [...prev, event]),
      onDone: () => setRunning(false),
      onError: () => setRunning(false),
    });
  };

  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-2xl font-bold">Tech Radar Curator</h1>
      <p className="mt-1 text-sm text-gray-500">
        Phase 0 smoke — streaming AG-UI events from the gateway.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={running}
        className={cn(
          'mt-6 rounded-md bg-black px-4 py-2 text-sm font-medium text-white',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {running ? 'Running…' : 'Run evaluation'}
      </button>

      <ol className="mt-6 space-y-2">
        {events.map((event) => (
          <li
            key={event.seq}
            className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700"
          >
            <span className="font-mono font-semibold">{event.type}</span>
            <pre className="mt-1 overflow-x-auto text-xs text-gray-500">
              {JSON.stringify(event, null, 2)}
            </pre>
          </li>
        ))}
      </ol>
    </main>
  );
}
