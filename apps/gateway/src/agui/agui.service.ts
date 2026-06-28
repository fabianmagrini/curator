import { Injectable, type MessageEvent } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { runEvaluation, type AgUiEvent, type ApprovalResolution } from '@curator/agents';
import { ApprovalRegistry } from './approval-registry.js';
import { EventStore } from '../store/event-store.js';
import { AuditStore } from '../store/audit-store.js';

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
  ) {}

  /** Stream one agent run as AG-UI events over SSE, persisting each event. */
  streamRun(prompt: string, technologyId?: string): Observable<MessageEvent> {
    const sessionId = randomUUID();

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
            await this.events.append(sessionId, event);
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
   * Resolve a pending approval (called from the controller). Records an immutable
   * audit entry *before* unblocking the run. Returns false if the id is unknown.
   */
  async resolveApproval(approvalId: string, resolution: ApprovalResolution): Promise<boolean> {
    const proposal = this.approvals.proposalFor(approvalId);
    if (!proposal) return false;

    await this.audit.record({
      timestamp: new Date().toISOString(),
      approvalId,
      technologyId: proposal.technologyId,
      fromRing: proposal.fromRing,
      toRing: proposal.toRing,
      decision: resolution.decision,
      rationale: resolution.rationale,
      dissent: resolution.dissent,
    });
    this.approvals.resolve(approvalId, resolution);
    return true;
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
