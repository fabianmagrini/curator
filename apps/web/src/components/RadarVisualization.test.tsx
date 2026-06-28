import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
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

  it('calls onSelect when a chip is clicked', () => {
    const onSelect = vi.fn();
    render(<RadarVisualization technologies={SEED_TECHNOLOGIES} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'React' }));
    expect(onSelect).toHaveBeenCalledWith('react');
  });
});
