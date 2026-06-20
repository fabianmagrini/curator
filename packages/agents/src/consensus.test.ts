import { describe, expect, it } from 'vitest';
import { favorabilityToRing, runConsensus } from './consensus.js';
import { getProfile } from './profiles.js';
import type { Technology } from '@curator/shared';

describe('favorabilityToRing', () => {
  it('maps scores to rings at the thresholds', () => {
    expect(favorabilityToRing(0.85)).toBe('Adopt');
    expect(favorabilityToRing(0.65)).toBe('Trial');
    expect(favorabilityToRing(0.45)).toBe('Assess');
    expect(favorabilityToRing(0.2)).toBe('Hold');
  });
});

describe('runConsensus (gRPC)', () => {
  const grpc: Technology = {
    id: 'grpc',
    name: 'gRPC',
    category: 'libraries-and-sdks',
    currentRing: 'Assess',
  };

  it('proposes Assess → Trial with drivers, risks, and bounded confidence', () => {
    const proposal = runConsensus(grpc, getProfile('grpc'));

    expect(proposal.fromRing).toBe('Assess');
    expect(proposal.toRing).toBe('Trial');
    expect(proposal.keyDrivers.length).toBeGreaterThan(0);
    expect(proposal.keyRisks).toContain('Weaker observability and debuggability than REST');
    expect(proposal.confidence).toBeGreaterThanOrEqual(0.5);
    expect(proposal.confidence).toBeLessThanOrEqual(0.95);
    expect(proposal.reviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
