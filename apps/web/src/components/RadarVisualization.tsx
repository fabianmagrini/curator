import type { RadarRing, Technology } from '@curator/shared';
import { QUADRANTS, RADAR_RINGS, categoryQuadrant } from '@curator/shared';
import { cn } from '../lib/utils.js';

interface ProposedMove {
  technologyId: string;
  fromRing: RadarRing;
  toRing: RadarRing;
}

interface RadarVisualizationProps {
  technologies: readonly Technology[];
  proposedMove?: ProposedMove;
  /** Currently selected technology (highlighted). */
  selectedId?: string;
  /** When provided, chips become buttons that select a technology. */
  onSelect?: (technologyId: string) => void;
  /** When set, emphasizes the matching ring row (driven by the Copilot action). */
  highlightedRing?: RadarRing | null;
}

/** Read-only radar: rings (rows) × quadrants (columns), with selection + proposed move. */
export function RadarVisualization({
  technologies,
  proposedMove,
  selectedId,
  onSelect,
  highlightedRing,
}: RadarVisualizationProps) {
  const quadrants = QUADRANTS.filter((q) =>
    technologies.some((tech) => categoryQuadrant(tech.category) === q),
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
            <th scope="col" className="p-2">
              Ring
            </th>
            {quadrants.map((q) => (
              <th key={q} scope="col" className="p-2 font-medium">
                {q}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RADAR_RINGS.map((ring) => (
            <tr
              key={ring}
              className={cn(
                'border-t border-gray-200 dark:border-gray-700',
                highlightedRing === ring && 'bg-amber-50 dark:bg-amber-950/40',
              )}
            >
              <th scope="row" className="p-2 text-left align-top font-semibold">
                {ring}
              </th>
              {quadrants.map((q) => (
                <td key={q} className="p-2 align-top">
                  <div className="flex flex-wrap gap-1">
                    {technologies
                      .filter(
                        (tech) =>
                          tech.currentRing === ring && categoryQuadrant(tech.category) === q,
                      )
                      .map((tech) => {
                        const moving = proposedMove?.technologyId === tech.id;
                        const selected = selectedId === tech.id;
                        const label = `${tech.name}${moving ? ` → ${proposedMove.toRing}` : ''}`;
                        const className = cn(
                          'rounded px-1.5 py-0.5 text-xs',
                          moving
                            ? 'bg-emerald-100 font-semibold text-emerald-800 ring-1 ring-emerald-400'
                            : selected
                              ? 'bg-sky-100 font-semibold text-sky-800 ring-1 ring-sky-400'
                              : 'bg-gray-100 dark:bg-gray-800',
                        );

                        return onSelect ? (
                          <button
                            key={tech.id}
                            type="button"
                            onClick={() => onSelect(tech.id)}
                            className={cn(className, 'cursor-pointer')}
                          >
                            {label}
                          </button>
                        ) : (
                          <span key={tech.id} className={className}>
                            {label}
                          </span>
                        );
                      })}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
