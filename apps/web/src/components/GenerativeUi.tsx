import type { GenerativeUiPayload } from '@curator/shared';
import { DimensionEvidencePanel } from './DimensionEvidencePanel.js';
import { RingChangeProposalCard } from './RingChangeProposalCard.js';

/**
 * Maps an agent-emitted generative-UI payload to its React component. This is the
 * generative-UI surface; CopilotKit will host it in a later web-deepening slice.
 */
export function GenerativeUi({ payload }: { payload: GenerativeUiPayload }) {
  switch (payload.component) {
    case 'DimensionEvidencePanel':
      return <DimensionEvidencePanel payload={payload} />;
    case 'RingChangeProposalCard':
      return <RingChangeProposalCard payload={payload} />;
    default:
      return (
        <div className="text-xs text-gray-400">Unsupported component: {payload.component}</div>
      );
  }
}
