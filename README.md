# Tech Radar Curator

An AI, agent-driven system that curates and explains technology-adoption decisions
(Adopt / Trial / Assess / Hold). A multi-agent backend evaluates technologies across Value,
Risk, Cost, Operability, and Strategic Fit, reaches consensus, and proposes radar changes
for **human approval** — with the agents' reasoning rendered as **generative UI**.

## Architecture

```
CopilotKit web app ──AG-UI──► AG-UI Gateway ──► VoltAgent runtime ──MCP──► GitHub · Jira · metrics
   apps/web                     apps/gateway      packages/agents
```

- **AG-UI** = Agent ↔ Human · **MCP** = Agent ↔ Tools · **A2A** = Agent ↔ Agent (future)
- CopilotKit is the **UX layer**; enterprise control (auth, audit, approvals, secrets)
  lives in the **gateway**.

## Repo layout

| Path | What |
| ---- | ---- |
| `apps/web` | CopilotKit generative UI |
| `apps/gateway` | NestJS AG-UI gateway (control plane) |
| `packages/agents` | VoltAgent multi-agent runtime |
| `packages/shared` | Shared TS types & AG-UI contracts |
| `docs/` | Spec, architecture references, backlog, [ADRs](docs/adr/) |

## Getting started

```bash
pnpm install      # install workspace deps (pnpm 10+, Node 20+)
pnpm build        # build shared → agents → gateway → web (topological)
pnpm verify       # build + typecheck + lint + test

pnpm dev:gateway  # NestJS AG-UI gateway on http://localhost:4000
pnpm dev:web      # CopilotKit web app on http://localhost:5173
```

Smoke check (with the gateway running):

```bash
curl http://localhost:4000/health
curl -N "http://localhost:4000/agui/stream?prompt=Should%20we%20move%20gRPC%20to%20Trial%3F"
```

## For AI coding agents

Start with **[`AGENTS.md`](AGENTS.md)** (canonical context), then the task
**[backlog](docs/backlog.md)** and the full **[spec](docs/spec.md)**. The
**[ADRs](docs/adr/)** record why the architecture is the way it is — consult them before
changing cross-cutting structure.

> Status: **Phase 0 complete** — pnpm workspace, strict TS, ESLint/Prettier, Vitest, CI, the
> four scaffolded packages, and an end-to-end AG-UI SSE smoke are in place. Phase 1 is next.
