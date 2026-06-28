import { useState } from 'react';
import type { ApprovalDecision, RingChangeProposal } from '@curator/shared';
import type { ApprovalInput } from '../lib/agui-client.js';
import { cn } from '../lib/utils.js';

const DECISIONS: readonly ApprovalDecision[] = ['approve', 'modify', 'reject'];

interface ApprovalCardProps {
  proposal: RingChangeProposal;
  busy?: boolean;
  onDecision: (decision: ApprovalDecision, input: ApprovalInput) => void;
}

/**
 * HITL approval surface (spec §10): editable rationale + dissent and the
 * Approve / Modify / Reject controls. The decision is brokered by the gateway.
 */
export function ApprovalCard({ proposal, busy, onDecision }: ApprovalCardProps) {
  const [rationale, setRationale] = useState('');
  const [dissent, setDissent] = useState('');

  const decide = (decision: ApprovalDecision): void => {
    onDecision(decision, {
      rationale: rationale.trim() || undefined,
      dissent: dissent.trim() || undefined,
    });
  };

  return (
    <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      <h3 className="font-semibold">Approval required (HITL)</h3>
      <p className="mt-1 text-sm">
        {proposal.technologyName}: <strong>{proposal.fromRing}</strong> →{' '}
        <strong>{proposal.toRing}</strong> — a human must approve before this is published.
      </p>

      <label htmlFor="rationale" className="mt-3 block text-xs font-medium">
        Rationale
      </label>
      <textarea
        id="rationale"
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded border border-amber-300 bg-white p-1 text-sm text-gray-900 dark:border-amber-700 dark:bg-gray-900 dark:text-gray-100"
      />

      <label htmlFor="dissent" className="mt-2 block text-xs font-medium">
        Dissent (optional)
      </label>
      <input
        id="dissent"
        value={dissent}
        onChange={(e) => setDissent(e.target.value)}
        className="mt-1 w-full rounded border border-amber-300 bg-white p-1 text-sm text-gray-900 dark:border-amber-700 dark:bg-gray-900 dark:text-gray-100"
      />

      <div className="mt-3 flex gap-2">
        {DECISIONS.map((decision) => (
          <button
            key={decision}
            type="button"
            disabled={busy}
            onClick={() => decide(decision)}
            className={cn(
              'rounded-md border px-3 py-1 text-sm capitalize',
              decision === 'approve'
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-amber-400 bg-white text-amber-900 dark:bg-gray-900 dark:text-amber-100',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {decision}
          </button>
        ))}
      </div>
    </div>
  );
}
