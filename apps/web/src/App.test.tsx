import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.js';

describe('App', () => {
  it('renders the title and the evaluate button for the default technology', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /tech radar curator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /evaluate grpc/i })).toBeInTheDocument();
  });

  it('renders the read-only radar with selectable technology chips', () => {
    render(<App />);

    // Chips are buttons (named exactly by tech), distinct from the "Evaluate …" button.
    expect(screen.getByRole('button', { name: 'gRPC' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'React' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Adopt' })).toBeInTheDocument();
  });

  it('offers a technology picker', () => {
    render(<App />);
    expect(screen.getByRole('combobox', { name: /technology/i })).toBeInTheDocument();
  });
});
