import { describe, expect, it } from 'vitest';
import { SEED_TECHNOLOGIES } from '@curator/shared';
import { formatScanReport, runScan } from './scan.js';

describe('runScan', () => {
  it('evaluates every seeded technology and reports a proposal for each', async () => {
    const report = await runScan();
    expect(report.results).toHaveLength(SEED_TECHNOLOGIES.length);
    expect(report.evaluated).toBe(SEED_TECHNOLOGIES.length);
    expect(new Set(report.results.map((r) => r.technologyId))).toEqual(
      new Set(SEED_TECHNOLOGIES.map((t) => t.id)),
    );
  });

  it('derives `changed` from the ring delta, and `changesProposed` counts them', async () => {
    const report = await runScan();
    for (const r of report.results) {
      expect(r.changed).toBe(r.fromRing !== r.toRing);
    }
    expect(report.changesProposed).toBe(report.results.filter((r) => r.changed).length);
  });

  it('scans a specific subset and preserves the current ring as `fromRing`', async () => {
    const report = await runScan({ technologyIds: ['grpc'] });
    expect(report.results).toHaveLength(1);
    const grpc = report.results[0];
    expect(grpc?.technologyId).toBe('grpc');
    expect(grpc?.fromRing).toBe('Assess'); // gRPC's seeded ring — the scan never mutates it
    expect(grpc?.confidence).toBeGreaterThan(0);
  });

  it('formats a readable summary with the change count', async () => {
    const report = await runScan({ technologyIds: ['grpc', 'react'] });
    const text = formatScanReport(report);
    expect(text).toContain('2 evaluated');
    expect(text).toMatch(/change\(s\) proposed/);
  });
});
