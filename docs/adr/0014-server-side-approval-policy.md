# 0014. Server-side approval policy gates who may resolve ring changes

- Date: 2026-06-28
- Status: Accepted

## Context

[ADR-0011](0011-gateway-approval-brokering.md) lets the gateway broker a HITL decision, but any
caller of `POST /agui/approvals/:id` could resolve it. The spec requires that authority be
enforced server-side, never in the browser: read-only access for most engineers, write/approve
for the architecture group (spec §10, §12). Full authN/authZ is still out of scope (a
cross-cutting backlog item), so we need a policy seam that enforces _who_ may approve without
yet standing up identity infrastructure.

## Decision

Introduce an `ApproverRole` (`engineer | architect`) in `@curator/shared` and an injectable
`ApprovalPolicy` in the gateway. The approver's role travels in the `x-approver-role` request
header; `ApprovalPolicy.roleFromHeader` coerces unknown/absent values to the least-privileged
`engineer`. `canApprove(role, proposal)` is the single authorization point — currently a role
gate (architects may resolve any ring change; engineers are denied), shaped so per-ring or
per-quadrant rules can be layered on later by inspecting the proposal.

`AgUiService.resolveApproval` consults the policy **before** recording the audit entry or
unblocking the run, and returns a discriminated outcome (`ok | not_found | forbidden`) that the
controller maps to `200 / 404 / 403`. A denied decision leaves the run blocked and writes no
audit entry — only authorized decisions enter the record. The audit entry now carries
`approverRole` (the governance "who"), persisted in the `agui_audit` table.

## Consequences

- Authorization is enforced at the gateway, not CopilotKit — the UX layer holds no authority.
- The header is a deliberate placeholder: it swaps cleanly for verified JWT/SSO claims behind
  the same `ApprovalPolicy` seam when authN lands, with no change to the policy or audit shape.
- Until then the web client acts as `architect` so the demo flow still works; trust is only as
  strong as the (currently unauthenticated) header.
- The policy is intentionally coarse (role-only). Per-ring/quadrant granularity is a follow-up
  that does not require re-plumbing the call path.
