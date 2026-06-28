# 0012. In-memory gateway persistence behind interfaces; Postgres deferred

- Date: 2026-06-28
- Status: Accepted

## Context

The backlog calls for gateway event persistence (Postgres) and an audit trail (spec §5, §11).
Standing up Postgres now adds real infrastructure — a running database, migrations, a CI
service container, and connection secrets — which is at odds with the project's current
lightweight, fully-offline-testable posture (deterministic agents, no secrets). The data the
gateway must persist (per-session AG-UI events, approval audit entries) is simple and
append-oriented.

## Decision

Implement persistence as abstract interfaces — `EventStore` and `AuditStore` — with in-memory
implementations wired through Nest DI (`{ provide: EventStore, useClass: InMemoryEventStore }`).
Callers depend only on the abstract token, so a Postgres-backed implementation is a drop-in
provider swap later.

## Consequences

- The gateway runs in CI and locally with no database; tests stay fast and hermetic.
- State is **not durable** across restarts and **not shared** across instances — acceptable
  while single-instance and pre-production, but a blocker for real deployment.
- The abstract stores are the seam for a future "use Postgres" ADR that supersedes this one;
  swapping requires no controller/service changes.
