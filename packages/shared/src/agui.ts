/**
 * AG-UI event contracts — the single, stable wire format between the UI and the
 * agent runtime (spec §9.4). Keep this union stable so the agent framework
 * (VoltAgent today) stays swappable. All events are JSON-serializable.
 */
import type { GenerativeUiPayload } from './generative-ui.js';
import type { RingChangeProposal } from './domain.js';

export type AgUiEventType =
  | 'TOOL_CALL_START'
  | 'PROGRESS'
  | 'STATE_UPDATE'
  | 'GENERATIVE_UI'
  | 'APPROVAL_REQUIRED'
  | 'FINAL_RESPONSE';

/** Fields shared by every AG-UI event. */
export interface AgUiEventBase {
  type: AgUiEventType;
  /** Correlates all events belonging to a single agent run. */
  runId: string;
  /** Monotonic sequence number within a run, starting at 0. */
  seq: number;
  /** ISO timestamp of when the event was emitted. */
  timestamp: string;
}

/** An agent has started calling a tool (e.g. "Querying evidence store…"). */
export interface ToolCallStartEvent extends AgUiEventBase {
  type: 'TOOL_CALL_START';
  toolName: string;
  /** Human-readable label for a progress chip. */
  label: string;
}

/** Incremental progress for a long-running step. */
export interface ProgressEvent extends AgUiEventBase {
  type: 'PROGRESS';
  message: string;
  /** Optional completion ratio in [0, 1]. */
  ratio?: number;
}

/** A patch to shared agent/UI state (radar draft, selection, etc.). */
export interface StateUpdateEvent extends AgUiEventBase {
  type: 'STATE_UPDATE';
  key: string;
  value: unknown;
}

/** Instructs the UI to render a generative-UI component (spec §9.3). */
export interface GenerativeUiEvent extends AgUiEventBase {
  type: 'GENERATIVE_UI';
  payload: GenerativeUiPayload;
}

/**
 * Human-in-the-loop gate. The agent blocks until the approval is resolved
 * server-side; it cannot self-publish (spec §10).
 */
export interface ApprovalRequiredEvent extends AgUiEventBase {
  type: 'APPROVAL_REQUIRED';
  approvalId: string;
  proposal: RingChangeProposal;
}

/** Terminal event for a run. */
export interface FinalResponseEvent extends AgUiEventBase {
  type: 'FINAL_RESPONSE';
  message: string;
}

/** The discriminated union of all AG-UI events (discriminant: `type`). */
export type AgUiEvent =
  | ToolCallStartEvent
  | ProgressEvent
  | StateUpdateEvent
  | GenerativeUiEvent
  | ApprovalRequiredEvent
  | FinalResponseEvent;

/** Possible resolutions for an APPROVAL_REQUIRED gate (spec §10). */
export type ApprovalDecision = 'approve' | 'modify' | 'reject';

/** A human's response to an approval gate, brokered by the gateway. */
export interface ApprovalResolution {
  approvalId: string;
  decision: ApprovalDecision;
  /** Editable rationale persisted as the official decision record. */
  rationale?: string;
  /** Dissent captured even when approving. */
  dissent?: string;
}
