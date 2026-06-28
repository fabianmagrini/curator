# 0011. Gateway brokers HITL approval via an injected await hook

- Date: 2026-06-28
- Status: Accepted

## Context

[ADR-0004](0004-mandatory-human-in-the-loop-approval.md) requires the agent to **block** on a
ring-change approval and never self-publish, with the decision enforced and recorded by the
gateway. AG-UI events flow server→client over SSE ([ADR-0008](0008-sse-transport-for-ag-ui.md)),
while a human decision is a client→server action. The agent runtime must stay framework-
agnostic ([ADR-0002](0002-ag-ui-as-sole-ui-agent-contract.md)), so the blocking mechanism
cannot leak gateway concerns into it.

## Decision

The agent run exposes an injectable `awaitApproval` hook. `runEvaluation` registers the wait
**before** emitting `APPROVAL_REQUIRED`, then awaits it before finishing; on resolution it
emits a `STATE_UPDATE` (publish) and a decision-aware `FINAL_RESPONSE`. The gateway injects a
callback backed by an in-memory `ApprovalRegistry`; `POST /agui/approvals/:id` resolves the
pending promise, unblocking the run, whose remaining events stream over the **same** open SSE
connection. The gateway records an immutable audit entry on resolution. A client disconnect
cancels the pending approval.

## Consequences

- The agent stays swappable — blocking is just an awaited callback, no gateway coupling.
- SSE connections are long-lived (open across the human's decision); the gateway must tolerate
  that and clean up on disconnect.
- The registry is a single in-memory instance, so the gateway does not yet scale horizontally;
  multi-instance would need a shared store / pub-sub (future ADR).
- Realizes the mandatory-HITL rule end-to-end (stream blocks at the gate, resumes on decision,
  audit recorded).
