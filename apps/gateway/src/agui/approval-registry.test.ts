import { describe, expect, it } from 'vitest';
import type { RingChangeProposal } from '@curator/agents';
import { ApprovalRegistry } from './approval-registry.js';

const proposal: RingChangeProposal = {
  technologyId: 'grpc',
  technologyName: 'gRPC',
  fromRing: 'Assess',
  toRing: 'Trial',
  confidence: 0.8,
  keyDrivers: [],
  keyRisks: [],
  reviewDate: '2026-12-01',
};

describe('ApprovalRegistry', () => {
  it('settles the waiting promise when resolved', async () => {
    const registry = new ApprovalRegistry();
    const waited = registry.wait('a1', proposal);

    const returned = registry.resolve('a1', { approvalId: 'a1', decision: 'approve' });
    expect(returned).toEqual(proposal);

    await expect(waited).resolves.toEqual({ approvalId: 'a1', decision: 'approve' });
    expect(registry.isPending('a1')).toBe(false);
  });

  it('returns null when resolving an unknown approval', () => {
    const registry = new ApprovalRegistry();
    expect(registry.resolve('nope', { approvalId: 'nope', decision: 'approve' })).toBeNull();
  });

  it('rejects the waiting promise on cancel', async () => {
    const registry = new ApprovalRegistry();
    const waited = registry.wait('a2', proposal);
    registry.cancel('a2');
    await expect(waited).rejects.toThrow(/cancelled/);
  });
});
