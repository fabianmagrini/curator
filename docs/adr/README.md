# Architecture Decision Records

This directory records the **architecture decisions** for the Tech Radar Curator using
lightweight [ADRs](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
(Michael Nygard's format). Each ADR captures one decision, the context that forced it, and
the consequences we accept.

## Conventions

- One decision per file: `NNNN-kebab-case-title.md`, numbered sequentially.
- ADRs are **immutable once `Accepted`.** To change a decision, write a new ADR that
  **supersedes** the old one and update both `Status` lines (and the index below).
- Status is one of: `Proposed` · `Accepted` · `Superseded by ADR-NNNN` · `Deprecated`.
- Keep them short. Link to `docs/spec.md` / `AGENTS.md` for detail rather than duplicating.
- Copy [`0000-adr-template.md`](0000-adr-template.md) to start a new one.

## Index

| ADR                                                     | Title                                                               | Status   |
| ------------------------------------------------------- | ------------------------------------------------------------------- | -------- |
| [0001](0001-record-architecture-decisions.md)           | Record architecture decisions with ADRs                             | Accepted |
| [0002](0002-ag-ui-as-sole-ui-agent-contract.md)         | AG-UI is the sole contract between UI and agents                    | Accepted |
| [0003](0003-copilotkit-ux-only-control-in-gateway.md)   | CopilotKit is the UX layer; enterprise control lives in the gateway | Accepted |
| [0004](0004-mandatory-human-in-the-loop-approval.md)    | Mandatory human-in-the-loop approval for ring changes               | Accepted |
| [0005](0005-mcp-for-agent-tool-access.md)               | All agent tool access goes through MCP                              | Accepted |
| [0006](0006-voltagent-as-agent-runtime.md)              | VoltAgent as the agent runtime                                      | Accepted |
| [0007](0007-pnpm-monorepo-strict-ts-shared-types.md)    | pnpm workspace monorepo, strict TS, shared types package            | Accepted |
| [0008](0008-sse-transport-for-ag-ui.md)                 | SSE as the default AG-UI transport                                  | Accepted |
| [0009](0009-nestjs-for-the-gateway.md)                  | NestJS for the AG-UI gateway                                        | Accepted |
| [0010](0010-gateway-dev-runner-decorator-metadata.md)   | Run the gateway dev server from compiled output, not tsx            | Accepted |
| [0011](0011-gateway-approval-brokering.md)              | Gateway brokers HITL approval via an injected await hook            | Accepted |
| [0012](0012-in-memory-persistence-postgres-deferred.md) | In-memory gateway persistence behind interfaces; Postgres deferred  | Accepted |
