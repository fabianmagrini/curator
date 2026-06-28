import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
  Sse,
  type MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { ApprovalDecision } from '@curator/agents';
import { AgUiService } from './agui.service.js';
import { ApprovalPolicy } from './approval-policy.js';
import { AuditStore, type AuditEntry } from '../store/audit-store.js';

const DECISIONS: readonly ApprovalDecision[] = ['approve', 'modify', 'reject'];

interface ResolveApprovalBody {
  decision?: string;
  rationale?: string;
  dissent?: string;
}

@Controller('agui')
export class AgUiController {
  constructor(
    private readonly aguiService: AgUiService,
    private readonly policy: ApprovalPolicy,
    private readonly audit: AuditStore,
  ) {}

  /**
   * SSE endpoint streaming AG-UI events for one run. The stream stays open at the
   * approval gate and only finishes once the approval is resolved.
   * `GET /agui/stream?prompt=…&technologyId=grpc`
   */
  @Sse('stream')
  stream(
    @Query('prompt') prompt?: string,
    @Query('technologyId') technologyId?: string,
  ): Observable<MessageEvent> {
    return this.aguiService.streamRun(prompt ?? 'Evaluate the radar', technologyId);
  }

  /**
   * Resolve a pending human approval. `POST /agui/approvals/:id`
   * The approver's role travels in the `x-approver-role` header; authorization is
   * enforced here, server-side (spec §12, ADR-0014). Unknown/absent roles are
   * treated as read-only and rejected with 403.
   */
  @Post('approvals/:id')
  async resolveApproval(
    @Param('id') id: string,
    @Body() body: ResolveApprovalBody,
    @Headers('x-approver-role') approverRole?: string,
  ): Promise<{ ok: true }> {
    const decision = body?.decision;
    if (!decision || !DECISIONS.includes(decision as ApprovalDecision)) {
      throw new BadRequestException(`decision must be one of: ${DECISIONS.join(', ')}`);
    }

    const role = this.policy.roleFromHeader(approverRole);
    const outcome = await this.aguiService.resolveApproval(id, role, {
      approvalId: id,
      decision: decision as ApprovalDecision,
      rationale: body.rationale,
      dissent: body.dissent,
    });

    if (outcome.status === 'not_found') {
      throw new NotFoundException('no pending approval with that id');
    }
    if (outcome.status === 'forbidden') {
      throw new ForbiddenException(outcome.reason);
    }
    return { ok: true };
  }

  /** The immutable audit trail of approval decisions. `GET /agui/audit` */
  @Get('audit')
  auditTrail(): Promise<readonly AuditEntry[]> {
    return this.audit.all();
  }
}
