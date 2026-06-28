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

**Status:** Phase 0 (foundation) is complete, and a Phase 1 **thin vertical slice** has
landed: a deterministic, seeded evaluation runs end-to-end for one technology (gRPC) — agents
pipeline → gateway SSE → web generative UI (radar + dimension panels + ring-change proposal +
HITL banner). Remaining Phase 1 work deepens each layer; see `docs/backlog.md`. Deferred:
CopilotKit hosting, gateway persistence (Postgres) + blocking approval brokering, and the
`SignalTimeline` / `AgentDebateView` components.

## Architecture (layered, event-driven)

```
CopilotKit web app  ──AG-UI (SSE/WS)──►  AG-UI Gateway  ──►  VoltAgent runtime  ──MCP──►  Enterprise systems
   (apps/web)                              (apps/gateway)      (packages/agents)            GitHub · Jira · metrics
```

| Layer         | Package           | Responsibility                                                                               | Stack                                                                                 |
| ------------- | ----------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Generative UX | `apps/web`        | Chat, generative UI, shared state, HITL prompts                                              | React, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, Zustand, **CopilotKit** |
| Control plane | `apps/gateway`    | AuthN/AuthZ, sessions, event routing & persistence, audit, rate limiting, approval brokering | Node.js, **NestJS**, AG-UI server, SSE (WS optional)                                  |
| Agent runtime | `packages/agents` | Multi-agent evaluation, debate, consensus, scoring, workflows                                | **VoltAgent** (TypeScript), VoltOps for tracing                                       |
| Shared        | `packages/shared` | Cross-cutting TS types, AG-UI event contracts, radar domain model                            | TypeScript only, no runtime deps                                                      |

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
├── package.json             # workspace root: build/typecheck/lint/test/dev scripts
├── pnpm-workspace.yaml      # workspace globs (apps/*, packages/*)
├── tsconfig.base.json       # shared strict TS config; each package extends it
├── eslint.config.js         # flat ESLint config (typescript-eslint + prettier)
├── vitest.config.ts         # root Vitest config
├── .github/workflows/ci.yml # CI: build → typecheck → lint → format → test
├── docs/
│   ├── spec.md              # full product/technical spec (source of truth)
│   ├── ag-ui-reference-architecture.md
│   ├── copilotkit.md
│   ├── backlog.md           # phased, agent-sized task breakdown
│   └── adr/                 # architecture decision records (why the architecture is so)
├── apps/
│   ├── web/                 # CopilotKit generative UI (Vite + React + Tailwind)
│   └── gateway/             # NestJS AG-UI gateway (/health, SSE /agui/stream)
└── packages/
    ├── agents/              # multi-agent runtime (deterministic pipeline; VoltAgent later)
    └── shared/              # shared TS types / AG-UI contracts
```

Each `apps/*` and `packages/*` directory has a `README.md` describing its scope and
boundaries — read it before adding code there.

## Conventions

- **Language:** TypeScript everywhere; `strict` mode on. No `any` without justification.
- **Package manager / workspace:** **pnpm workspace** monorepo (pnpm 10+, Node 20+). Every
  package extends the single root `tsconfig.base.json`.
- **Domain types are shared.** Radar rings, `Technology`, `TechnologySignal`, and AG-UI
  event types live in `packages/shared` and are imported, never redefined.
- **Naming:** PascalCase for React components and types, camelCase for functions/vars,
  kebab-case for file names except React components (PascalCase `.tsx`).
- **Boundaries:** `apps/web` may depend on `packages/shared` only — never on
  `packages/agents` or `apps/gateway` source. Cross-layer communication is via AG-UI.
- **Tests:** see [Testing & Documentation Standards](#testing--documentation-standards).
- **Commits:** small, scoped, conventional-style (`feat:`, `fix:`, `docs:`, `chore:`).
- **Branching model — commit straight to `main`.** While this is a solo repo we
  do **not** use feature branches or PRs: run `pnpm verify` locally, then commit and push to
  `main`. CI re-runs the same checks on push. Keep `main` green; if a bad commit lands, fix
  it with a follow-up commit (revert-forward) rather than rewriting pushed history. Switch to
  PR-based review with branch protection when a second contributor (human or autonomous
  agent landing unreviewed changes) joins.

### Scripts (run from the repo root)

| Command                             | What                                                          |
| ----------------------------------- | ------------------------------------------------------------- |
| `pnpm install`                      | Install workspace dependencies                                |
| `pnpm build`                        | Build all packages in topological order                       |
| `pnpm typecheck`                    | `tsc --noEmit` across every package                           |
| `pnpm lint` / `pnpm format`         | ESLint / Prettier                                             |
| `pnpm test`                         | Run Vitest once (`pnpm test:watch` to watch)                  |
| `pnpm verify`                       | build + typecheck + lint + format:check + test (what CI runs) |
| `pnpm dev:gateway` / `pnpm dev:web` | Run the gateway / web app in watch mode                       |

> The shared package is consumed from its built `dist` for typecheck/build, and aliased to
> source for Vitest and Vite dev — so run `pnpm build` (or at least build `@curator/shared`)
> before typechecking the consumers.

## Working agreements for agents

- **Before coding a feature**, check `docs/backlog.md` for the relevant task and
  `docs/spec.md` for the authoritative behavior. If they conflict, the spec wins —
  flag the discrepancy.
- **Don't invent the control plane in the browser.** If a task seems to require auth,
  audit, or radar writes in `apps/web`, that's a signal it belongs in `apps/gateway`.
- **Keep AG-UI event types in `packages/shared`** and update both producer (agents) and
  consumer (web) together.
- **Consult the ADRs before changing cross-cutting structure.** The decisions in
  [`docs/adr/`](docs/adr/) (e.g. AG-UI as the sole UI↔agent contract, control plane in the
  gateway, mandatory HITL approval) are binding. To change one, write a new ADR that
  supersedes it — don't quietly contradict it.
- **Run `pnpm verify` before you commit.** It mirrors CI; keep `main` green.
- When you add scripts/tooling, document them in the relevant package `README.md` and
  update this file's conventions if they change.

### Architecture Decision Records

Write an ADR in `docs/adr/` whenever a decision meets any of these criteria:

- A library or framework was chosen over meaningful alternatives
- An architectural pattern was adopted that constrains how future code must be written
- A workaround was introduced for a third-party limitation (the _why_ would otherwise only
  live in a commit message)
- A previously accepted decision is being reversed or superseded

**Process:**

1. Copy `docs/adr/0000-adr-template.md` to `docs/adr/NNNN-short-title.md` (next number).
2. Fill in Context (what problem led here), Decision (what was chosen and why), and
   Consequences (trade-offs accepted).
3. Add a row to the index table in `docs/adr/README.md`.
4. If the ADR supersedes an existing one, update the old ADR's status line.

An ADR does not need to be long. Two or three sentences per section is enough if the
reasoning is clear. The goal is to make the _why_ recoverable without reading git history.

## Testing & Documentation Standards

### Testing

- **Runner:** Vitest. Colocate tests as `*.test.ts(x)` beside the code they cover; the root
  config picks up `packages/*/src/**` and `apps/*/src/**`.
- **Test behavior and contracts, not framework glue.** Prioritize domain logic (scoring,
  consensus, signal normalization), the AG-UI event contract (discriminated-union narrowing,
  event ordering, JSON-serializability), and agent output shape. Don't write tests that only
  exercise NestJS DI or React render plumbing.
- **Change the contract, change its tests in the same commit.** When you touch the AG-UI
  events or domain model in `packages/shared`, extend the usage/type tests there alongside.
- **Web component tests run under jsdom** via `apps/web/vitest.config.ts` (React Testing
  Library + `@testing-library/jest-dom`); `packages/*` and the gateway run under `node`. The
  root `vitest.config.ts` wires these as Vitest projects, so `pnpm test` covers all of them.
- **`pnpm verify` must pass before every commit** (build + typecheck + lint + format:check +
  test); it mirrors CI.

### Documentation

- **Exported types and public functions carry brief TSDoc.** In `packages/shared`, cite the
  authoritative spec section (e.g. `spec §9.4`) so the contract stays traceable.
- **Keep docs in sync with code in the same change:** the relevant package `README.md`
  (scope/scripts/status), `AGENTS.md` (conventions/status), and `docs/backlog.md` (check off
  completed tasks).
- **`docs/spec.md` is the source of truth for behavior; ADRs for decisions.** If code and the
  spec diverge, the spec wins — fix the code or update the spec and flag it.
- **Prefer updating existing docs over adding new ones.** Keep prose short and link rather
  than duplicate.

## Glossary

- **AG-UI** — Agent ↔ Human protocol (typed streaming events: messages, tool calls, state
  updates, approvals, lifecycle).
- **MCP** — Agent ↔ Tools protocol (governed access to GitHub/Jira/metrics).
- **A2A** — Agent ↔ Agent protocol (future; specialist agents behind the gateway).
- **Ring** — Adopt / Trial / Assess / Hold.
- **HITL** — Human-in-the-loop; mandatory approval for ring changes.
