import type { SignalTimelinePayload } from '@curator/shared';

/** Chronological signal strengths for a technology, broken down by source. */
export function SignalTimeline({ payload }: { payload: SignalTimelinePayload }) {
  if (payload.points.length === 0) {
    return <p className="text-sm text-gray-500">No signals ingested for this technology.</p>;
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <h3 className="font-semibold">Signals</h3>
      <ul className="mt-2 space-y-1">
        {payload.points.map((point, i) => (
          <li key={`${point.source}-${i}`} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 tabular-nums text-gray-500">
              {point.timestamp.slice(0, 10)}
            </span>
            <span className="w-16 shrink-0 rounded bg-gray-100 px-1 py-0.5 font-mono dark:bg-gray-800">
              {point.source}
            </span>
            <span className="h-1.5 flex-1 rounded bg-gray-100 dark:bg-gray-800">
              <span
                className="block h-1.5 rounded bg-sky-500"
                style={{ width: `${Math.round(point.strength * 100)}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
