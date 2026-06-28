import {
  BadRequestException,
  Body,
  Controller,
  Get,
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

  /** Resolve a pending human approval. `POST /agui/approvals/:id` */
  @Post('approvals/:id')
  resolveApproval(@Param('id') id: string, @Body() body: ResolveApprovalBody): { ok: true } {
    const decision = body?.decision;
    if (!decision || !DECISIONS.includes(decision as ApprovalDecision)) {
      throw new BadRequestException(`decision must be one of: ${DECISIONS.join(', ')}`);
    }

    const resolved = this.aguiService.resolveApproval(id, {
      approvalId: id,
      decision: decision as ApprovalDecision,
      rationale: body.rationale,
      dissent: body.dissent,
    });
    if (!resolved) {
      throw new NotFoundException('no pending approval with that id');
    }
    return { ok: true };
  }

  /** The immutable audit trail of approval decisions. `GET /agui/audit` */
  @Get('audit')
  auditTrail(): readonly AuditEntry[] {
    return this.audit.all();
  }
}
