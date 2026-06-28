import { describe, expect, it } from 'vitest';
import { buildDebate, favorabilityToRing, runConsensus } from './consensus.js';
import { getProfile } from './profiles.js';
import type { EvaluationProfile } from './profiles.js';
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

describe('buildDebate', () => {
  const grpc: Technology = {
    id: 'grpc',
    name: 'gRPC',
    category: 'libraries-and-sdks',
    currentRing: 'Assess',
  };

  it('surfaces a debate when dimensions disagree (gRPC)', () => {
    const debate = buildDebate(grpc, getProfile('grpc'), 'Trial');
    expect(debate).not.toBeNull();
    expect(debate?.positions).toHaveLength(5);
    expect(debate?.pointsOfDisagreement.length).toBeGreaterThan(0);
  });

  it('returns null when the dimensions broadly agree', () => {
    const flat = (score: number) => ({ score, summary: '', citations: [] });
    const agreeing: EvaluationProfile = {
      signals: [],
      dimensions: {
        Value: flat(0.7),
        Risk: flat(0.7),
        Cost: flat(0.65),
        Operability: flat(0.68),
        StrategicFit: flat(0.72),
      },
    };
    expect(buildDebate(grpc, agreeing, 'Trial')).toBeNull();
  });
});
