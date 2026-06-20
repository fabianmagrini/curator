# 0001. Record architecture decisions with ADRs

- Date: 2026-06-20
- Status: Accepted

## Context

The Tech Radar Curator's significant decisions are currently scattered across
`docs/spec.md` (§15 "Why This Stack") and the "non-negotiable design rules" in `AGENTS.md`.
That prose explains the system as it is _now_ but not _why_ each choice was made, what was
rejected, or what we are trading away. As the project grows — and as AI coding agents work
the backlog — we need a durable, discoverable record so decisions are not silently re-opened
or contradicted.

## Decision

We will record architecture decisions as **Architecture Decision Records** in `docs/adr/`,
using Michael Nygard's lightweight format (Context / Decision / Consequences).

- ADRs are numbered sequentially and are **immutable once `Accepted`**.
- A decision is changed by writing a **new ADR that supersedes** the prior one, not by
  editing history.
- `docs/spec.md` remains the source of truth for _behavior_; ADRs are the source of truth
  for _why the architecture is the way it is_.

## Consequences

- Decisions gain explicit context and rejected alternatives, reducing re-litigation.
- A small, ongoing authoring cost per decision; the index in `docs/adr/README.md` must be
  kept current.
- `AGENTS.md` points agents at this directory so they consult it before changing
  cross-cutting structure.
