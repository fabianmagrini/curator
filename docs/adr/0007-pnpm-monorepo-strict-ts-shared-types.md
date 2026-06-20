# 0007. pnpm workspace monorepo, strict TS, shared types package

- Date: 2026-06-20
- Status: Accepted

## Context

The system spans four tightly-coupled units — web, gateway, agent runtime, and shared types
— that evolve together, most importantly the AG-UI contract that crosses the UI ↔ agent
boundary ([ADR-0002](0002-ag-ui-as-sole-ui-agent-contract.md)). Splitting these into
separate repos would make atomic, contract-changing edits painful and invite type drift.

## Decision

We will use a single **pnpm workspace monorepo** (`apps/*`, `packages/*`) with:

- **TypeScript everywhere in `strict` mode**, all packages extending one
  `tsconfig.base.json`.
- **`packages/shared`** as the single owner of the radar domain model and AG-UI/generative-UI
  types; nothing downstream redefines them. It has no runtime dependencies.
- **Vitest** for tests (colocated `*.test.ts`), **ESLint (flat config) + Prettier** for
  quality, and **CI** that runs build → typecheck → lint → test.
- A dependency boundary: `apps/web` may depend on `packages/shared` only, never on the
  gateway or agents source; cross-layer communication is via AG-UI.

Alternatives rejected: multi-repo (hard to change the shared contract atomically); Nx/Turbo
build orchestration (unnecessary for four packages today — pnpm's topological `-r` suffices).

## Consequences

- Contract changes are atomic across producer and consumer in one commit/PR.
- `@curator/shared` is consumed from its built `dist` for typecheck/build and aliased to
  source for Vitest and Vite dev, so `pnpm build` (or building shared) precedes typechecking
  consumers.
- If build orchestration becomes a bottleneck, adding Turbo/Nx later is a contained change
  that would supersede this ADR.
