import { Injectable } from '@nestjs/common';
import type { ApprovalDecision, RadarRing } from '@curator/agents';

/** An immutable record of a human approval decision (spec §11, §12). */
export interface AuditEntry {
  timestamp: string;
  approvalId: string;
  technologyId: string;
  fromRing: RadarRing;
  toRing: RadarRing;
  decision: ApprovalDecision;
  rationale?: string;
  dissent?: string;
}

/**
 * Append-only audit trail of approval decisions. Abstract so the in-memory
 * implementation can be swapped for a durable store later (ADR-0012).
 */
export abstract class AuditStore {
  abstract record(entry: AuditEntry): void;
  abstract all(): readonly AuditEntry[];
}

@Injectable()
export class InMemoryAuditStore extends AuditStore {
  private readonly entries: AuditEntry[] = [];

  record(entry: AuditEntry): void {
    this.entries.push(entry);
  }

  all(): readonly AuditEntry[] {
    return this.entries;
  }
}
