# packages/shared — Shared Types & AG-UI Contracts

Cross-cutting TypeScript with **no runtime dependencies**. The single source of truth for
types crossing the UI ↔ agent boundary.

**Owns**

- Domain model (spec §7): `RadarRing`, `Technology`, `TechnologySignal`.
- AG-UI event contracts (spec §9.4): the typed event union — `TOOL_CALL_START`,
  `PROGRESS`, `STATE_UPDATE`, `GENERATIVE_UI`, `APPROVAL_REQUIRED`, `FINAL_RESPONSE` — and
  the payloads of generative-UI components (spec §9.3).

**Rule:** When an AG-UI event or domain type changes, update it here and adjust both the
producer (`packages/agents`) and consumer (`apps/web`) in the same change. Nothing
downstream redefines these types.

## Status

Implemented: domain model (`domain.ts`), AG-UI event union (`agui.ts`), generative-UI
payloads (`generative-ui.ts`), re-exported from `src/index.ts`. No runtime dependencies.
Build to `dist` with `pnpm --filter @curator/shared build`.

See [`/AGENTS.md`](../../AGENTS.md) and `docs/spec.md §7, §9`.
