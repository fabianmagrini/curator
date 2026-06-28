import { Injectable, type MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  runEvaluation,
  type AgUiEvent,
  type ApprovalResolution,
  type ApproverRole,
} from '@curator/agents';
import { ApprovalRegistry } from './approval-registry.js';
import { ApprovalPolicy } from './approval-policy.js';
import { EventStore } from '../store/event-store.js';
import { AuditStore } from '../store/audit-store.js';

/** Outcome of resolving an approval: success, unknown id, or policy denial. */
export type ResolveOutcome =
  | { status: 'ok' }
  | { status: 'not_found' }
  | { status: 'forbidden'; reason: string };

/**
 * Bridges the agent runtime to the AG-UI SSE transport and owns the control-plane
 * concerns: per-session event persistence, audit logging, and approval brokering
 * (the agent run blocks until a human resolves the approval — ADR-0004).
 */
@Injectable()
export class AgUiService {
  constructor(
    private readonly approvals: ApprovalRegistry,
    private readonly events: EventStore,
    private readonly audit: AuditStore,
    private readonly policy: ApprovalPolicy,
  ) {}

  /**
   * Stream one agent run as AG-UI events over SSE, persisting each event under the
   * run's own `runId` (the session id the client sees on every event), so the
   * stream can be replayed via `GET /agui/sessions/:id/events`.
   */
  streamRun(prompt: string, technologyId?: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let cancelled = false;
      let pendingApprovalId: string | null = null;

      void (async () => {
        try {
          for await (const event of runEvaluation({
            prompt,
            technologyId,
            awaitApproval: ({ approvalId, proposal }) => this.approvals.wait(approvalId, proposal),
          })) {
            if (cancelled) return;
            if (event.type === 'APPROVAL_REQUIRED') pendingApprovalId = event.approvalId;
            await this.events.append(event.runId, event);
            subscriber.next(this.toMessageEvent(event));
          }
          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      })();

      return () => {
        cancelled = true;
        if (pendingApprovalId) this.approvals.cancel(pendingApprovalId);
      };
    });
  }

  /**
   * Resolve a pending approval (called from the controller). Enforces the
   * server-side approval policy, then records an immutable audit entry *before*
   * unblocking the run. A denied decision leaves the run blocked and writes no
   * audit entry (only authorized decisions are part of the record).
   */
  async resolveApproval(
    approvalId: string,
    role: ApproverRole,
    resolution: ApprovalResolution,
  ): Promise<ResolveOutcome> {
    const proposal = this.approvals.proposalFor(approvalId);
    if (!proposal) return { status: 'not_found' };

    const verdict = this.policy.canApprove(role, proposal);
    if (!verdict.allowed) return { status: 'forbidden', reason: verdict.reason };

    await this.audit.record({
      timestamp: new Date().toISOString(),
      approvalId,
      technologyId: proposal.technologyId,
      fromRing: proposal.fromRing,
      toRing: proposal.toRing,
      decision: resolution.decision,
      approverRole: role,
      rationale: resolution.rationale,
      dissent: resolution.dissent,
    });
    this.approvals.resolve(approvalId, resolution);
    return { status: 'ok' };
  }

  private toMessageEvent(event: AgUiEvent): MessageEvent {
    // Omit `type` so every event arrives on the browser's default `message`
    // handler; the AG-UI event type travels in the payload (`data.type`).
    return {
      id: String(event.seq),
      data: event,
    };
  }
}
