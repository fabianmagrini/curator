import type { DimensionEvidencePanelPayload } from '@curator/shared';

/** Renders one evaluation agent's dimension score, summary, and source citations. */
export function DimensionEvidencePanel({ payload }: { payload: DimensionEvidencePanelPayload }) {
  const pct = Math.round(payload.score * 100);

  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{payload.dimension}</h3>
        <span className="text-sm tabular-nums text-gray-500">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded bg-gray-100 dark:bg-gray-800">
        <div className="h-1.5 rounded bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm">{payload.summary}</p>
      {payload.citations.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-gray-500">
          {payload.citations.map((citation, i) => (
            <li key={`${citation.source}-${i}`}>
              <span className="rounded bg-gray-100 px-1 py-0.5 font-mono dark:bg-gray-800">
                {citation.source}
              </span>{' '}
              {citation.url ? (
                <a className="underline" href={citation.url} target="_blank" rel="noreferrer">
                  {citation.label}
                </a>
              ) : (
                citation.label
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
