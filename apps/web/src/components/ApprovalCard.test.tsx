import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import type { RingChangeProposal } from '@curator/shared';
import { ApprovalCard } from './ApprovalCard.js';

const proposal: RingChangeProposal = {
  technologyId: 'grpc',
  technologyName: 'gRPC',
  fromRing: 'Assess',
  toRing: 'Trial',
  confidence: 0.86,
  keyDrivers: [],
  keyRisks: [],
  reviewDate: '2026-12-01',
};

describe('ApprovalCard', () => {
  it('reports the decision with the entered rationale', () => {
    const onDecision = vi.fn();
    render(<ApprovalCard proposal={proposal} onDecision={onDecision} />);

    fireEvent.change(screen.getByRole('textbox', { name: /rationale/i }), {
      target: { value: 'looks good' },
    });
    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    expect(onDecision).toHaveBeenCalledWith('approve', {
      rationale: 'looks good',
      dissent: undefined,
    });
  });

  it('disables the controls while busy', () => {
    render(<ApprovalCard proposal={proposal} busy onDecision={vi.fn()} />);
    expect(screen.getByRole('button', { name: /reject/i })).toBeDisabled();
  });
});
