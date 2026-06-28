import { describe, expect, it } from 'vitest';
import type { AgUiEvent, ApprovalDecision } from '@curator/agents';
import { AgUiService } from './agui.service.js';
import { ApprovalRegistry } from './approval-registry.js';
import { ApprovalPolicy } from './approval-policy.js';
import { InMemoryEventStore } from '../store/event-store.js';
import { InMemoryAuditStore } from '../store/audit-store.js';

function makeService() {
  const approvals = new ApprovalRegistry();
  const events = new InMemoryEventStore();
  const audit = new InMemoryAuditStore();
  const policy = new ApprovalPolicy();
  return { service: new AgUiService(approvals, events, audit, policy), events, audit };
}

/** Subscribe, auto-resolve the approval with `decision` as an architect, resolve on completion. */
function runAndDecide(service: AgUiService, decision: ApprovalDecision): Promise<AgUiEvent[]> {
  return new Promise((resolve, reject) => {
    const events: AgUiEvent[] = [];
    service.streamRun('evaluate', 'grpc').subscribe({
      next: (msg) => {
        const event = msg.data as AgUiEvent;
        events.push(event);
        if (event.type === 'APPROVAL_REQUIRED') {
          void service.resolveApproval(event.approvalId, 'architect', {
            approvalId: event.approvalId,
            decision,
          });
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

    // One immutable audit entry recorded with the decision and the approver role.
    const entries = await audit.all();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.decision).toBe('approve');
    expect(entries[0]?.technologyId).toBe('grpc');
    expect(entries[0]?.approverRole).toBe('architect');
  });

  it('persists every streamed event under the run id, replayable in order', async () => {
    const { service, events: store } = makeService();
    const streamed = await runAndDecide(service, 'approve');

    const runId = streamed[0]?.runId;
    expect(runId).toBeDefined();
    // The whole stream is keyed by the run id the client saw on every event.
    const replay = await store.bySession(runId as string);
    expect(replay.map((e) => e.seq)).toEqual(streamed.map((e) => e.seq));
    expect(replay.at(-1)?.type).toBe('FINAL_RESPONSE');
  });

  it('records a reject decision and ends without publishing', async () => {
    const { service, audit } = makeService();
    const events = await runAndDecide(service, 'reject');

    expect(events.some((e) => e.type === 'STATE_UPDATE')).toBe(false);
    expect((await audit.all())[0]?.decision).toBe('reject');
    const final = events.at(-1);
    expect(final?.type === 'FINAL_RESPONSE' && final.message).toMatch(/rejected/i);
  });

  it('reports unknown approvals', async () => {
    const { service } = makeService();
    await expect(
      service.resolveApproval('missing', 'architect', {
        approvalId: 'missing',
        decision: 'approve',
      }),
    ).resolves.toEqual({ status: 'not_found' });
  });

  it('forbids a read-only engineer from resolving, blocking the run and writing no audit', async () => {
    const { service, audit } = makeService();

    const outcome = await new Promise((resolve, reject) => {
      service.streamRun('evaluate', 'grpc').subscribe({
        next: (msg) => {
          const event = msg.data as AgUiEvent;
          if (event.type === 'APPROVAL_REQUIRED') {
            void service
              .resolveApproval(event.approvalId, 'engineer', {
                approvalId: event.approvalId,
                decision: 'approve',
              })
              .then(resolve, reject);
          }
        },
        error: reject,
      });
    });

    expect(outcome).toMatchObject({ status: 'forbidden' });
    expect(await audit.all()).toHaveLength(0);
  });
});
