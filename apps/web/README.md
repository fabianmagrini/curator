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

See [`/AGENTS.md`](../../AGENTS.md) and `docs/spec.md §9`.
