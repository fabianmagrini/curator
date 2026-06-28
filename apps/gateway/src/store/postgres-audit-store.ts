import type { Pool } from 'pg';
import { AuditStore, type AuditEntry } from './audit-store.js';

interface AuditRow {
  ts: string;
  approval_id: string;
  technology_id: string;
  from_ring: string;
  to_ring: string;
  decision: string;
  rationale: string | null;
  dissent: string | null;
}

/** Postgres-backed, append-only audit store. Schema is created lazily. */
export class PostgresAuditStore extends AuditStore {
  private ready: Promise<void> | null = null;

  constructor(private readonly pool: Pool) {
    super();
  }

  private ensureSchema(): Promise<void> {
    this.ready ??= this.pool
      .query(
        `CREATE TABLE IF NOT EXISTS agui_audit (
           id BIGSERIAL PRIMARY KEY,
           ts TEXT NOT NULL,
           approval_id TEXT NOT NULL,
           technology_id TEXT NOT NULL,
           from_ring TEXT NOT NULL,
           to_ring TEXT NOT NULL,
           decision TEXT NOT NULL,
           rationale TEXT,
           dissent TEXT
         )`,
      )
      .then(() => undefined);
    return this.ready;
  }

  async record(entry: AuditEntry): Promise<void> {
    await this.ensureSchema();
    await this.pool.query(
      `INSERT INTO agui_audit (ts, approval_id, technology_id, from_ring, to_ring, decision, rationale, dissent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.timestamp,
        entry.approvalId,
        entry.technologyId,
        entry.fromRing,
        entry.toRing,
        entry.decision,
        entry.rationale ?? null,
        entry.dissent ?? null,
      ],
    );
  }

  async all(): Promise<readonly AuditEntry[]> {
    await this.ensureSchema();
    const result = await this.pool.query<AuditRow>(
      `SELECT ts, approval_id, technology_id, from_ring, to_ring, decision, rationale, dissent
       FROM agui_audit ORDER BY id`,
    );
    return result.rows.map((row) => ({
      timestamp: row.ts,
      approvalId: row.approval_id,
      technologyId: row.technology_id,
      fromRing: row.from_ring as AuditEntry['fromRing'],
      toRing: row.to_ring as AuditEntry['toRing'],
      decision: row.decision as AuditEntry['decision'],
      rationale: row.rationale ?? undefined,
      dissent: row.dissent ?? undefined,
    }));
  }
}
