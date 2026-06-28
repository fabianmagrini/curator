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
  type ApprovalResolution,
  type RingChangeProposal,
  type SignalTimelinePoint,
  type Technology,
} from '@curator/shared';
import { randomRunId } from './ids.js';
import { getProfile, type EvaluationProfile } from './profiles.js';
import { buildDebate, runConsensus } from './consensus.js';

/**
 * Injected by the gateway to broker human approval: the run blocks on this
 * promise after emitting `APPROVAL_REQUIRED` and resumes when a human resolves
 * it (ADR-0004). Omitted in standalone use, in which case the run does not block.
 */
export type AwaitApproval = (request: {
  approvalId: string;
  proposal: RingChangeProposal;
}) => Promise<ApprovalResolution>;

export interface EvaluationRequest {
  /** Free-text reviewer prompt, e.g. "Should we move gRPC to Trial?". */
  prompt: string;
  /** Technology to evaluate; defaults to the gRPC example. */
  technologyId?: string;
  /** When provided, the run blocks for human approval before finishing. */
  awaitApproval?: AwaitApproval;
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

function toTimelinePoints(profile: EvaluationProfile): SignalTimelinePoint[] {
  return profile.signals
    .map((signal) => ({
      timestamp: signal.timestamp.toISOString(),
      source: signal.source,
      strength: signal.strength,
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/** Run one evaluation, yielding AG-UI events in order. */
export async function* runEvaluation(request: EvaluationRequest): AsyncGenerator<AgUiEvent> {
  const technology = resolveTechnology(request.technologyId ?? 'grpc');
  const profile = getProfile(technology.id);
  const proposal = runConsensus(technology, profile);
  const debate = buildDebate(technology, profile, proposal.toRing);

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

  yield {
    type: 'GENERATIVE_UI',
    runId,
    seq: seq++,
    timestamp: now(),
    payload: {
      component: 'SignalTimeline',
      technologyId: technology.id,
      points: toTimelinePoints(profile),
    },
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

  if (debate) {
    yield {
      type: 'GENERATIVE_UI',
      runId,
      seq: seq++,
      timestamp: now(),
      payload: debate,
    };
  }

  yield {
    type: 'GENERATIVE_UI',
    runId,
    seq: seq++,
    timestamp: now(),
    payload: { component: 'RingChangeProposalCard', proposal },
  };

  const approvalId = `${runId}-approval-0`;
  // Register the wait *before* announcing the gate, so a resolution that arrives
  // immediately after the event can't race ahead of registration.
  const approvalPromise = request.awaitApproval?.({ approvalId, proposal });

  yield {
    type: 'APPROVAL_REQUIRED',
    runId,
    seq: seq++,
    timestamp: now(),
    approvalId,
    proposal,
  };

  if (!approvalPromise) {
    // Standalone: don't block; report the proposal awaits a human.
    yield {
      type: 'FINAL_RESPONSE',
      runId,
      seq: seq++,
      timestamp: now(),
      message: `Proposed ${proposal.fromRing} → ${proposal.toRing} for ${technology.name}; awaiting human approval.`,
    };
    return;
  }

  // Block until a human resolves the approval (the gateway brokers this).
  const resolution = await approvalPromise;

  if (resolution.decision === 'approve') {
    yield {
      type: 'STATE_UPDATE',
      runId,
      seq: seq++,
      timestamp: now(),
      key: 'radar.published',
      value: { technologyId: technology.id, ring: proposal.toRing },
    };
    yield {
      type: 'FINAL_RESPONSE',
      runId,
      seq: seq++,
      timestamp: now(),
      message: `Approved — ${technology.name} published to ${proposal.toRing}.`,
    };
    return;
  }

  if (resolution.decision === 'reject') {
    yield {
      type: 'FINAL_RESPONSE',
      runId,
      seq: seq++,
      timestamp: now(),
      message: `Rejected — ${technology.name} stays at ${proposal.fromRing}.`,
    };
    return;
  }

  yield {
    type: 'FINAL_RESPONSE',
    runId,
    seq: seq++,
    timestamp: now(),
    message: `Changes requested for ${technology.name} — proposal sent back to the agents.`,
  };
}
