# 0004. Mandatory human-in-the-loop approval for ring changes

- Date: 2026-06-20
- Status: Accepted

## Context

The Curator is **advisory, not enforcing** ([spec §3](../spec.md)). A ring change
(Adopt/Trial/Assess/Hold) shapes how an organization builds software, so it must carry human
accountability and a decision record. Fully autonomous publication would be faster but would
make the radar untrustworthy and unauditable, and would put an LLM in charge of governance.

## Decision

We will require **mandatory human approval for every ring change**. The agent emits an
`APPROVAL_REQUIRED` AG-UI event and **blocks** — it cannot self-publish. The gateway brokers
the decision: it holds the run until a human resolves it (Approve / Modify / Reject),
enforces server-side approval policy (who may approve which rings/quadrants), captures
editable rationale and dissent, and writes an immutable audit entry.

Alternatives rejected: auto-publish with after-the-fact review (no accountability before
impact); approval enforced only in the UI (bypassable — see [ADR-0003](0003-copilotkit-ux-only-control-in-gateway.md)).

## Consequences

- The pipeline is intentionally not fully autonomous; throughput is gated on reviewers.
- The gateway must implement an approval lifecycle and durable audit trail
  ([spec §10–11](../spec.md)); the agent runtime must support blocking/resumable runs.
- The `APPROVAL_REQUIRED` event and `ApprovalResolution` type are part of the
  `packages/shared` contract ([ADR-0002](0002-ag-ui-as-sole-ui-agent-contract.md)).
