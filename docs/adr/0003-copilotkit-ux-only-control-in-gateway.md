# 0003. CopilotKit is the UX layer; enterprise control lives in the gateway

- Date: 2026-06-20
- Status: Accepted

## Context

CopilotKit makes it fast to ship chat, generative UI, shared state, and HITL flows on an
AG-UI backend. The temptation is to let the browser also hold authority — calling tools,
writing radar state, enforcing who may approve. But this is governance software: decisions
are auditable and access-controlled, and the radar is a system of record. Authority in the
browser is unauditable and trivially bypassed.

## Decision

We will treat **CopilotKit strictly as the UX acceleration layer** and place all enterprise
control in the **AG-UI gateway** ([ADR-0009](0009-nestjs-for-the-gateway.md)):
authentication/authorization, audit logging, session and event persistence, approval
policy, rate limiting, and tool-credential management. The browser **never** writes
published radar state and **never** holds tool credentials. Frontend tools
(`useCopilotAction`) are authorized and audited server-side, per call.

## Consequences

- A clear trust boundary: the UI is replaceable and untrusted; the gateway is the control
  plane.
- Any feature that seems to need auth/audit/radar writes in `apps/web` is a signal it
  belongs in the gateway.
- Slightly more plumbing (frontend tool calls round-trip through the gateway) in exchange
  for an enforceable, auditable security model ([spec §12](../spec.md)).
