# 0017. Scheduled scans are advisory — they never auto-approve

- Date: 2026-07-12
- Status: Accepted

## Context

Spec §8 calls for a scheduled scan job that drives the evaluation pipeline on a cadence. The
pipeline emits `APPROVAL_REQUIRED` for every proposed ring change and, in normal operation, blocks
until a human resolves it — mandatory HITL ([ADR-0004](0004-mandatory-human-in-the-loop-approval.md)).
A headless scan has no human in the loop, which raises the obvious temptation: auto-approve
high-confidence proposals so scans can publish on their own. That would bypass the system's core
governance guarantee.

## Decision

The scheduled scan is **advisory**. `runScan` (`packages/agents/src/scan.ts`) drives the pipeline
**standalone** — it calls `runEvaluation` _without_ an `awaitApproval` hook, so the run never blocks
and never publishes — and reads each proposal off the `APPROVAL_REQUIRED` event. It produces a
`ScanReport` (per-technology proposed ring changes, with a `changed` flag and confidence) for a human
to review through the existing live approval flow. It **never** approves or writes radar state,
regardless of confidence.

The job is a plain runnable (`pnpm scan` → `scan.cli.ts`); the cadence itself (weekly/monthly) is
wired externally via CI schedule or cron, not an in-process scheduler.

## Consequences

- Automation surfaces "what would change" without ever eroding mandatory HITL — a scan is a report,
  not an actor.
- No new runtime dependency or scheduler in the app; the cadence lives in deployment/CI.
- Deterministic and unit-testable today (seeded data, ADR-0006). Real scan value scales with real
  signals; the noisy "→ Assess" proposals for unseeded technologies reflect neutral default profiles,
  not a scan defect.
- A future, richer version could run through the gateway to persist scan proposals as pending
  approvals for asynchronous review — a larger change to the approval model, deferred until needed.
