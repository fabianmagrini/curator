/**
 * Seeded evaluation data driving the deterministic Phase 1 pipeline. Each profile
 * stands in for what the Signal Ingestion + dimension agents would discover and
 * reason about (spec §6.1–6.6). Real LLM reasoning (VoltAgent + Claude) plugs in
 * behind the same shape later — see ADR-0006.
 */
import type { EvaluationDimension, EvidenceCitation, TechnologySignal } from '@curator/shared';

export interface DimensionProfile {
  /** Favorability for adoption in [0, 1] (higher is better, including for Risk). */
  score: number;
  summary: string;
  citations: EvidenceCitation[];
  /** Phrase surfaced as a key driver when this dimension scores high. */
  driver?: string;
  /** Phrase surfaced as a key risk when this dimension scores low. */
  risk?: string;
}

export interface EvaluationProfile {
  signals: TechnologySignal[];
  dimensions: Record<EvaluationDimension, DimensionProfile>;
}

const GRPC: EvaluationProfile = {
  signals: [
    { technologyId: 'grpc', source: 'repo', strength: 0.9, timestamp: new Date('2026-03-01') },
    { technologyId: 'grpc', source: 'rfc', strength: 0.6, timestamp: new Date('2026-04-12') },
    { technologyId: 'grpc', source: 'jira', strength: 0.5, timestamp: new Date('2026-05-02') },
    { technologyId: 'grpc', source: 'metrics', strength: 0.7, timestamp: new Date('2026-05-20') },
  ],
  dimensions: {
    Value: {
      score: 0.82,
      summary: 'Cuts cross-service boilerplate and improves contract safety via generated stubs.',
      citations: [{ source: 'repo', label: '14 services already depend on it' }],
      driver: 'Strong contract safety and reduced boilerplate',
    },
    Risk: {
      score: 0.55,
      summary: 'Mature, widely adopted protocol; internal security review is still pending.',
      citations: [{ source: 'rfc', label: 'RFC-204: gRPC adoption (draft)' }],
    },
    Cost: {
      score: 0.7,
      summary: 'Open source with no licensing cost; migration from REST is incremental.',
      citations: [{ source: 'jira', label: 'PLAT-881: incremental migration spike' }],
      driver: 'Open source, modest migration cost',
    },
    Operability: {
      score: 0.42,
      summary: 'Observability and debuggability lag REST; tracing tooling is immature internally.',
      citations: [{ source: 'metrics', label: 'No standard gRPC dashboards yet' }],
      risk: 'Weaker observability and debuggability than REST',
    },
    StrategicFit: {
      score: 0.75,
      summary: 'Aligns with the service-mesh roadmap; team skills are growing.',
      citations: [{ source: 'rfc', label: 'Target architecture: service mesh' }],
      driver: 'Aligns with the service-mesh roadmap',
    },
  },
};

const PROFILES: Record<string, EvaluationProfile> = {
  grpc: GRPC,
};

function defaultProfile(): EvaluationProfile {
  const neutral = (summary: string): DimensionProfile => ({ score: 0.5, summary, citations: [] });
  return {
    signals: [],
    dimensions: {
      Value: neutral('No strong value signals yet.'),
      Risk: neutral('Risk posture not yet assessed.'),
      Cost: neutral('Cost impact unknown.'),
      Operability: neutral('Operability not yet assessed.'),
      StrategicFit: neutral('Strategic alignment unclear.'),
    },
  };
}

/** Get the evaluation profile for a technology, or a neutral default if unseeded. */
export function getProfile(technologyId: string): EvaluationProfile {
  return PROFILES[technologyId] ?? defaultProfile();
}
