import type { AgentDebateViewPayload } from '@curator/shared';

/** Side-by-side agent positions, points of disagreement, and how consensus resolved. */
export function AgentDebateView({ payload }: { payload: AgentDebateViewPayload }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600">
      <h3 className="font-semibold">Agent debate</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {payload.positions.map((position) => (
          <li key={position.dimension} className="flex gap-2">
            <span className="w-28 shrink-0 font-medium">{position.dimension}</span>
            {position.proposedRing && (
              <span className="shrink-0 rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">
                {position.proposedRing}
              </span>
            )}
            <span className="text-gray-600 dark:text-gray-300">{position.stance}</span>
          </li>
        ))}
      </ul>

      {payload.pointsOfDisagreement.length > 0 && (
        <div className="mt-2 text-sm">
          <span className="font-medium text-amber-700 dark:text-amber-400">Disagreement:</span>
          <ul className="ml-4 list-disc">
            {payload.pointsOfDisagreement.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {payload.resolution && (
        <p className="mt-2 text-sm italic text-gray-500">{payload.resolution}</p>
      )}
    </div>
  );
}
