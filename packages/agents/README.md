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

See [`/AGENTS.md`](../../AGENTS.md) and `docs/spec.md §6, §9.4, §10`.
