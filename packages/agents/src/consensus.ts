/**
 * Consensus & Scoring Agent (spec §6.7). Deterministically aggregates the five
 * dimension scores into a ring recommendation, confidence, and key drivers/risks.
 */
import type {
  AgentDebateViewPayload,
  EvaluationDimension,
  RadarRing,
  RingChangeProposal,
  Technology,
} from '@curator/shared';
import type { EvaluationProfile } from './profiles.js';

/** Dimension-score spread above which the agents are considered to disagree. */
const CONFLICT_THRESHOLD = 0.3;

const WEIGHTS: Record<EvaluationDimension, number> = {
  Value: 0.25,
  Risk: 0.2,
  Cost: 0.15,
  Operability: 0.2,
  StrategicFit: 0.2,
};

/** Map an overall favorability score in [0, 1] to a radar ring. */
export function favorabilityToRing(overall: number): RadarRing {
  if (overall >= 0.8) return 'Adopt';
  if (overall >= 0.6) return 'Trial';
  if (overall >= 0.4) return 'Assess';
  return 'Hold';
}

function round(value: number, dp = 2): number {
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
}

function reviewDateIso(monthsAhead = 6): string {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsAhead);
  return date.toISOString().slice(0, 10);
}

/** Produce a ring-change proposal for a technology from its evaluation profile. */
export function runConsensus(
  technology: Technology,
  profile: EvaluationProfile,
): RingChangeProposal {
  const dimensions = Object.entries(profile.dimensions) as [
    EvaluationDimension,
    EvaluationProfile['dimensions'][EvaluationDimension],
  ][];

  const overall = dimensions.reduce((sum, [dim, p]) => sum + p.score * WEIGHTS[dim], 0);
  const mean = dimensions.reduce((sum, [, p]) => sum + p.score, 0) / dimensions.length;
  const variance =
    dimensions.reduce((sum, [, p]) => sum + (p.score - mean) ** 2, 0) / dimensions.length;
  const confidence = round(Math.min(0.95, Math.max(0.5, 1 - Math.sqrt(variance))));

  const keyDrivers = dimensions
    .filter(([, p]) => p.score >= 0.7 && p.driver)
    .map(([, p]) => p.driver as string);
  const keyRisks = dimensions
    .filter(([, p]) => p.score <= 0.45 && p.risk)
    .map(([, p]) => p.risk as string);

  return {
    technologyId: technology.id,
    technologyName: technology.name,
    fromRing: technology.currentRing,
    toRing: favorabilityToRing(overall),
    confidence,
    keyDrivers,
    keyRisks,
    reviewDate: reviewDateIso(),
  };
}

/**
 * Surface a debate when the dimension agents disagree (spec §9.3 AgentDebateView).
 * Returns `null` when the dimensions broadly agree, so the UI only shows dissent
 * when it exists.
 */
export function buildDebate(
  technology: Technology,
  profile: EvaluationProfile,
  consensusRing: RadarRing,
): AgentDebateViewPayload | null {
  const dimensions = Object.entries(profile.dimensions) as [
    EvaluationDimension,
    EvaluationProfile['dimensions'][EvaluationDimension],
  ][];

  const scores = dimensions.map(([, p]) => p.score);
  const spread = Math.max(...scores) - Math.min(...scores);
  if (spread < CONFLICT_THRESHOLD) return null;

  const positions = dimensions.map(([dimension, p]) => ({
    dimension,
    stance: p.summary,
    proposedRing: favorabilityToRing(p.score),
  }));
  const pointsOfDisagreement = positions
    .filter((pos) => pos.proposedRing !== consensusRing)
    .map((pos) => `${pos.dimension} alone points to ${pos.proposedRing}`);

  return {
    component: 'AgentDebateView',
    technologyId: technology.id,
    positions,
    pointsOfDisagreement,
    resolution: `Weighted aggregation across all five dimensions settled on ${consensusRing}.`,
  };
}
