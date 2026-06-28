import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import { RADAR_RINGS, SEED_TECHNOLOGIES, findTechnology, type RadarRing } from '@curator/shared';

interface CopilotBindingsProps {
  /** Current radar selection, exposed to the agent and updated by its actions. */
  selectedId: string;
  onSelectTechnology: (technologyId: string) => void;
  onHighlightRing: (ring: RadarRing | null) => void;
}

function resolveTechnologyId(query: string): string | undefined {
  const byId = findTechnology(query);
  if (byId) return byId.id;
  const q = query.trim().toLowerCase();
  return SEED_TECHNOLOGIES.find((tech) => tech.name.toLowerCase() === q)?.id;
}

/**
 * The CopilotKit surface: exposes radar/selection state to the agent
 * (`useCopilotReadable`) and lets it drive UI navigation (`useCopilotAction`).
 * Rendered only when the runtime is enabled, so its hooks always run inside the
 * `<CopilotKit>` provider and `App` stays provider-free (ADR-0003, ADR-0015).
 */
export function CopilotBindings({
  selectedId,
  onSelectTechnology,
  onHighlightRing,
}: CopilotBindingsProps) {
  useCopilotReadable({
    description: 'Technologies on the radar, each with its current ring and category.',
    value: SEED_TECHNOLOGIES,
  });
  useCopilotReadable({
    description: 'The id of the currently selected technology.',
    value: selectedId,
  });

  useCopilotAction({
    name: 'selectTechnology',
    description: 'Select a technology on the radar by its id or name.',
    parameters: [
      { name: 'technology', type: 'string', description: 'Technology id or name', required: true },
    ],
    handler: ({ technology }) => {
      const id = resolveTechnologyId(String(technology));
      if (!id) return `No technology matching "${technology}".`;
      onSelectTechnology(id);
      return `Selected ${findTechnology(id)?.name ?? id}.`;
    },
  });

  useCopilotAction({
    name: 'highlightRing',
    description: 'Highlight one radar ring (Adopt, Trial, Assess, Hold), or "none" to clear it.',
    parameters: [
      {
        name: 'ring',
        type: 'string',
        description: 'Adopt | Trial | Assess | Hold | none',
        required: true,
      },
    ],
    handler: ({ ring }) => {
      const match = RADAR_RINGS.find((r) => r.toLowerCase() === String(ring).trim().toLowerCase());
      onHighlightRing(match ?? null);
      return match ? `Highlighted the ${match} ring.` : 'Cleared the ring highlight.';
    },
  });

  return (
    <CopilotSidebar
      labels={{
        title: 'Radar Copilot',
        initial: 'Ask about the radar, or try “select Kafka” or “highlight the Trial ring”.',
      }}
    />
  );
}
