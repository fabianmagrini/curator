# 0005. All agent tool access goes through MCP

- Date: 2026-06-20
- Status: Accepted

## Context

Agents must read from enterprise systems — Git repositories, RFC/ADR stores, Jira, and
production metrics ([spec §6.1](../spec.md)) — to gather signals. These integrations carry
credentials and must be governed: access controlled, audited, and centrally managed. Letting
each agent embed bespoke clients and secrets would scatter credentials and make tool access
unauditable.

## Decision

We will route **all agent access to enterprise systems through MCP** (Model Context
Protocol). Tool credentials are held by the MCP/gateway layer and **never** exposed to the
agents' general logic or the browser. The gateway owns the MCP concerns: a tool registry,
policy enforcement, and secret management.

Alternatives rejected: direct SDK calls per agent (scattered secrets, no central policy);
a hand-rolled internal tool API (reinvents MCP without ecosystem compatibility).

## Consequences

- A single, governed, auditable surface for tool access; credentials live in one place
  ([spec §5, §12](../spec.md)).
- New tools are added as MCP servers rather than ad-hoc client code.
- Sets up A2A specialist agents behind the gateway as a later step ([spec §15](../spec.md)).
- Phase 0 ships no MCP integrations yet; this ADR fixes the direction for Phase 2.
