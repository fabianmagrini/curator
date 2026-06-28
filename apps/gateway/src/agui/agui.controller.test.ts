import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ApproverRole } from '@curator/agents';
import { AgUiController } from './agui.controller.js';
import { ApprovalPolicy } from './approval-policy.js';
import type { AgUiService, ResolveOutcome } from './agui.service.js';
import type { AuditStore } from '../store/audit-store.js';

/**
 * Build a controller with a real policy (the header→role coercion under test) and
 * a stub service that records the role it was handed and returns a programmed outcome.
 */
function makeController(outcome: ResolveOutcome) {
  const resolveApproval = vi.fn(async () => outcome);
  const service = { resolveApproval } as unknown as AgUiService;
  const audit = { all: vi.fn() } as unknown as AuditStore;
  const controller = new AgUiController(service, new ApprovalPolicy(), audit);
  return { controller, resolveApproval };
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
