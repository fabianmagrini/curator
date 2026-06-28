import type { Pool } from 'pg';
import type { AgUiEvent } from '@curator/agents';
import { EventStore } from './event-store.js';

/** Postgres-backed event store. Schema is created lazily and idempotently. */
export class PostgresEventStore extends EventStore {
  private ready: Promise<void> | null = null;

  constructor(private readonly pool: Pool) {
    super();
  }

  private ensureSchema(): Promise<void> {
    this.ready ??= this.pool
      .query(
        `CREATE TABLE IF NOT EXISTS agui_events (
           id BIGSERIAL PRIMARY KEY,
           session_id TEXT NOT NULL,
           seq INTEGER NOT NULL,
           event JSONB NOT NULL,
           created_at TIMESTAMPTZ NOT NULL DEFAULT now()
         )`,
      )
      .then(() => undefined);
    return this.ready;
  }

  async append(sessionId: string, event: AgUiEvent): Promise<void> {
    await this.ensureSchema();
    await this.pool.query('INSERT INTO agui_events (session_id, seq, event) VALUES ($1, $2, $3)', [
      sessionId,
      event.seq,
      event,
    ]);
  }

  async bySession(sessionId: string): Promise<AgUiEvent[]> {
    await this.ensureSchema();
    const result = await this.pool.query<{ event: AgUiEvent }>(
      'SELECT event FROM agui_events WHERE session_id = $1 ORDER BY seq',
      [sessionId],
    );
    return result.rows.map((row) => row.event);
  }
}
