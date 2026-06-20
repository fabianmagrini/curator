import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.js';

describe('App', () => {
  it('renders the title and the run button', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /tech radar curator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run evaluation/i })).toBeInTheDocument();
  });
});
