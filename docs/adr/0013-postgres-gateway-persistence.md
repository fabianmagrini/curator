# 0013. Postgres-backed gateway persistence (opt-in via DATABASE_URL)

- Date: 2026-06-28
- Status: Accepted

## Context

[ADR-0012](0012-in-memory-persistence-postgres-deferred.md) put gateway persistence behind
the abstract `EventStore` / `AuditStore` interfaces with in-memory implementations, and
anticipated a future ADR adding a durable backend. In-memory state is lost on restart and not
shared across instances, which blocks any real deployment. The data is simple and
append-oriented (per-session AG-UI events, approval audit entries).

## Decision

Add Postgres-backed implementations using **`pg` (node-postgres) with hand-written SQL** — no
ORM. Schema is created lazily and idempotently (`CREATE TABLE IF NOT EXISTS`) on first use.
The implementation is selected at runtime: when `DATABASE_URL` is set the gateway uses
Postgres, otherwise it falls back to the in-memory stores (chosen via a Nest `useFactory`
provider keyed off the `pg` pool). CI runs a Postgres service and sets `DATABASE_URL` so the
Postgres path is exercised; the integration tests `skipIf` no database, so local `pnpm test`
stays green with no DB.

Alternatives rejected: an ORM (Prisma/TypeORM/Drizzle) — heavier and inconsistent with the
project's minimalism for two append-only tables; making Postgres mandatory — would force a DB
on every dev/test run.

## Consequences

- Durability and multi-instance sharing are available without code changes — just set
  `DATABASE_URL`. In-memory remains the zero-config default (ADR-0012 stands).
- No migration framework yet: schema evolution beyond idempotent `CREATE TABLE` will need a
  real migration tool (future ADR).
- CI gains a Postgres service (slightly slower runs) in exchange for real coverage of the
  persistence path. `docker-compose.yml` provides the same DB locally.
