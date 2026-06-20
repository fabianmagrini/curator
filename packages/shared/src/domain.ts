/**
 * Core radar domain model. Source of truth — see `docs/spec.md §7`.
 * These types are imported across the monorepo and never redefined downstream.
 */

/** The four radar rings (spec §4.1). */
export type RadarRing = 'Adopt' | 'Trial' | 'Assess' | 'Hold';

export const RADAR_RINGS: readonly RadarRing[] = ['Adopt', 'Trial', 'Assess', 'Hold'] as const;

/** Technology classification (spec §4.2). */
export type TechnologyCategory =
  | 'languages-and-frameworks'
  | 'platforms-and-cloud'
  | 'libraries-and-sdks'
  | 'tools'
  | 'architectural-patterns';

/** The five evaluation dimensions handled by the specialist agents (spec §6.2–6.6). */
export type EvaluationDimension = 'Value' | 'Risk' | 'Cost' | 'Operability' | 'StrategicFit';

export const EVALUATION_DIMENSIONS: readonly EvaluationDimension[] = [
  'Value',
  'Risk',
  'Cost',
  'Operability',
  'StrategicFit',
] as const;

/** Where a signal originated (spec §6.1, §7.2). */
export type SignalSource = 'repo' | 'rfc' | 'jira' | 'metrics';

/** A technology tracked on the radar (spec §7.1). */
export interface Technology {
  id: string;
  name: string;
  category: TechnologyCategory;
  currentRing: RadarRing;
  ownerTeam?: string;
}

/** A normalized usage/discussion signal for a technology (spec §7.2). */
export interface TechnologySignal {
  technologyId: string;
  source: SignalSource;
  /** Normalized strength in [0, 1]. */
  strength: number;
  timestamp: Date;
}

/**
 * Output of the Consensus & Scoring Agent — a proposed ring change awaiting
 * human approval (spec §6.7).
 */
export interface RingChangeProposal {
  technologyId: string;
  technologyName: string;
  fromRing: RadarRing;
  toRing: RadarRing;
  /** Confidence in [0, 1]. */
  confidence: number;
  keyDrivers: string[];
  keyRisks: string[];
  /** ISO date (YYYY-MM-DD) for the next scheduled review. */
  reviewDate: string;
}
