import {
  CopilotSidebar,
  useAgentContext,
  useFrontendTool,
  type JsonSerializable,
} from '@copilotkit/react-core/v2';
import { z } from 'zod';
import { RADAR_RINGS, SEED_TECHNOLOGIES, findTechnology, type RadarRing } from '@curator/shared';

interface CopilotBindingsProps {
  /** Current radar selection, exposed to the agent and updated by its tools. */
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
 * The CopilotKit v2 surface: exposes radar/selection state to the agent
 * (`useAgentContext`) and lets it drive UI navigation via frontend tools
 * (`useFrontendTool`). Rendered only when the runtime is enabled, so its hooks
 * always run inside the `<CopilotKit>` provider and `App` stays provider-free
 * (ADR-0003, ADR-0016).
 */
export function CopilotBindings({
  selectedId,
  onSelectTechnology,
  onHighlightRing,
}: CopilotBindingsProps) {
  useAgentContext({
    description: 'Technologies on the radar, each with its current ring and category.',
    // Seed data is JSON-serializable at runtime; the domain type just lacks an index signature.
    value: SEED_TECHNOLOGIES as unknown as JsonSerializable,
  });
  useAgentContext({
    description: 'The id of the currently selected technology.',
    value: selectedId,
  });

  useFrontendTool({
    name: 'selectTechnology',
    description: 'Select a technology on the radar by its id or name.',
    parameters: z.object({
      technology: z.string().describe('Technology id or name'),
    }),
    handler: async ({ technology }) => {
      const id = resolveTechnologyId(technology);
      if (!id) return `No technology matching "${technology}".`;
      onSelectTechnology(id);
      return `Selected ${findTechnology(id)?.name ?? id}.`;
    },
  });

  useFrontendTool({
    name: 'highlightRing',
    description: 'Highlight one radar ring (Adopt, Trial, Assess, Hold), or "none" to clear it.',
    parameters: z.object({
      ring: z.string().describe('Adopt | Trial | Assess | Hold | none'),
    }),
    handler: async ({ ring }) => {
      const match = RADAR_RINGS.find((r) => r.toLowerCase() === ring.trim().toLowerCase());
      onHighlightRing(match ?? null);
      return match ? `Highlighted the ${match} ring.` : 'Cleared the ring highlight.';
    },
  });

  return <CopilotSidebar defaultOpen={false} />;
}
