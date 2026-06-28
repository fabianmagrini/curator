import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { RingChangeProposalCardPayload } from '@curator/shared';
import { RingChangeProposalCard } from './RingChangeProposalCard.js';

const payload: RingChangeProposalCardPayload = {
  component: 'RingChangeProposalCard',
  proposal: {
    technologyId: 'grpc',
    technologyName: 'gRPC',
    fromRing: 'Assess',
    toRing: 'Trial',
    confidence: 0.86,
    keyDrivers: ['Open source, modest migration cost'],
    keyRisks: ['Weaker observability and debuggability than REST'],
    reviewDate: '2026-12-01',
  },
};

describe('RingChangeProposalCard', () => {
  it('renders the proposal details (display-only)', () => {
    render(<RingChangeProposalCard payload={payload} />);

    expect(screen.getByRole('heading', { name: 'gRPC' })).toBeInTheDocument();
    expect(screen.getByText('Assess')).toBeInTheDocument();
    expect(screen.getByText('Trial')).toBeInTheDocument();
    expect(screen.getByText(/open source, modest migration cost/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-12-01/)).toBeInTheDocument();

    // Actions live in ApprovalCard, not here.
    expect(screen.queryByRole('button')).toBeNull();
  });
});
