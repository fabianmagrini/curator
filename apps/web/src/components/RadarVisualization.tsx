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
}

/** Read-only radar: rings (rows) × quadrants (columns), with any proposed move flagged. */
export function RadarVisualization({ technologies, proposedMove }: RadarVisualizationProps) {
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
            <tr key={ring} className="border-t border-gray-200 dark:border-gray-700">
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
                        return (
                          <span
                            key={tech.id}
                            className={cn(
                              'rounded px-1.5 py-0.5 text-xs',
                              moving
                                ? 'bg-emerald-100 font-semibold text-emerald-800 ring-1 ring-emerald-400'
                                : 'bg-gray-100 dark:bg-gray-800',
                            )}
                          >
                            {tech.name}
                            {moving ? ` → ${proposedMove.toRing}` : ''}
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
