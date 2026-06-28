import { describe, expect, it } from 'vitest';
import type { RingChangeProposal } from '@curator/agents';
import { ApprovalPolicy } from './approval-policy.js';

const proposal: RingChangeProposal = {
  technologyId: 'grpc',
  technologyName: 'gRPC',
  fromRing: 'Assess',
  toRing: 'Trial',
  confidence: 0.8,
  keyDrivers: [],
  keyRisks: [],
  reviewDate: '2026-12-31',
};

describe('ApprovalPolicy', () => {
  const policy = new ApprovalPolicy();

  it('lets the architecture group approve any ring change', () => {
    expect(policy.canApprove('architect', proposal)).toEqual({ allowed: true });
  });

  it('denies read-only engineers with a reason', () => {
    const verdict = policy.canApprove('engineer', proposal);
    expect(verdict.allowed).toBe(false);
    expect(verdict.allowed === false && verdict.reason).toMatch(/read-only/i);
  });

  describe('roleFromHeader', () => {
    it('accepts a known role, case- and whitespace-insensitively', () => {
      expect(policy.roleFromHeader('Architect')).toBe('architect');
      expect(policy.roleFromHeader('  engineer ')).toBe('engineer');
    });

    it('defaults unknown or absent roles to the least-privileged engineer', () => {
      expect(policy.roleFromHeader(undefined)).toBe('engineer');
      expect(policy.roleFromHeader('admin')).toBe('engineer');
      expect(policy.roleFromHeader('')).toBe('engineer');
    });
  });
});
