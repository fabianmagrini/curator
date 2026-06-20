# 0006. VoltAgent as the agent runtime

- Date: 2026-06-20
- Status: Accepted

## Context

The evaluation pipeline is multi-agent (Signal Ingestion → Value/Risk/Cost/Operability/
Strategic Fit → Consensus & Scoring) with debate, conflict resolution, and a blocking human
approval step ([spec §6](../spec.md)). We need a TypeScript-native runtime with deterministic,
auditable workflows and strong tracing, so that platform engineers can own it and so each
decision is explainable.

## Decision

We will use **VoltAgent** (TypeScript) as the agent runtime, with **VoltOps** for decision
tracing and input/output replay. Because the UI talks only to AG-UI
([ADR-0002](0002-ag-ui-as-sole-ui-agent-contract.md)), this choice is contained to
`packages/agents` and is swappable without UI changes.

Alternatives rejected: LangGraph / Python stacks (off our TypeScript platform; weaker fit
for a TS monorepo); a hand-rolled orchestrator (no built-in tracing/replay, more to
maintain).

## Consequences

- Agent reasoning is traceable and replayable via VoltOps ([spec §11](../spec.md)).
- Phase 0 ships a framework-agnostic no-op planner that emits the AG-UI stream; the real
  VoltAgent workflow + VoltOps wiring plug in behind the same `AsyncGenerator<AgUiEvent>`
  contract (see `packages/agents/src/planner.ts`).
- If VoltAgent proves unsuitable, the blast radius is `packages/agents` only — superseding
  this ADR would not touch the UI contract.
