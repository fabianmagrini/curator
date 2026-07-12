/**
 * CLI entry for the scheduled radar scan (`pnpm scan`). Prints a human summary and
 * the full report as JSON, then exits non-zero on failure. Wire the cadence
 * externally (CI schedule / cron) — this job is just runnable on demand.
 */
import { formatScanReport, runScan } from './scan.js';

runScan()
  .then((report) => {
    console.log(formatScanReport(report));
    console.log(JSON.stringify(report, null, 2));
  })
  .catch((err: unknown) => {
    console.error('scan failed:', err);
    process.exitCode = 1;
  });
