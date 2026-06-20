import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.js';

describe('App', () => {
  it('renders the title and the evaluate button', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /tech radar curator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /evaluate grpc/i })).toBeInTheDocument();
  });

  it('renders the read-only radar from seed data', () => {
    render(<App />);

    expect(screen.getByText('gRPC')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    // Ring row headers.
    expect(screen.getByRole('columnheader', { name: 'Ring' })).toBeInTheDocument();
  });
});
