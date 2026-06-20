import { useMemo, useState } from 'react';
import type { AgUiEvent, GenerativeUiEvent, RingChangeProposal } from '@curator/shared';
import { SEED_TECHNOLOGIES } from '@curator/shared';
import { streamRun } from './lib/agui-client.js';
import { GenerativeUi } from './components/GenerativeUi.js';
import { RadarVisualization } from './components/RadarVisualization.js';
import { cn } from './lib/utils.js';

/**
 * Phase 1 thin vertical slice: render the read-only radar and stream a real
 * (deterministic) evaluation run as generative UI — dimension evidence panels,
 * the ring-change proposal, and the HITL approval gate.
 */
export function App() {
  const [events, setEvents] = useState<AgUiEvent[]>([]);
  const [proposal, setProposal] = useState<RingChangeProposal | null>(null);
  const [running, setRunning] = useState(false);

  const run = (): void => {
    setEvents([]);
    setProposal(null);
    setRunning(true);
    streamRun('Should we move gRPC to Trial?', {
      onEvent: (event) => {
        setEvents((prev) => [...prev, event]);
        if (event.type === 'APPROVAL_REQUIRED') {
          setProposal(event.proposal);
        } else if (
          event.type === 'GENERATIVE_UI' &&
          event.payload.component === 'RingChangeProposalCard'
        ) {
          setProposal(event.payload.proposal);
        }
      },
      onDone: () => setRunning(false),
      onError: () => setRunning(false),
    });
  };

  const genUiEvents = useMemo(
    () => events.filter((e): e is GenerativeUiEvent => e.type === 'GENERATIVE_UI'),
    [events],
  );
  const approvalPending = events.some((e) => e.type === 'APPROVAL_REQUIRED');
  const proposedMove = proposal
    ? { technologyId: proposal.technologyId, fromRing: proposal.fromRing, toRing: proposal.toRing }
    : undefined;

  return (
    <main className="mx-auto max-w-5xl p-8 font-sans">
      <header>
        <h1 className="text-2xl font-bold">Tech Radar Curator</h1>
        <p className="mt-1 text-sm text-gray-500">
          Read-only radar with agent reasoning streamed as generative UI.
        </p>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className={cn(
            'mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {running ? 'Evaluating…' : 'Evaluate gRPC'}
        </button>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Radar
          </h2>
          <RadarVisualization technologies={SEED_TECHNOLOGIES} proposedMove={proposedMove} />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Agent reasoning
          </h2>

          {approvalPending && (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              Approval required — a human must approve this ring change before it can be published
              (HITL).
            </div>
          )}

          <div className="space-y-3">
            {genUiEvents.length === 0 && !running && (
              <p className="text-sm text-gray-500">
                Run an evaluation to see the agents’ reasoning stream in.
              </p>
            )}
            {genUiEvents.map((event) => (
              <GenerativeUi key={event.seq} payload={event.payload} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
