import { describe, expect, it } from 'vitest';
import type { AgUiEvent, ApprovalDecision } from '@curator/agents';
import { AgUiService } from './agui.service.js';
import { ApprovalRegistry } from './approval-registry.js';
import { InMemoryEventStore } from '../store/event-store.js';
import { InMemoryAuditStore } from '../store/audit-store.js';

function makeService() {
  const approvals = new ApprovalRegistry();
  const events = new InMemoryEventStore();
  const audit = new InMemoryAuditStore();
  return { service: new AgUiService(approvals, events, audit), audit };
}

/** Subscribe, auto-resolve the approval with `decision`, resolve on completion. */
function runAndDecide(service: AgUiService, decision: ApprovalDecision): Promise<AgUiEvent[]> {
  return new Promise((resolve, reject) => {
    const events: AgUiEvent[] = [];
    service.streamRun('evaluate', 'grpc').subscribe({
      next: (msg) => {
        const event = msg.data as AgUiEvent;
        events.push(event);
        if (event.type === 'APPROVAL_REQUIRED') {
          service.resolveApproval(event.approvalId, { approvalId: event.approvalId, decision });
        }
      },
      error: reject,
      complete: () => resolve(events),
    });
  });
}

describe('AgUiService approval brokering', () => {
  it('blocks at the approval gate and resumes to a published, approved final', async () => {
    const { service, audit } = makeService();
    const events = await runAndDecide(service, 'approve');

    const approvalIndex = events.findIndex((e) => e.type === 'APPROVAL_REQUIRED');
    const finalIndex = events.findIndex((e) => e.type === 'FINAL_RESPONSE');
    expect(approvalIndex).toBeGreaterThanOrEqual(0);
    expect(finalIndex).toBeGreaterThan(approvalIndex);

    expect(events.some((e) => e.type === 'STATE_UPDATE' && e.key === 'radar.published')).toBe(true);

    // One immutable audit entry recorded with the decision.
    expect(audit.all()).toHaveLength(1);
    expect(audit.all()[0]?.decision).toBe('approve');
    expect(audit.all()[0]?.technologyId).toBe('grpc');
  });

  it('records a reject decision and ends without publishing', async () => {
    const { service, audit } = makeService();
    const events = await runAndDecide(service, 'reject');

    expect(events.some((e) => e.type === 'STATE_UPDATE')).toBe(false);
    expect(audit.all()[0]?.decision).toBe('reject');
    const final = events.at(-1);
    expect(final?.type === 'FINAL_RESPONSE' && final.message).toMatch(/rejected/i);
  });

  it('reports unknown approvals', () => {
    const { service } = makeService();
    expect(service.resolveApproval('missing', { approvalId: 'missing', decision: 'approve' })).toBe(
      false,
    );
  });
});
