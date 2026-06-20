# packages/agents — Agent Runtime (VoltAgent)

The reasoning/workflow layer. Ingests signals, runs multi-agent evaluation and debate,
reaches consensus, and proposes radar changes — emitting typed AG-UI events as it works.

**Stack:** TypeScript · VoltAgent · VoltOps (tracing) · MCP clients

**Agents** (spec §6)

- Signal Ingestion → `TechnologySignal`
- Value · Risk · Cost · Operability · Strategic Fit → each emits a `DimensionEvidencePanel`
- Consensus & Scoring → ring-change proposal + `RingChangeProposalCard` / `AgentDebateView`

**Boundaries**

- Reaches enterprise systems only via **MCP** (GitHub, Jira, metrics, RFC/ADR store).
- Emits/consumes AG-UI events using the contracts in `packages/shared` — never redefines them.
- **Blocks on approval**: a ring change emits `APPROVAL_REQUIRED` and waits; it cannot
  self-publish. The gateway brokers the human decision.

## Status

Phase 0: a **no-op planner** (`src/planner.ts`) emits a representative AG-UI stream
(`TOOL_CALL_START` → `GENERATIVE_UI` → `APPROVAL_REQUIRED` → `FINAL_RESPONSE`) as an
`AsyncGenerator<AgUiEvent>`. The real VoltAgent workflow + VoltOps tracing plug in behind
that same contract — see the integration note at the top of `planner.ts`.

See [`/AGENTS.md`](../../AGENTS.md) and `docs/spec.md §6, §9.4, §10`.
