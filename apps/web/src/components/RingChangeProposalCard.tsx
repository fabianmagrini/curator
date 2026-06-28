import type { RingChangeProposalCardPayload } from '@curator/shared';

/**
 * The Consensus Agent's ring-change proposal (display-only). The actionable HITL
 * controls live in `ApprovalCard`, since approval is brokered by the gateway.
 */
export function RingChangeProposalCard({ payload }: { payload: RingChangeProposalCardPayload }) {
  const { proposal } = payload;

  return (
    <div className="rounded-lg border-2 border-emerald-500/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{proposal.technologyName}</h3>
        <span className="text-sm text-gray-500">
          confidence {Math.round(proposal.confidence * 100)}%
        </span>
      </div>

      <p className="mt-1 text-sm">
        Proposed move: <strong>{proposal.fromRing}</strong> → <strong>{proposal.toRing}</strong>
      </p>

      {proposal.keyDrivers.length > 0 && (
        <p className="mt-2 text-sm">
          <span className="font-medium text-emerald-700 dark:text-emerald-400">Drivers:</span>{' '}
          {proposal.keyDrivers.join(', ')}
        </p>
      )}
      {proposal.keyRisks.length > 0 && (
        <p className="mt-1 text-sm">
          <span className="font-medium text-amber-700 dark:text-amber-400">Risks:</span>{' '}
          {proposal.keyRisks.join(', ')}
        </p>
      )}

      <p className="mt-2 text-xs text-gray-500">Next review: {proposal.reviewDate}</p>
    </div>
  );
}
