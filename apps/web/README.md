# apps/web — Generative UI (CopilotKit)

The reviewer-facing app. Renders the Tech Radar and the agents' reasoning as **generative
UI** streamed over AG-UI.

**Stack:** React · TypeScript · Vite · Tailwind · shadcn/ui · TanStack Query · Zustand · CopilotKit

**Owns**

- CopilotKit integration: `CopilotSidebar`, `useCopilotReadable` (radar/selection state),
  `useCopilotAction` (UI navigation), generative UI `render`, HITL approval cards.
- Domain generative-UI components (spec §9.3): `RadarVisualization`,
  `RingChangeProposalCard`, `DimensionEvidencePanel`, `AgentDebateView`, `SignalTimeline`,
  `DriftAlert`.

**Boundaries**

- May depend on `packages/shared` only. Never imports `apps/gateway` or `packages/agents`.
- **UX layer only** — no auth, audit, approval policy, tool credentials, or radar writes.
  Those live behind the AG-UI gateway. The browser never writes published radar state.
- Talks to the backend exclusively via the **AG-UI protocol** (SSE; WS optional).

## Status

Phase 1: a read-only radar (`components/RadarVisualization.tsx`, rings × quadrants) with a
technology picker and clickable-radar selection, alongside live agent reasoning streamed as
generative UI. The `GenerativeUi` dispatcher renders all five components —
`SignalTimeline`, `DimensionEvidencePanel`, `AgentDebateView`, `RingChangeProposalCard`
(`DriftAlert` is defined but not yet emitted) — with a HITL approval banner. Uses the direct
AG-UI SSE client (`src/lib/agui-client.ts`); **CopilotKit** hosting is deferred (LLM-gated).
shadcn-ready (`cn`, `@/*` alias). Run with `pnpm dev:web` (port 5173; set `VITE_GATEWAY_URL`).

See [`/AGENTS.md`](../../AGENTS.md) and `docs/spec.md §9`.
