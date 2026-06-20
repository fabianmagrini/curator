# AGENTS.md — Tech Radar Curator

> Canonical context for AI coding agents working in this repo. Read this first.
> Full product spec: [`docs/spec.md`](docs/spec.md). Architecture references:
> [`docs/ag-ui-reference-architecture.md`](docs/ag-ui-reference-architecture.md),
> [`docs/copilotkit.md`](docs/copilotkit.md). Task backlog: [`docs/backlog.md`](docs/backlog.md).

## What we're building

The **Tech Radar Curator** is an AI, agent-driven system that continuously curates and
explains technology-adoption decisions (Adopt / Trial / Assess / Hold). A multi-agent
backend evaluates technologies across Value, Risk, Cost, Operability, and Strategic Fit,
reaches consensus, and proposes radar changes for **human approval**. The UI renders the
agents' reasoning as **generative UI** rather than static tables.

This is currently a **greenfield repo**: the docs and skeleton exist; the code does not.
Your job as an agent is to fill in the packages following the architecture below.

## Architecture (layered, event-driven)

```
CopilotKit web app  ──AG-UI (SSE/WS)──►  AG-UI Gateway  ──►  VoltAgent runtime  ──MCP──►  Enterprise systems
   (apps/web)                              (apps/gateway)      (packages/agents)            GitHub · Jira · metrics
```

| Layer | Package | Responsibility | Stack |
| ----- | ------- | -------------- | ----- |
| Generative UX | `apps/web` | Chat, generative UI, shared state, HITL prompts | React, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, Zustand, **CopilotKit** |
| Control plane | `apps/gateway` | AuthN/AuthZ, sessions, event routing & persistence, audit, rate limiting, approval brokering | Node.js, **NestJS**, AG-UI server, SSE (WS optional) |
| Agent runtime | `packages/agents` | Multi-agent evaluation, debate, consensus, scoring, workflows | **VoltAgent** (TypeScript), VoltOps for tracing |
| Shared | `packages/shared` | Cross-cutting TS types, AG-UI event contracts, radar domain model | TypeScript only, no runtime deps |

### Non-negotiable design rules

1. **CopilotKit is the UX layer, not the control plane.** Authorization, audit, approval
   policy, and tool-credential management live behind the **AG-UI gateway**. The browser
   never writes published radar state and never holds tool credentials.
2. **The agent blocks on approval.** Every ring change emits an AG-UI `APPROVAL_REQUIRED`
   event and waits; agents cannot self-publish.
3. **Tool access goes through MCP**, with the gateway/MCP holding secrets.
4. **AG-UI is the only contract between UI and agents.** Keep it stable so the agent
   runtime (VoltAgent today) stays swappable. All shared event/payload types live in
   `packages/shared`.
5. **Generative UI components are agent-driven** — see the catalog in `docs/spec.md §9.3`
   (`RingChangeProposalCard`, `DimensionEvidencePanel`, `AgentDebateView`,
   `RadarVisualization`, `SignalTimeline`, `DriftAlert`).

## Repo layout

```
.
├── AGENTS.md                # this file — agent context (canonical)
├── docs/
│   ├── spec.md              # full product/technical spec (source of truth)
│   ├── ag-ui-reference-architecture.md
│   ├── copilotkit.md
│   └── backlog.md           # phased, agent-sized task breakdown
├── apps/
│   ├── web/                 # CopilotKit generative UI  (to scaffold)
│   └── gateway/             # NestJS AG-UI gateway       (to scaffold)
└── packages/
    ├── agents/              # VoltAgent multi-agent runtime (to scaffold)
    └── shared/              # shared TS types / AG-UI contracts (to scaffold)
```

Each `apps/*` and `packages/*` directory has a `README.md` describing its scope and
boundaries — read it before adding code there.

## Conventions

- **Language:** TypeScript everywhere; `strict` mode on. No `any` without justification.
- **Package manager / workspace:** intended to be a **pnpm workspace** monorepo (not yet
  initialized). When you scaffold tooling, prefer pnpm + a single `tsconfig.base.json`.
- **Domain types are shared.** Radar rings, `Technology`, `TechnologySignal`, and AG-UI
  event types live in `packages/shared` and are imported, never redefined.
- **Naming:** PascalCase for React components and types, camelCase for functions/vars,
  kebab-case for file names except React components (PascalCase `.tsx`).
- **Boundaries:** `apps/web` may depend on `packages/shared` only — never on
  `packages/agents` or `apps/gateway` source. Cross-layer communication is via AG-UI.
- **Tests:** colocate `*.test.ts(x)` next to source; Vitest is the intended runner.
- **Commits:** small, scoped, conventional-style (`feat:`, `fix:`, `docs:`, `chore:`).

## Working agreements for agents

- **Before coding a feature**, check `docs/backlog.md` for the relevant task and
  `docs/spec.md` for the authoritative behavior. If they conflict, the spec wins —
  flag the discrepancy.
- **Don't invent the control plane in the browser.** If a task seems to require auth,
  audit, or radar writes in `apps/web`, that's a signal it belongs in `apps/gateway`.
- **Keep AG-UI event types in `packages/shared`** and update both producer (agents) and
  consumer (web) together.
- **No build tooling exists yet.** The first scaffolding tasks (see backlog Phase 0)
  establish pnpm workspace, TS config, lint/format, and runnable stubs. Until then,
  there are no `build`/`test`/`dev` scripts to run.
- When you add scripts/tooling, document them in the relevant package `README.md` and
  update this file's conventions if they change.

## Glossary

- **AG-UI** — Agent ↔ Human protocol (typed streaming events: messages, tool calls, state
  updates, approvals, lifecycle).
- **MCP** — Agent ↔ Tools protocol (governed access to GitHub/Jira/metrics).
- **A2A** — Agent ↔ Agent protocol (future; specialist agents behind the gateway).
- **Ring** — Adopt / Trial / Assess / Hold.
- **HITL** — Human-in-the-loop; mandatory approval for ring changes.
