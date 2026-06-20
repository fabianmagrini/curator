import { useState } from 'react';
import type { ApprovalDecision, RingChangeProposalCardPayload } from '@curator/shared';
import { cn } from '../lib/utils.js';

const DECISIONS: readonly ApprovalDecision[] = ['approve', 'modify', 'reject'];

/**
 * The Consensus Agent's ring-change proposal with HITL controls. Approval
 * brokering is not yet wired (Phase 2) — the buttons record a local-only choice.
 */
export function RingChangeProposalCard({ payload }: { payload: RingChangeProposalCardPayload }) {
  const { proposal } = payload;
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);

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

      <div className="mt-3 flex gap-2">
        {DECISIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDecision(d)}
            className={cn(
              'rounded-md border px-3 py-1 text-sm capitalize',
              decision === d
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-gray-300 dark:border-gray-600',
            )}
          >
            {d}
          </button>
        ))}
      </div>
      {decision && (
        <p className="mt-2 text-xs text-amber-600">
          Recorded “{decision}” locally — approval brokering arrives in Phase 2 (not persisted).
        </p>
      )}
    </div>
  );
}
