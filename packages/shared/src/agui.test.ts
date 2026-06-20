import { describe, expect, it } from 'vitest';
import {
  RADAR_RINGS,
  EVALUATION_DIMENSIONS,
  type AgUiEvent,
  type GenerativeUiEvent,
  type RingChangeProposal,
} from './index.js';

describe('domain constants', () => {
  it('exposes the four radar rings', () => {
    expect(RADAR_RINGS).toEqual(['Adopt', 'Trial', 'Assess', 'Hold']);
  });

  it('exposes the five evaluation dimensions', () => {
    expect(EVALUATION_DIMENSIONS).toHaveLength(5);
  });
});

describe('AG-UI event union', () => {
  it('narrows on the `type` discriminant', () => {
    const proposal: RingChangeProposal = {
      technologyId: 'grpc',
      technologyName: 'gRPC',
      fromRing: 'Assess',
      toRing: 'Trial',
      confidence: 0.78,
      keyDrivers: ['Productivity'],
      keyRisks: ['Immature tooling'],
      reviewDate: '2026-12-01',
    };

    const events: AgUiEvent[] = [
      { type: 'TOOL_CALL_START', runId: 'r1', seq: 0, timestamp: '', toolName: 't', label: 'l' },
      {
        type: 'GENERATIVE_UI',
        runId: 'r1',
        seq: 1,
        timestamp: '',
        payload: { component: 'RingChangeProposalCard', proposal },
      },
      {
        type: 'APPROVAL_REQUIRED',
        runId: 'r1',
        seq: 2,
        timestamp: '',
        approvalId: 'a1',
        proposal,
      },
      { type: 'FINAL_RESPONSE', runId: 'r1', seq: 3, timestamp: '', message: 'done' },
    ];

    const genUi = events.find((e): e is GenerativeUiEvent => e.type === 'GENERATIVE_UI');
    expect(genUi?.payload.component).toBe('RingChangeProposalCard');
    expect(events.at(-1)?.type).toBe('FINAL_RESPONSE');
  });
});
