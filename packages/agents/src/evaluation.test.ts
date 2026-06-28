import { describe, expect, it } from 'vitest';
import { runEvaluation } from './evaluation.js';
import type { AgUiEvent } from '@curator/shared';

async function collect(technologyId?: string): Promise<AgUiEvent[]> {
  const events: AgUiEvent[] = [];
  for await (const event of runEvaluation({ prompt: 'evaluate', technologyId })) {
    events.push(event);
  }
  return events;
}

describe('runEvaluation', () => {
  it('emits an ordered stream: tool call, 5 evidence panels, proposal, approval, final', async () => {
    const events = await collect('grpc');

    expect(events.at(0)?.type).toBe('TOOL_CALL_START');
    expect(events.at(-1)?.type).toBe('FINAL_RESPONSE');

    // One run, strictly increasing sequence numbers.
    expect(new Set(events.map((e) => e.runId)).size).toBe(1);
    events.forEach((e, i) => expect(e.seq).toBe(i));

    const panels = events.filter(
      (e) => e.type === 'GENERATIVE_UI' && e.payload.component === 'DimensionEvidencePanel',
    );
    expect(panels).toHaveLength(5);

    const proposals = events.filter(
      (e) => e.type === 'GENERATIVE_UI' && e.payload.component === 'RingChangeProposalCard',
    );
    expect(proposals).toHaveLength(1);

    const timelines = events.filter(
      (e) => e.type === 'GENERATIVE_UI' && e.payload.component === 'SignalTimeline',
    );
    expect(timelines).toHaveLength(1);

    // gRPC's dimension scores span >0.3, so a debate is surfaced.
    const debates = events.filter(
      (e) => e.type === 'GENERATIVE_UI' && e.payload.component === 'AgentDebateView',
    );
    expect(debates).toHaveLength(1);
  });

  it('blocks for approval before the final response (HITL gate)', async () => {
    const events = await collect('grpc');
    const approvalIndex = events.findIndex((e) => e.type === 'APPROVAL_REQUIRED');
    const finalIndex = events.findIndex((e) => e.type === 'FINAL_RESPONSE');

    expect(approvalIndex).toBeGreaterThanOrEqual(0);
    expect(approvalIndex).toBeLessThan(finalIndex);
  });

  it('handles an unseeded technology with a neutral evaluation', async () => {
    const events = await collect('totally-unknown-tech');
    expect(events.at(-1)?.type).toBe('FINAL_RESPONSE');
  });
});
