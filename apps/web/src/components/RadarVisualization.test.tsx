import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SEED_TECHNOLOGIES } from '@curator/shared';
import { RadarVisualization } from './RadarVisualization.js';

describe('RadarVisualization', () => {
  it('renders ring rows and seeded technologies', () => {
    render(<RadarVisualization technologies={SEED_TECHNOLOGIES} />);

    expect(screen.getByRole('rowheader', { name: 'Adopt' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Hold' })).toBeInTheDocument();
    expect(screen.getByText('gRPC')).toBeInTheDocument();
  });

  it('flags a proposed move on the affected technology', () => {
    render(
      <RadarVisualization
        technologies={SEED_TECHNOLOGIES}
        proposedMove={{ technologyId: 'grpc', fromRing: 'Assess', toRing: 'Trial' }}
      />,
    );

    expect(screen.getByText(/gRPC → Trial/)).toBeInTheDocument();
  });
});
