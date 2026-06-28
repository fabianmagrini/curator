import { useMemo, useState } from 'react';
import type {
  AgUiEvent,
  ApprovalDecision,
  GenerativeUiEvent,
  RadarRing,
  RingChangeProposal,
} from '@curator/shared';
import { SEED_TECHNOLOGIES, findTechnology } from '@curator/shared';
import { resolveApproval, streamRun, type ApprovalInput } from './lib/agui-client.js';
import { GenerativeUi } from './components/GenerativeUi.js';
import { RadarVisualization } from './components/RadarVisualization.js';
import { ApprovalCard } from './components/ApprovalCard.js';
import { CopilotBindings } from './components/CopilotBindings.js';
import { copilotConfig } from './lib/copilot.js';
import { cn } from './lib/utils.js';

interface PendingApproval {
  approvalId: string;
  proposal: RingChangeProposal;
}

/**
 * Phase 1 web slice: read-only radar with selection + a technology picker, and a
 * deterministic evaluation streamed as generative UI (signal timeline, dimension
 * evidence, agent debate, ring-change proposal, HITL gate).
 */
export function App() {
  const [selectedId, setSelectedId] = useState('grpc');
  const [events, setEvents] = useState<AgUiEvent[]>([]);
  const [proposal, setProposal] = useState<RingChangeProposal | null>(null);
  const [approval, setApproval] = useState<PendingApproval | null>(null);
  const [finalMessage, setFinalMessage] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [highlightedRing, setHighlightedRing] = useState<RadarRing | null>(null);

  const { enabled: copilotEnabled } = copilotConfig();
  const selectedName = findTechnology(selectedId)?.name ?? selectedId;

  const run = (): void => {
    setEvents([]);
    setProposal(null);
    setApproval(null);
    setFinalMessage(null);
    setRunning(true);
    streamRun(
      `Should we re-evaluate ${selectedName}?`,
      {
        onEvent: (event) => {
          setEvents((prev) => [...prev, event]);
          if (event.type === 'APPROVAL_REQUIRED') {
            setApproval({ approvalId: event.approvalId, proposal: event.proposal });
            setProposal(event.proposal);
          } else if (
            event.type === 'GENERATIVE_UI' &&
            event.payload.component === 'RingChangeProposalCard'
          ) {
            setProposal(event.payload.proposal);
          } else if (event.type === 'FINAL_RESPONSE') {
            setApproval(null);
            setFinalMessage(event.message);
          }
        },
        onDone: () => setRunning(false),
        onError: () => setRunning(false),
      },
      selectedId,
    );
  };

  const decide = async (decision: ApprovalDecision, input: ApprovalInput): Promise<void> => {
    if (!approval) return;
    setResolving(true);
    try {
      await resolveApproval(approval.approvalId, decision, input);
    } catch {
      setResolving(false);
      return;
    }
    // The gateway unblocks the run; FINAL_RESPONSE clears the approval.
    setResolving(false);
  };

  const genUiEvents = useMemo(
    () => events.filter((e): e is GenerativeUiEvent => e.type === 'GENERATIVE_UI'),
    [events],
  );
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
            highlightedRing={highlightedRing}
          />
          <p className="mt-2 text-xs text-gray-400">Tip: click a technology to select it.</p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Agent reasoning
          </h2>

          {approval && (
            <ApprovalCard proposal={approval.proposal} busy={resolving} onDecision={decide} />
          )}

          {finalMessage && (
            <p className="mb-3 rounded-md border border-gray-200 bg-gray-50 p-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              {finalMessage}
            </p>
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

      {copilotEnabled && (
        <CopilotBindings
          selectedId={selectedId}
          onSelectTechnology={setSelectedId}
          onHighlightRing={setHighlightedRing}
        />
      )}
    </main>
  );
}
