/**
 * Generative-UI component payloads streamed by the agents and rendered by
 * CopilotKit (spec §9.3). Each payload is a serializable description of a
 * component the agent wants the UI to render.
 */
import type { EvaluationDimension, RadarRing, RingChangeProposal, SignalSource } from './domain.js';

/** A citation backing a dimension score, with a deep link to the source. */
export interface EvidenceCitation {
  source: SignalSource;
  label: string;
  url?: string;
}

/** RingChangeProposalCard — rendered by the Consensus & Scoring Agent. */
export interface RingChangeProposalCardPayload {
  component: 'RingChangeProposalCard';
  proposal: RingChangeProposal;
}

/** DimensionEvidencePanel — rendered by each evaluation agent. */
export interface DimensionEvidencePanelPayload {
  component: 'DimensionEvidencePanel';
  technologyId: string;
  dimension: EvaluationDimension;
  /** Dimension score in [0, 1]. */
  score: number;
  summary: string;
  citations: EvidenceCitation[];
}

/** A single agent's stance within a debate. */
export interface AgentPosition {
  dimension: EvaluationDimension;
  stance: string;
  proposedRing?: RadarRing;
}

/** AgentDebateView — rendered by the Consensus Agent on conflict. */
export interface AgentDebateViewPayload {
  component: 'AgentDebateView';
  technologyId: string;
  positions: AgentPosition[];
  pointsOfDisagreement: string[];
  resolution?: string;
}

/** One technology's position on the radar. */
export interface RadarPoint {
  technologyId: string;
  name: string;
  ring: RadarRing;
  quadrant: string;
}

/** RadarVisualization — rendered by the Planner / Curator Agent. */
export interface RadarVisualizationPayload {
  component: 'RadarVisualization';
  points: RadarPoint[];
  proposedMove?: {
    technologyId: string;
    fromRing: RadarRing;
    toRing: RadarRing;
  };
}

/** A single point on a signal-strength timeline. */
export interface SignalTimelinePoint {
  /** ISO timestamp. */
  timestamp: string;
  source: SignalSource;
  strength: number;
}

/** SignalTimeline — rendered by the Signal Ingestion Agent. */
export interface SignalTimelinePayload {
  component: 'SignalTimeline';
  technologyId: string;
  points: SignalTimelinePoint[];
}

/** DriftAlert — rendered by governance/observability on decision volatility. */
export interface DriftAlertPayload {
  component: 'DriftAlert';
  technologyId: string;
  technologyName: string;
  /** Number of ring changes observed in the lookback window. */
  ringChanges: number;
  windowDays: number;
  message: string;
}

/** Discriminated union of every generative-UI payload (discriminant: `component`). */
export type GenerativeUiPayload =
  | RingChangeProposalCardPayload
  | DimensionEvidencePanelPayload
  | AgentDebateViewPayload
  | RadarVisualizationPayload
  | SignalTimelinePayload
  | DriftAlertPayload;

/** The set of generative-UI component names, derived from the payload union. */
export type GenerativeUiComponentName = GenerativeUiPayload['component'];
