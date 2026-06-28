# Backlog — Tech Radar Curator

Agent-sized tasks, ordered by phase. Each task is scoped to be completable in one focused
session and references the authoritative section of [`spec.md`](spec.md). Check a box when
done and link the PR/commit.

Conventions: `[area]` tags map to packages — `web` = `apps/web`, `gw` = `apps/gateway`,
`agents` = `packages/agents`, `shared` = `packages/shared`, `repo` = workspace-wide.

---

## Phase 0 — Foundation (enable the monorepo)

- [x] `[repo]` Initialize pnpm workspace (`pnpm-workspace.yaml`, root `package.json`).
- [x] `[repo]` Add `tsconfig.base.json` (strict) and per-package `tsconfig.json` extends.
- [x] `[repo]` Add ESLint + Prettier + EditorConfig; wire `lint`/`format` scripts.
- [x] `[repo]` Add Vitest at the root with per-package config.
- [x] `[repo]` Add CI workflow (typecheck + lint + test) — `.github/workflows/ci.yml`.
- [x] `[shared]` Scaffold `packages/shared` with domain types: `RadarRing`, `Technology`,
      `TechnologySignal` (spec §7) and the AG-UI event union (spec §9.4).
- [x] `[web]` Scaffold Vite + React + TS + Tailwind app shell (shadcn-ready: `cn` util,
      `@/*` alias). _shadcn/ui component install deferred to Phase 1._
- [x] `[gw]` Scaffold NestJS app with a health route and SSE endpoint stub.
- [x] `[agents]` Scaffold a no-op planner agent emitting the AG-UI stream.
      _Superseded in Phase 1 by the deterministic evaluation pipeline._
- [x] `[repo]` End-to-end smoke: web connects to gateway, gateway streams AG-UI events.

## Phase 1 — Internal radar + read-only generative UI (spec §14 Phase 1)

> **Thin vertical slice landed** (gRPC end-to-end, deterministic/seeded): agents pipeline →
> gateway stream → web generative UI. Remaining Phase 1 work is deepening each layer.

- [x] `[shared]` Finalize AG-UI event contracts: `TOOL_CALL_START`, `PROGRESS`,
      `STATE_UPDATE`, `GENERATIVE_UI`, `APPROVAL_REQUIRED`, `FINAL_RESPONSE`.
- [x] `[agents]` Implement Signal Ingestion Agent (manual/seeded sources) → `TechnologySignal` (spec §6.1).
- [x] `[agents]` Implement Value / Risk / Cost / Operability / Strategic Fit agents (spec §6.2–6.6),
      each emitting a `DimensionEvidencePanel` payload. _Deterministic/seeded; LLM reasoning later (ADR-0006)._
- [x] `[agents]` Implement Consensus & Scoring Agent producing the proposal JSON (spec §6.7).
- [x] `[gw]` AG-UI gateway: session management, event routing, event persistence (Postgres),
      audit logging (spec §5, §11). _Sessions + event/audit persistence behind interfaces;
      in-memory by default, **Postgres when `DATABASE_URL` is set** (ADR-0012, ADR-0013)._
- [ ] `[web]` Integrate CopilotKit: `CopilotSidebar`, `useCopilotReadable` for radar/selection
      state, `useCopilotAction` for UI navigation (spec §9.2). _Deferred (LLM-gated); for now a
      direct AG-UI SSE client + a technology picker / clickable-radar selection._
- [x] `[web]` Generative UI components: `RadarVisualization`, `RingChangeProposalCard`,
      `DimensionEvidencePanel`, `SignalTimeline`, `AgentDebateView` (spec §9.3).
- [x] `[web]` Render the radar read-only (Adopt/Trial/Assess/Hold × quadrants).

## Phase 2 — Automated ingestion + HITL approvals (spec §14 Phase 2)

- [ ] `[agents]` MCP integrations: GitHub (manifests), Jira, metrics, RFC/ADR store (spec §5, §6.1).
- [ ] `[gw]` MCP gateway: tool registry, policy enforcement, secret management (spec §5).
- [x] `[gw]` Approval brokering: `APPROVAL_REQUIRED` lifecycle; agent blocks until resolved (spec §10).
      _Agent blocks via an injected await hook; `POST /agui/approvals/:id` resolves it (ADR-0011)._
- [x] `[gw]` Server-side approval policy: who may approve which rings/quadrants (spec §10, §12).
      _Role gate enforced at the gateway: `ApproverRole` via `x-approver-role` header, architects
      approve any ring change, engineers denied (403); approver role recorded in the audit (ADR-0014)._
- [x] `[web]` HITL approval card via `renderAndWaitForResponse`: editable rationale,
      dissent capture, Approve/Modify/Reject (spec §10). _Custom `ApprovalCard` posting to the
      gateway (not CopilotKit's primitive yet)._
- [x] `[gw]` Immutable audit trail of approvals/edits/rejections (spec §11, §12). _In-memory (ADR-0012)._
- [ ] `[repo]` Scheduled scan job (weekly/monthly) driving the pipeline (spec §8).

## Phase 3 — Cross-org benchmarking + A2A (spec §14 Phase 3)

- [ ] `[agents]` Introduce A2A for specialist governance agents behind the gateway (spec §15).
- [ ] `[agents]` Cross-org benchmarking signals and comparison views.
- [ ] `[web]` Comparative generative UI (technology vs. alternatives).

## Phase 4 — Predictive + drift (spec §14 Phase 4)

- [ ] `[agents]` Predictive recommendations.
- [ ] `[agents]/[gw]` Drift detection (decision volatility) → `DriftAlert` generative UI (spec §9.3, §11).
- [ ] `[repo]` OpenTelemetry tracing spanning UI → gateway → agents → MCP (spec §11).

---

### Cross-cutting (any phase)

- [ ] `[gw]` AuthN/AuthZ and rate limiting at the gateway (spec §5, §12).
- [ ] `[repo]` Redis for session/event buffering (spec, AG-UI reference).
- [ ] Maintain AG-UI contracts in `packages/shared` whenever producer/consumer change.
