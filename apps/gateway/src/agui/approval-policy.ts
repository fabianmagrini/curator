import { Injectable } from '@nestjs/common';
import { APPROVER_ROLES, type ApproverRole, type RingChangeProposal } from '@curator/agents';

/** Outcome of a policy check: allowed, or denied with a human-readable reason. */
export type PolicyDecision = { allowed: true } | { allowed: false; reason: string };

/**
 * Server-side approval policy: who may approve which ring changes (spec §10, §12).
 * Authority lives in the gateway, not the browser — the UX layer holds no power.
 *
 * Current rule (ADR-0014): the architecture group may resolve any ring change;
 * everyone else is read-only and is denied. Per-ring/quadrant granularity can be
 * layered on later by inspecting the proposal.
 */
@Injectable()
export class ApprovalPolicy {
  /** Coerce an untrusted header value into a known role, defaulting to the least-privileged. */
  roleFromHeader(value: string | undefined): ApproverRole {
    const normalized = value?.trim().toLowerCase();
    return APPROVER_ROLES.includes(normalized as ApproverRole)
      ? (normalized as ApproverRole)
      : 'engineer';
  }

  /** Whether `role` may resolve the given proposal. */
  canApprove(role: ApproverRole, _proposal: RingChangeProposal): PolicyDecision {
    if (role === 'architect') return { allowed: true };
    return {
      allowed: false,
      reason: `role '${role}' is read-only; ring changes require the architecture group`,
    };
  }
}
