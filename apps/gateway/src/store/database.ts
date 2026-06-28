import { Pool } from 'pg';

/** DI token for the pg connection pool (or `null` when no database is configured). */
export const PG_POOL = 'PG_POOL';

/**
 * Create a pg Pool from `DATABASE_URL`, or return `null` when it is unset — in
 * which case the gateway falls back to the in-memory stores (ADR-0012, ADR-0013).
 */
export function createPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  return url ? new Pool({ connectionString: url }) : null;
}
