import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/store/persist', () => ({
  createIndexedDBStorage: () => ({
    load: () => Promise.resolve(undefined),
    save: () => {},
  }),
}));

// Lazy import to allow mocking
const { CandidateDashboard } = await import('../CandidateDashboard');

describe('CandidateDashboard', () => {
  it('renders the dashboard heading', () => {
    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText('Your Career Health')).toBeInTheDocument();
  });

  it('shows three score cards', () => {
    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText('Skills Match')).toBeInTheDocument();
    expect(screen.getByText('Wellbeing Score')).toBeInTheDocument();
    expect(screen.getByText('Overall Fit')).toBeInTheDocument();
  });

  it('shows Life Impact Breakdown heading', () => {
    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText('Life Impact Breakdown')).toBeInTheDocument();
  });

  it("shows Saathi's Take section", () => {
    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText("Saathi's Take")).toBeInTheDocument();
  });
});
