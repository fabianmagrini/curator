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

| Path              | What                                                      |
| ----------------- | --------------------------------------------------------- |
| `apps/web`        | CopilotKit generative UI                                  |
| `apps/gateway`    | NestJS AG-UI gateway (control plane)                      |
| `packages/agents` | VoltAgent multi-agent runtime                             |
| `packages/shared` | Shared TS types & AG-UI contracts                         |
| `docs/`           | Spec, architecture references, backlog, [ADRs](docs/adr/) |

## Getting started

```bash
pnpm install      # install workspace deps (pnpm 10+, Node 20+)
pnpm build        # build shared → agents → gateway → web (topological)
pnpm verify       # build + typecheck + lint + test

pnpm dev          # build libs, then run gateway (:4000) + web (:5173) together
# or run them separately:
pnpm dev:gateway  # NestJS AG-UI gateway on http://localhost:4000
pnpm dev:web      # CopilotKit web app on http://localhost:5173
```

Then open http://localhost:5173 and click **Evaluate gRPC**.

Smoke check (with the gateway running):

```bash
curl http://localhost:4000/health
curl -N "http://localhost:4000/agui/stream?prompt=Should%20we%20move%20gRPC%20to%20Trial%3F"
curl http://localhost:4000/agui/audit                 # decision trail
curl -i -X POST http://localhost:4000/copilotkit      # 503 unless GOOGLE_API_KEY is set
```

**Optional — CopilotKit sidebar (Gemini):** set `GOOGLE_API_KEY` (and optionally `GEMINI_MODEL`)
on the gateway and `VITE_COPILOT_RUNTIME_URL=http://localhost:4000/copilotkit` on the web app to
enable the opt-in chat sidebar; without them the app runs its default direct-SSE experience. See
[`.env.example`](.env.example).

## For AI coding agents

Start with **[`AGENTS.md`](AGENTS.md)** (canonical context), then the task
**[backlog](docs/backlog.md)** and the full **[spec](docs/spec.md)**. The
**[ADRs](docs/adr/)** record why the architecture is the way it is — consult them before
changing cross-cutting structure.

> Status: **Phase 0 & Phase 1 complete** — a deterministic, seeded evaluation runs end-to-end
> (agents → gateway → web generative UI) with HITL approval, gateway persistence, and an opt-in
> CopilotKit sidebar (Gemini-backed, `GOOGLE_API_KEY`). Phase 2+ work is tracked in the backlog.
