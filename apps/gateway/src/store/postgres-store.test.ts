import { afterAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import type { AgUiEvent } from '@curator/agents';
import { PostgresEventStore } from './postgres-event-store.js';
import { PostgresAuditStore } from './postgres-audit-store.js';

const url = process.env.DATABASE_URL;

// Runs only when a database is configured (CI provides one); skipped locally.
describe.skipIf(!url)('Postgres stores', () => {
  const pool = new Pool({ connectionString: url });

  afterAll(async () => {
    await pool.end();
  });

  it('persists and reads back events for a session', async () => {
    const store = new PostgresEventStore(pool);
    const sessionId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const event: AgUiEvent = {
      type: 'PROGRESS',
      runId: 'r1',
      seq: 0,
      timestamp: new Date().toISOString(),
      message: 'hello',
    };

    await store.append(sessionId, event);
    const back = await store.bySession(sessionId);

    expect(back).toHaveLength(1);
    expect(back[0]).toMatchObject({ type: 'PROGRESS', message: 'hello' });
  });

  it('records and returns audit entries', async () => {
    const store = new PostgresAuditStore(pool);
    const approvalId = `aud-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await store.record({
      timestamp: new Date().toISOString(),
      approvalId,
      technologyId: 'grpc',
      fromRing: 'Assess',
      toRing: 'Trial',
      decision: 'approve',
      approverRole: 'architect',
      rationale: 'looks good',
    });

    const entry = (await store.all()).find((e) => e.approvalId === approvalId);
    expect(entry?.decision).toBe('approve');
    expect(entry?.approverRole).toBe('architect');
    expect(entry?.rationale).toBe('looks good');
  });
});
