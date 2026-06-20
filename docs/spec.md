# Tech Radar Curator – Detailed Specification

## 1. Purpose & Vision

The **Tech Radar Curator** is an AI-powered, agent-driven system built using **VoltAgent** that continuously curates, evaluates, and explains technology adoption decisions across an organization.

Its goal is to:

* Reduce **opinion-driven** or ad-hoc technology choices
* Increase **transparency and consistency** in tech decisions
* Provide a **living Tech Radar** with clear rationale, evidence, and ownership

The system mirrors how mature engineering orgs (e.g. Thoughtworks-style radars) reason about technology, but automates the heavy lifting.

---

## 2. Target Users

* **Principal / Staff Engineers** – reviewing and shaping technical direction
* **Platform & Architecture Teams** – governing standards and guardrails
* **Engineering Managers** – understanding risk and investment
* **New Engineers** – learning *why* technologies are adopted or discouraged

---

## 3. Scope & Non-Goals

### In Scope

* Automated discovery of technology signals
* Multi-agent evaluation and debate
* Structured Tech Radar outputs (Adopt / Trial / Assess / Hold)
* Traceable reasoning and evidence
* Human-in-the-loop approval

### Out of Scope (Initially)

* Automatic enforcement (this is advisory, not policy)
* Real-time performance benchmarking
* Vendor procurement workflows

---

## 4. Core Concepts

### 4.1 Radar Rings

| Ring       | Meaning                           |
| ---------- | --------------------------------- |
| **Adopt**  | Proven, recommended for new work  |
| **Trial**  | Promising, limited use encouraged |
| **Assess** | Worth investigating               |
| **Hold**   | Discouraged or legacy             |

### 4.2 Technology Types

* Languages & Frameworks
* Platforms & Cloud Services
* Libraries & SDKs
* Tools (CI/CD, Observability, DevEx)
* Architectural Patterns

---

## 5. High-Level Architecture

The Curator is organized as a layered, event-driven stack. A **generative UI** front end (CopilotKit) talks to the agent layer exclusively through the **AG-UI protocol**, mediated by an enterprise **AG-UI gateway**. The multi-agent evaluation pipeline (VoltAgent) reaches enterprise systems through **MCP**.

```text
┌─────────────────────────────────────────────┐
│              Curator Web App                │
│ React + TypeScript · Tailwind · shadcn/ui   │
│ TanStack Query · Zustand                    │
│ CopilotKit (chat, generative UI, HITL)      │
│   • useCopilotReadable  → radar/filter state│
│   • useCopilotAction    → UI actions        │
│   • generative UI        → agent-rendered    │
│                            radar components  │
└─────────────────┬───────────────────────────┘
                  │ AG-UI Protocol (SSE / WebSocket)
                  ▼
┌─────────────────────────────────────────────┐
│         AG-UI Gateway (NestJS)              │
│ Session mgmt · AuthN/AuthZ · Event routing  │
│ Event persistence · Audit logging · Rate    │
│ limiting · Approval brokering               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      Agent Orchestration (VoltAgent)        │
│ Planner / Curator Agent · Workflow Engine   │
│ State & Memory · Human Approval Engine      │
└──────┬───────────────────────────────┬──────┘
       │  Signal Ingestion Agent       │
       ▼                               ▼
  Evidence Store              Multi-Agent Evaluation
  (Vector + Structured)        ├─ Value Agent
                               ├─ Risk Agent
                               ├─ Cost Agent
                               ├─ Operability Agent
                               ├─ Strategic Fit Agent
                               └─ Consensus & Scoring Agent
                                        │
                                        ▼  Radar Update Proposal
                                     (streamed to UI via AG-UI)
                  │
                  ▼  MCP Gateway (Tool Registry · Policy · Secrets)
       GitHub · Jira · RFC/ADR store · Metrics · Vector DB
```

**Layered responsibilities** (per the AG-UI reference architecture):

| Layer | Responsibility | Implementation |
| ----- | -------------- | -------------- |
| **CopilotKit** | Agentic UX: chat, generative UI, shared state, HITL prompts | React UX layer only |
| **AG-UI Gateway** | Enterprise control plane: auth, audit, session/event persistence, approval policy | NestJS gateway |
| **Agent Runtime** | Reasoning, multi-agent debate, scoring workflows | VoltAgent |
| **MCP / API Gateway** | Governed tool access to enterprise systems | MCP servers |

> Design rule: CopilotKit is the **UX acceleration layer**, not the control plane. Authorization, audit, approval policy, and tool-credential management live behind the AG-UI gateway — never in the browser.

### 5.1 Core Pipeline Flow

```text
Signals (Repos, RFCs, Jira, Metrics)
        ↓
Signal Ingestion Agent  →  Evidence Store (Vector + Structured)
        ↓
Multi-Agent Evaluation (Value · Risk · Cost · Operability · Strategic Fit)
        ↓
Consensus & Scoring Agent
        ↓
Radar Update Proposal  ──(AG-UI events)──►  Generative UI Review
        ↓
Human Review & Approval  ──(AG-UI approval event)──►  Agent Continues
        ↓
Published Tech Radar
```

---

## 6. Agents & Responsibilities

### 6.1 Signal Ingestion Agent

**Responsibilities**

* Detect technology usage and discussion signals

**Inputs**

* Git repositories (package.json, pom.xml, go.mod, etc.)
* RFCs / ADRs
* Jira epics and tickets
* Production usage metrics

**Outputs**

* Normalized `TechnologySignal` objects

---

### 6.2 Value Agent

**Evaluates**

* Developer productivity
* Delivery speed
* Business enablement

**Questions Answered**

* Does this reduce cognitive load?
* Does it enable faster outcomes?

---

### 6.3 Risk Agent

**Evaluates**

* Security posture
* Maturity & ecosystem health
* Operational risk

**Frameworks Used**

* STRIDE
* Supply-chain risk heuristics

---

### 6.4 Cost Agent

**Evaluates**

* Licensing cost
* Cloud / runtime cost
* Switching and exit cost

---

### 6.5 Operability Agent

**Evaluates**

* Observability support
* On-call burden
* Debuggability

---

### 6.6 Strategic Fit Agent

**Evaluates**

* Alignment with target architecture
* Skills availability
* Long-term roadmap fit

---

### 6.7 Consensus & Scoring Agent

**Responsibilities**

* Aggregate agent outputs
* Resolve conflicts
* Produce final recommendation

**Output**

```json
{
  "technology": "ExampleTech",
  "ring": "Trial",
  "confidence": 0.78,
  "key_drivers": ["Productivity", "Ecosystem"],
  "key_risks": ["Immature tooling"],
  "review_date": "2026-06-01"
}
```

---

## 7. Data Model

### 7.1 Technology Entity

```ts
interface Technology {
  id: string;
  name: string;
  category: string;
  currentRing: RadarRing;
  ownerTeam?: string;
}
```

### 7.2 Signal

```ts
interface TechnologySignal {
  technologyId: string;
  source: 'repo' | 'rfc' | 'jira' | 'metrics';
  strength: number;
  timestamp: Date;
}
```

---

## 8. Workflow

1. Scheduled scan (weekly / monthly)
2. Signal ingestion and scoring
3. Multi-agent evaluation
4. Draft radar change proposal
5. Human review (approve / modify / reject)
6. Publish updated radar
7. Schedule re-evaluation

---

## 9. Frontend & Generative UI (CopilotKit + AG-UI)

The Curator's interface is built with **CopilotKit**, the React/UX acceleration layer for **AG-UI**-based agent applications. Rather than a static dashboard, the radar is rendered as **generative UI**: the agent backend emits typed AG-UI events that CopilotKit maps to live, interactive React components. This keeps the UI contract stable while the agent layer (VoltAgent today, swappable tomorrow) evolves underneath.

### 9.1 Why Generative UI Here

Tech-radar decisions are reasoning artifacts, not static rows. Generative UI lets the agents *show their work* in context:

* The Consensus Agent streams a **ring-change proposal card** as it forms its recommendation.
* The Risk/Value/Cost agents render **per-dimension evidence panels** inline as they complete.
* A disagreement triggers an **agent-debate view** so reviewers see the dissent, not just the verdict.
* Approval prompts appear as **interactive HITL cards** rather than separate modals.

### 9.2 CopilotKit Primitives

| Primitive | Use in the Curator |
| --------- | ------------------ |
| `CopilotSidebar` / chat UI | Conversational entry point: "Why is Kafka in Hold?", "Re-evaluate gRPC" |
| `useCopilotReadable` | Expose current UI state to the agents: selected technology, active ring filter, quadrant, date range, the radar draft under review |
| `useCopilotAction` | Let agents drive the UI: open a technology detail, filter to a ring/quadrant, highlight evidence, scroll the audit trail |
| Generative UI (`render`) | Agent-rendered domain components streamed as AG-UI events (see 9.3) |
| Human-in-the-loop | `renderAndWaitForResponse` approval cards for ring changes (see Section 10) |

### 9.3 Generative UI Component Catalog

Streamed by the agents over AG-UI and rendered by CopilotKit:

| Component | Triggered by | Renders |
| --------- | ------------ | ------- |
| **RingChangeProposalCard** | Consensus & Scoring Agent | Technology, proposed ring + delta from current, confidence, key drivers, key risks, review date, Approve / Modify / Reject |
| **DimensionEvidencePanel** | Each evaluation agent | Dimension score, supporting signals, source citations (repo, RFC, Jira, metric) with deep links |
| **AgentDebateView** | Consensus Agent on conflict | Side-by-side agent positions, points of disagreement, how consensus was (or wasn't) reached |
| **RadarVisualization** | Planner / Curator Agent | Interactive radar (Adopt/Trial/Assess/Hold × quadrants) with the proposed move animated |
| **SignalTimeline** | Signal Ingestion Agent | Chronological signal strength for a technology with source breakdown |
| **DriftAlert** | Governance / Observability | Decision-volatility warning when a technology has churned rings repeatedly |

### 9.4 AG-UI Event Flow

```text
Reviewer asks: "Should we move gRPC to Trial?"
        ↓ (CopilotKit → AG-UI request)
Curator/Planner Agent
        ├─► TOOL_CALL_START      → "Querying evidence store…"  (progress chip)
        ├─► STATE_UPDATE         → DimensionEvidencePanel x5 stream in
        ├─► GENERATIVE_UI        → RingChangeProposalCard renders
        ├─► APPROVAL_REQUIRED    → HITL card awaits Approve / Reject
        └─► FINAL_RESPONSE       → audit entry + radar updated
        ↓ (AG-UI event stream)
React UI updates incrementally
```

Events are typed (messages, tool calls, state changes, lifecycle, approvals) and stream over SSE (WebSocket optional), so the UI updates incrementally rather than waiting for a final blob.

### 9.5 Shared State Contract

* `useCopilotReadable` publishes the **current radar draft and selection context** to the agents, so a follow-up like "compare it to its alternatives" has context without re-stating it.
* `useCopilotAction` handlers are **frontend tools** registered with the gateway; the agent can invoke them but the gateway authorizes and audits each call.
* All state mutations that change a published radar route back through the **AG-UI gateway** (Section 5) — the browser never writes radar state directly.

---

## 10. Human-in-the-Loop Design

Human-in-the-loop is a first-class AG-UI pattern, surfaced through CopilotKit's approval primitives and enforced by the gateway.

```text
Consensus Agent
        ▼
"Move gRPC: Assess → Trial?"
        ▼
APPROVAL_REQUIRED  (AG-UI approval event)
        ▼
HITL card renders (generative UI):
  • Proposed ring + delta
  • Confidence score
  • Key drivers / key risks
  • Per-dimension evidence (expandable)
  • Editable rationale text
        ▼
Approve · Modify · Reject  (+ dissent comment)
        ▼
Agent continues → radar published → audit entry written
```

* **Mandatory approval** for every ring change — the agent **blocks** on the AG-UI approval event; it cannot self-publish.
* **Editable rationale text** captured in the approval card and persisted as the official decision record.
* **Comment and dissent capture** — reviewers can register disagreement even when approving.
* **Full audit trail** — every approval event, edit, and rejection is persisted by the gateway, independent of CopilotKit (the UX layer holds no authority).
* **Approval policy lives in the gateway**, not the browser: who may approve which quadrants/rings is enforced server-side.

---

## 11. Observability & Governance

Using **VoltOps** for agent-side tracing and the **AG-UI gateway** for the interaction record:

* Agent decision traces (VoltOps)
* Input/output replay (VoltOps)
* Drift detection (decision volatility) — surfaced as `DriftAlert` generative UI
* Explainability views per technology — rendered as `DimensionEvidencePanel` / `AgentDebateView`
* Full AG-UI event log (requests, tool calls, approvals) persisted at the gateway
* OpenTelemetry tracing spanning UI → gateway → agents → MCP

---

## 12. Security & Access Control

* Read-only access for most engineers
* Write / approve access for architecture group
* Immutable history of radar changes
* **Authentication and authorization enforced at the AG-UI gateway**, not in CopilotKit — frontend tools (`useCopilotAction`) are authorized server-side per call
* Tool credentials (GitHub, Jira, metrics) held by the MCP gateway; never exposed to the browser

---

## 13. Success Metrics

* Reduction in ad-hoc tech introductions
* Improved onboarding comprehension
* Fewer production incidents from immature tech
* Positive qualitative feedback from engineers
* Faster reviewer comprehension via generative UI (time-to-decision per proposal)

---

## 14. Roadmap

**Phase 1** – Internal radar, manual signal sources, CopilotKit chat + read-only generative radar
**Phase 2** – Automated repo and metric ingestion; full generative UI review + HITL approvals over AG-UI
**Phase 3** – Cross-org benchmarking; A2A specialist agents behind the gateway
**Phase 4** – Predictive recommendations with proactive `DriftAlert` generative UI

---

## 15. Why This Stack

### VoltAgent (Agent Runtime)

* Deterministic, auditable workflows
* Multi-agent debate patterns
* Strong observability (VoltOps)
* TypeScript-native for platform teams

### AG-UI (Agent ↔ Human Protocol)

* Standardizes UI ↔ agent communication via typed, streaming events
* Decouples the UI contract from the agent framework — VoltAgent is swappable without UI rewrites
* First-class human-approval and frontend-tool support for change governance

### CopilotKit (Generative UX Layer)

* Ships chat, generative UI, shared state, and HITL flows on AG-UI backends
* Avoids hand-building AG-UI UI plumbing — faster delivery
* Kept strictly as the UX layer; enterprise control stays in the gateway

### Protocol Stack

```text
User Interface  ──AG-UI──►  Agent Runtime  ──A2A──►  Specialist Agents  ──MCP──►  Enterprise Systems
```

* **AG-UI** = Agent ↔ Human · **A2A** = Agent ↔ Agent · **MCP** = Agent ↔ Tools

---

## 16. Summary

The Tech Radar Curator transforms architectural governance from static documents into a **living, explainable system**, balancing automation with human judgment while remaining transparent, auditable, and adaptable. By rendering agent reasoning as **generative UI** — CopilotKit components streamed over AG-UI from a VoltAgent backend — reviewers don't just read verdicts; they see the evidence, the debate, and the approval decision in context, with enterprise control enforced at the gateway rather than the browser.