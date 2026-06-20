import { describe, expect, it } from 'vitest';
import { runPlanner } from './planner.js';
import type { AgUiEvent } from './index.js';

async function collect(prompt: string): Promise<AgUiEvent[]> {
  const events: AgUiEvent[] = [];
  for await (const event of runPlanner({ prompt })) {
    events.push(event);
  }
  return events;
}

describe('runPlanner', () => {
  it('emits a well-ordered AG-UI stream ending in FINAL_RESPONSE', async () => {
    const events = await collect('Should we move gRPC to Trial?');

    expect(events.at(0)?.type).toBe('TOOL_CALL_START');
    expect(events.at(-1)?.type).toBe('FINAL_RESPONSE');

    // Single run id, strictly increasing sequence numbers.
    const runIds = new Set(events.map((e) => e.runId));
    expect(runIds.size).toBe(1);
    events.forEach((e, i) => expect(e.seq).toBe(i));
  });

  it('blocks for approval before finishing (HITL gate)', async () => {
    const events = await collect('Re-evaluate gRPC');
    const approvalIndex = events.findIndex((e) => e.type === 'APPROVAL_REQUIRED');
    const finalIndex = events.findIndex((e) => e.type === 'FINAL_RESPONSE');

    expect(approvalIndex).toBeGreaterThanOrEqual(0);
    expect(approvalIndex).toBeLessThan(finalIndex);
  });
});
