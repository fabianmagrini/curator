# 0009. NestJS for the AG-UI gateway

- Date: 2026-06-20
- Status: Accepted

## Context

The gateway is the enterprise control plane ([ADR-0003](0003-copilotkit-ux-only-control-in-gateway.md)):
authn/authz, session and event persistence, audit logging, rate limiting, approval
brokering, and MCP/tool governance. These are cross-cutting concerns that benefit from a
structured server framework rather than ad-hoc middleware, and the team is TypeScript-first.

## Decision

We will build the gateway with **NestJS** (Node.js, TypeScript). Its dependency injection,
modules, and guards/interceptors/pipes map cleanly onto auth, audit, and rate-limiting
concerns, and its first-class SSE support fits the AG-UI transport
([ADR-0008](0008-sse-transport-for-ag-ui.md)). Phase 0 ships a `GET /health` route and an
SSE `GET /agui/stream` endpoint.

Alternatives rejected: Express/Fastify alone (less structure for the many cross-cutting
concerns we will add); a serverless function surface (poor fit for long-lived SSE streams and
blocking approval state).

## Consequences

- A conventional structure for the control-plane features arriving in Phases 1–2.
- A heavier framework and decorator/metadata build setup than a minimal HTTP server.
- Persistence (Postgres) and session/event buffering (Redis) slot in as Nest modules later.
