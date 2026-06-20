/**
 * No-op Planner / Curator agent (Phase 0 scaffold).
 *
 * It produces a representative AG-UI event stream for a single evaluation run —
 * the same shape the real multi-agent pipeline will emit (spec §6, §9.4) — so
 * the gateway and web app can be wired end-to-end before the reasoning logic
 * exists.
 *
 * VoltAgent / VoltOps integration point: replace the hard-coded sequence below
 * with a VoltAgent workflow (Signal Ingestion → Value/Risk/Cost/Operability/
 * Strategic Fit → Consensus & Scoring), wrapping each step in a VoltOps trace.
 * The public contract — an async iterable of `AgUiEvent` — stays the same.
 */
import { type AgUiEvent, type RingChangeProposal, randomRunId } from './index.js';

export interface PlannerRequest {
  /** Free-text reviewer prompt, e.g. "Should we move gRPC to Trial?". */
  prompt: string;
  /** Optional technology id the prompt is about. */
  technologyId?: string;
}

const SAMPLE_PROPOSAL: RingChangeProposal = {
  technologyId: 'grpc',
  technologyName: 'gRPC',
  fromRing: 'Assess',
  toRing: 'Trial',
  confidence: 0.78,
  keyDrivers: ['Strong ecosystem', 'Developer productivity'],
  keyRisks: ['Immature internal tooling'],
  reviewDate: '2026-12-01',
};

/**
 * Run the planner for a request, yielding AG-UI events in order. Each event
 * carries a shared `runId` and a monotonic `seq`.
 */
export async function* runPlanner(_request: PlannerRequest): AsyncGenerator<AgUiEvent> {
  const runId = randomRunId();
  let seq = 0;
  const now = (): string => new Date().toISOString();

  yield {
    type: 'TOOL_CALL_START',
    runId,
    seq: seq++,
    timestamp: now(),
    toolName: 'evidence-store.query',
    label: 'Querying evidence store…',
  };

  yield {
    type: 'GENERATIVE_UI',
    runId,
    seq: seq++,
    timestamp: now(),
    payload: {
      component: 'DimensionEvidencePanel',
      technologyId: SAMPLE_PROPOSAL.technologyId,
      dimension: 'Value',
      score: 0.82,
      summary: 'Reduces boilerplate and improves cross-service contract safety.',
      citations: [{ source: 'repo', label: '14 services already depend on it' }],
    },
  };

  yield {
    type: 'GENERATIVE_UI',
    runId,
    seq: seq++,
    timestamp: now(),
    payload: {
      component: 'RingChangeProposalCard',
      proposal: SAMPLE_PROPOSAL,
    },
  };

  yield {
    type: 'APPROVAL_REQUIRED',
    runId,
    seq: seq++,
    timestamp: now(),
    approvalId: `${runId}-approval-0`,
    proposal: SAMPLE_PROPOSAL,
  };

  yield {
    type: 'FINAL_RESPONSE',
    runId,
    seq: seq++,
    timestamp: now(),
    message: 'Proposal prepared and awaiting human approval.',
  };
}
