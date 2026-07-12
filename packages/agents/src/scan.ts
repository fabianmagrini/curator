/**
 * Scheduled radar scan (spec §8). Runs the evaluation pipeline across the radar
 * and collects the proposed ring changes — **without approving or publishing any
 * of them**. This is an *advisory* scan: it surfaces what the agents would propose
 * so a human can review on a cadence; mandatory HITL approval still happens through
 * the live flow (ADR-0004, ADR-0017). Deterministic over seeded data (ADR-0006).
 */
import { SEED_TECHNOLOGIES, type RadarRing } from '@curator/shared';
import { runEvaluation } from './evaluation.js';

/** One technology's outcome in a scan. */
export interface ScanResult {
  technologyId: string;
  technologyName: string;
  fromRing: RadarRing;
  toRing: RadarRing;
  /** Whether the proposal actually moves the technology to a different ring. */
  changed: boolean;
  confidence: number;
  keyDrivers: string[];
  keyRisks: string[];
  reviewDate: string;
}

export interface ScanReport {
  /** ISO timestamp when the scan ran. */
  generatedAt: string;
  /** Number of technologies evaluated. */
  evaluated: number;
  /** How many evaluations proposed an actual ring change. */
  changesProposed: number;
  results: ScanResult[];
}

export interface ScanOptions {
  /** Technology ids to scan; defaults to every seeded radar technology. */
  technologyIds?: readonly string[];
}

/**
 * Run one technology through the pipeline **standalone** (no `awaitApproval`), so
 * it never blocks and never publishes, and read the proposal off the
 * `APPROVAL_REQUIRED` gate.
 */
async function proposeFor(technologyId: string): Promise<ScanResult | null> {
  for await (const event of runEvaluation({ prompt: 'Scheduled radar scan', technologyId })) {
    if (event.type === 'APPROVAL_REQUIRED') {
      const p = event.proposal;
      return {
        technologyId: p.technologyId,
        technologyName: p.technologyName,
        fromRing: p.fromRing,
        toRing: p.toRing,
        changed: p.fromRing !== p.toRing,
        confidence: p.confidence,
        keyDrivers: p.keyDrivers,
        keyRisks: p.keyRisks,
        reviewDate: p.reviewDate,
      };
    }
  }
  return null;
}

/** Evaluate the radar and report the proposals awaiting human review. */
export async function runScan(options: ScanOptions = {}): Promise<ScanReport> {
  const ids = options.technologyIds ?? SEED_TECHNOLOGIES.map((tech) => tech.id);
  const results: ScanResult[] = [];
  for (const id of ids) {
    const result = await proposeFor(id);
    if (result) results.push(result);
  }
  return {
    generatedAt: new Date().toISOString(),
    evaluated: results.length,
    changesProposed: results.filter((r) => r.changed).length,
    results,
  };
}

/** A one-line-per-technology human summary of a scan report. */
export function formatScanReport(report: ScanReport): string {
  const lines = report.results.map((r) =>
    r.changed
      ? `  ~ ${r.technologyName}: ${r.fromRing} → ${r.toRing} (confidence ${r.confidence})`
      : `    ${r.technologyName}: ${r.fromRing} (no change)`,
  );
  return [
    `Radar scan ${report.generatedAt}`,
    `${report.evaluated} evaluated, ${report.changesProposed} change(s) proposed for review:`,
    ...lines,
  ].join('\n');
}
