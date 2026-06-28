import { useMemo, useState } from 'react';
import type { AgUiEvent, GenerativeUiEvent, RingChangeProposal } from '@curator/shared';
import { SEED_TECHNOLOGIES, findTechnology } from '@curator/shared';
import { streamRun } from './lib/agui-client.js';
import { GenerativeUi } from './components/GenerativeUi.js';
import { RadarVisualization } from './components/RadarVisualization.js';
import { cn } from './lib/utils.js';

/**
 * Phase 1 web slice: read-only radar with selection + a technology picker, and a
 * deterministic evaluation streamed as generative UI (signal timeline, dimension
 * evidence, agent debate, ring-change proposal, HITL gate).
 */
export function App() {
  const [selectedId, setSelectedId] = useState('grpc');
  const [events, setEvents] = useState<AgUiEvent[]>([]);
  const [proposal, setProposal] = useState<RingChangeProposal | null>(null);
  const [running, setRunning] = useState(false);

  const selectedName = findTechnology(selectedId)?.name ?? selectedId;

  const run = (): void => {
    setEvents([]);
    setProposal(null);
    setRunning(true);
    streamRun(
      `Should we re-evaluate ${selectedName}?`,
      {
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
      },
      selectedId,
    );
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

        <div className="mt-4 flex items-center gap-2">
          <label htmlFor="tech" className="text-sm text-gray-500">
            Technology
          </label>
          <select
            id="tech"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            {SEED_TECHNOLOGIES.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={run}
            disabled={running}
            className={cn(
              'rounded-md bg-black px-4 py-2 text-sm font-medium text-white',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {running ? 'Evaluating…' : `Evaluate ${selectedName}`}
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Radar
          </h2>
          <RadarVisualization
            technologies={SEED_TECHNOLOGIES}
            proposedMove={proposedMove}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <p className="mt-2 text-xs text-gray-400">Tip: click a technology to select it.</p>
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
                Pick a technology and run an evaluation to see the agents’ reasoning stream in.
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
