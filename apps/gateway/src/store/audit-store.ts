import { Injectable } from '@nestjs/common';
import type { ApprovalDecision, ApproverRole, RadarRing } from '@curator/agents';

/** An immutable record of a human approval decision (spec §11, §12). */
export interface AuditEntry {
  timestamp: string;
  approvalId: string;
  technologyId: string;
  fromRing: RadarRing;
  toRing: RadarRing;
  decision: ApprovalDecision;
  /** Role that authorized the decision — the governance "who" (spec §12, ADR-0014). */
  approverRole: ApproverRole;
  rationale?: string;
  dissent?: string;
}

/**
 * Append-only audit trail of approval decisions. Abstract + async so the
 * in-memory implementation can be swapped for Postgres (ADR-0012, ADR-0013).
 */
export abstract class AuditStore {
  abstract record(entry: AuditEntry): Promise<void>;
  abstract all(): Promise<readonly AuditEntry[]>;
}

@Injectable()
export class InMemoryAuditStore extends AuditStore {
  private readonly entries: AuditEntry[] = [];

  record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  all(): Promise<readonly AuditEntry[]> {
    return Promise.resolve(this.entries);
  }
}
