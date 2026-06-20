# 0008. SSE as the default AG-UI transport

- Date: 2026-06-20
- Status: Accepted

## Context

AG-UI events flow predominantly **server → client**: the agent streams tool calls, progress,
generative UI, approval gates, and a final response, and the UI renders them incrementally
([spec §9.4](../spec.md)). Client → server interactions (start a run, resolve an approval)
are coarse-grained and fit ordinary HTTP requests. We need a transport that streams reliably
through corporate proxies with minimal infrastructure.

## Decision

We will use **Server-Sent Events (SSE)** as the default AG-UI transport. The gateway exposes
an SSE endpoint that relays AG-UI events (Phase 0: `GET /agui/stream`); client → server
actions use normal HTTP. **WebSocket remains an option** for later if we need true
bidirectional, low-latency interaction.

Alternatives rejected: WebSocket as the default (bidirectional complexity we don't yet need,
more fragile through proxies/load balancers); long-polling (worse ergonomics and latency).

## Consequences

- Simple, HTTP-native streaming with built-in browser reconnection (`EventSource`); easy to
  log and replay at the gateway.
- SSE is one-directional per stream and subject to per-host connection limits over HTTP/1.1;
  acceptable for the current interaction model.
- Events must be JSON-serializable (already required by
  [ADR-0002](0002-ag-ui-as-sole-ui-agent-contract.md)).
