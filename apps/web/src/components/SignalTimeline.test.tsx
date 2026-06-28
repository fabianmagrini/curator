import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { SignalTimelinePayload } from '@curator/shared';
import { SignalTimeline } from './SignalTimeline.js';

const payload: SignalTimelinePayload = {
  component: 'SignalTimeline',
  technologyId: 'grpc',
  points: [
    { timestamp: '2026-03-01T00:00:00.000Z', source: 'repo', strength: 0.9 },
    { timestamp: '2026-05-20T00:00:00.000Z', source: 'metrics', strength: 0.7 },
  ],
};

describe('SignalTimeline', () => {
  it('renders signal rows with dates and sources', () => {
    render(<SignalTimeline payload={payload} />);

    expect(screen.getByText('repo')).toBeInTheDocument();
    expect(screen.getByText('2026-03-01')).toBeInTheDocument();
  });

  it('renders an empty state when there are no signals', () => {
    render(<SignalTimeline payload={{ ...payload, points: [] }} />);
    expect(screen.getByText(/no signals/i)).toBeInTheDocument();
  });
});
