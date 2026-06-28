import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AgUiEvent, ApproverRole } from '@curator/agents';
import { AgUiController } from './agui.controller.js';
import { ApprovalPolicy } from './approval-policy.js';
import type { AgUiService, ResolveOutcome } from './agui.service.js';
import { InMemoryEventStore } from '../store/event-store.js';
import type { AuditStore } from '../store/audit-store.js';

/**
 * Build a controller with a real policy (the header→role coercion under test) and
 * a stub service that records the role it was handed and returns a programmed outcome.
 */
function makeController(outcome: ResolveOutcome) {
  const resolveApproval = vi.fn(async () => outcome);
  const service = { resolveApproval } as unknown as AgUiService;
  const events = new InMemoryEventStore();
  const audit = { all: vi.fn() } as unknown as AuditStore;
  const controller = new AgUiController(service, new ApprovalPolicy(), events, audit);
  return { controller, resolveApproval, events };
}

const okBody = { decision: 'approve', rationale: 'looks good' };

describe('AgUiController.resolveApproval', () => {
  it('rejects an invalid decision with 400 before touching the service', async () => {
    const { controller, resolveApproval } = makeController({ status: 'ok' });
    await expect(
      controller.resolveApproval('a1', { decision: 'yolo' }, 'architect'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(resolveApproval).not.toHaveBeenCalled();
  });

  it('derives the role from the x-approver-role header and forwards it to the service', async () => {
    const { controller, resolveApproval } = makeController({ status: 'ok' });
    await controller.resolveApproval('a1', okBody, 'Architect');

    const [id, role, resolution] = resolveApproval.mock.calls[0] as [
      string,
      ApproverRole,
      { decision: string; rationale?: string },
    ];
    expect(id).toBe('a1');
    expect(role).toBe('architect');
    expect(resolution).toMatchObject({ decision: 'approve', rationale: 'looks good' });
  });

  it('returns ok for an authorized decision', async () => {
    const { controller } = makeController({ status: 'ok' });
    await expect(controller.resolveApproval('a1', okBody, 'architect')).resolves.toEqual({
      ok: true,
    });
  });

  it('maps a policy denial to 403 — including an absent header (defaults to engineer)', async () => {
    const { controller, resolveApproval } = makeController({
      status: 'forbidden',
      reason: 'read-only',
    });
    await expect(controller.resolveApproval('a1', okBody, undefined)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    // Absent header coerces to the least-privileged role at the boundary.
    expect(resolveApproval.mock.calls[0]?.[1]).toBe('engineer');
  });

  it('maps an unknown approval id to 404', async () => {
    const { controller } = makeController({ status: 'not_found' });
    await expect(controller.resolveApproval('missing', okBody, 'architect')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('AgUiController.sessionEvents', () => {
  function progressEvent(runId: string, seq: number): AgUiEvent {
    return { type: 'PROGRESS', runId, seq, timestamp: '2026-06-28T00:00:00.000Z', message: 'hi' };
  }

  it('replays a run’s persisted events in order', async () => {
    const { controller, events } = makeController({ status: 'ok' });
    await events.append('run-1', progressEvent('run-1', 0));
    await events.append('run-1', progressEvent('run-1', 1));
    await events.append('run-2', progressEvent('run-2', 0));

    const replay = await controller.sessionEvents('run-1');
    expect(replay.map((e) => e.seq)).toEqual([0, 1]);
  });

  it('returns 404 for a session with no persisted events', async () => {
    const { controller } = makeController({ status: 'ok' });
    await expect(controller.sessionEvents('unknown')).rejects.toBeInstanceOf(NotFoundException);
  });
});
