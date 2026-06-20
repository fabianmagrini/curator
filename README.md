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
| `docs/` | Spec, architecture references, backlog |

## For AI coding agents

Start with **[`AGENTS.md`](AGENTS.md)** (canonical context), then the task
**[backlog](docs/backlog.md)** and the full **[spec](docs/spec.md)**.

> Status: greenfield. Docs and skeleton are in place; the monorepo tooling and packages are
> scaffolded in **Phase 0** of the backlog.
