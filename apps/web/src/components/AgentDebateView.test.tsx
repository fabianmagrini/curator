import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AgentDebateViewPayload } from '@curator/shared';
import { AgentDebateView } from './AgentDebateView.js';

const payload: AgentDebateViewPayload = {
  component: 'AgentDebateView',
  technologyId: 'grpc',
  positions: [
    { dimension: 'Value', stance: 'Strong contract safety', proposedRing: 'Adopt' },
    { dimension: 'Operability', stance: 'Weak observability', proposedRing: 'Assess' },
  ],
  pointsOfDisagreement: ['Operability alone points to Assess'],
  resolution: 'Weighted aggregation settled on Trial.',
};

describe('AgentDebateView', () => {
  it('renders positions, disagreement, and resolution', () => {
    render(<AgentDebateView payload={payload} />);

    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText(/operability alone points to assess/i)).toBeInTheDocument();
    expect(screen.getByText(/weighted aggregation settled on trial/i)).toBeInTheDocument();
  });
});
