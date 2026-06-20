/**
 * The evaluation pipeline (spec §5.1, §6): Signal Ingestion → five dimension
 * agents → Consensus & Scoring, emitting a typed AG-UI event stream as it works.
 * Deterministic/seeded for Phase 1; the public contract is an async iterable of
 * `AgUiEvent`, so a VoltAgent workflow can replace the internals later (ADR-0006).
 */
import {
  EVALUATION_DIMENSIONS,
  findTechnology,
  type AgUiEvent,
  type Technology,
} from '@curator/shared';
import { randomRunId } from './ids.js';
import { getProfile } from './profiles.js';
import { runConsensus } from './consensus.js';

export interface EvaluationRequest {
  /** Free-text reviewer prompt, e.g. "Should we move gRPC to Trial?". */
  prompt: string;
  /** Technology to evaluate; defaults to the gRPC example. */
  technologyId?: string;
}

function resolveTechnology(technologyId: string): Technology {
  return (
    findTechnology(technologyId) ?? {
      id: technologyId,
      name: technologyId,
      category: 'tools',
      currentRing: 'Assess',
    }
  );
}

/** Run one evaluation, yielding AG-UI events in order. */
export async function* runEvaluation(request: EvaluationRequest): AsyncGenerator<AgUiEvent> {
  const technology = resolveTechnology(request.technologyId ?? 'grpc');
  const profile = getProfile(technology.id);

  const runId = randomRunId();
  let seq = 0;
  const now = (): string => new Date().toISOString();

  yield {
    type: 'TOOL_CALL_START',
    runId,
    seq: seq++,
    timestamp: now(),
    toolName: 'evidence-store.query',
    label: `Gathering signals for ${technology.name}…`,
  };

  yield {
    type: 'PROGRESS',
    runId,
    seq: seq++,
    timestamp: now(),
    message: `Ingested ${profile.signals.length} signals for ${technology.name}.`,
    ratio: 0.2,
  };

  for (const dimension of EVALUATION_DIMENSIONS) {
    const p = profile.dimensions[dimension];
    yield {
      type: 'GENERATIVE_UI',
      runId,
      seq: seq++,
      timestamp: now(),
      payload: {
        component: 'DimensionEvidencePanel',
        technologyId: technology.id,
        dimension,
        score: p.score,
        summary: p.summary,
        citations: p.citations,
      },
    };
  }

  const proposal = runConsensus(technology, profile);

  yield {
    type: 'GENERATIVE_UI',
    runId,
    seq: seq++,
    timestamp: now(),
    payload: { component: 'RingChangeProposalCard', proposal },
  };

  yield {
    type: 'APPROVAL_REQUIRED',
    runId,
    seq: seq++,
    timestamp: now(),
    approvalId: `${runId}-approval-0`,
    proposal,
  };

  yield {
    type: 'FINAL_RESPONSE',
    runId,
    seq: seq++,
    timestamp: now(),
    message: `Proposed ${proposal.fromRing} → ${proposal.toRing} for ${technology.name}; awaiting human approval.`,
  };
}
