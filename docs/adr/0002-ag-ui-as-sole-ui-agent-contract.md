# 0002. AG-UI is the sole contract between UI and agents

- Date: 2026-06-20
- Status: Accepted

## Context

The web app needs to render the agents' reasoning as it streams. If the UI imported the
agent framework's types or called it directly, the front end would be coupled to VoltAgent,
and swapping or upgrading the runtime would force UI rewrites. Tech-radar reasoning is also
incremental (tool calls, per-dimension evidence, a proposal, an approval gate), so the
contract must be event-based rather than a single request/response blob.

## Decision

We will make **AG-UI the only contract between the UI and the agent runtime**. All
interaction is via typed, streaming AG-UI events (`TOOL_CALL_START`, `PROGRESS`,
`STATE_UPDATE`, `GENERATIVE_UI`, `APPROVAL_REQUIRED`, `FINAL_RESPONSE`). Every event and
generative-UI payload type lives in `packages/shared` and is imported by both producer
(`packages/agents`) and consumer (`apps/web`) — never redefined.

Alternatives rejected: a bespoke REST/RPC surface (couples UI to runtime, no first-class
streaming/HITL); GraphQL subscriptions (heavier, still a custom schema to keep stable).

## Consequences

- The agent runtime stays swappable behind a stable contract (enables [ADR-0006](0006-voltagent-as-agent-runtime.md)).
- Contract changes require updating `packages/shared` and both sides in the same change.
- One layer of indirection between agent output and UI; the payoff is decoupling and a
  uniform, replayable event log at the gateway.
- Generative UI ([spec §9.3](../spec.md)) is expressed as `GENERATIVE_UI` payloads, keeping
  rendered components data-driven.
