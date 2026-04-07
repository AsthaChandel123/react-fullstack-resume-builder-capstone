import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/store/persist', () => ({
  createIndexedDBStorage: () => ({
    load: () => Promise.resolve(undefined),
    save: () => {},
  }),
}));

vi.mock('@/store/resumeStore', () => ({
  useResumeStore: (selector: any) =>
    selector({
      resume: {
        personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '' },
        summary: '',
        sections: [],
      },
    }),
}));

// Lazy import to allow mocking
const { CandidateDashboard } = await import('../CandidateDashboard');

describe('CandidateDashboard', () => {
  it('renders the dashboard heading in empty state', () => {
    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText('Your Career Health')).toBeInTheDocument();
  });

  it('shows quick setup form in empty state', () => {
    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText('Quick setup')).toBeInTheDocument();
    expect(screen.getByText('Show my career health')).toBeInTheDocument();
  });

  it('shows score cards when URL params are provided', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard?city=Bangalore&salary=800000&commute=30']}>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText('Skills Match')).toBeInTheDocument();
    expect(screen.getByText('Wellbeing Score')).toBeInTheDocument();
    expect(screen.getByText('Overall Fit')).toBeInTheDocument();
  });

  it('shows Life Impact Breakdown with URL params', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard?city=Bangalore&salary=800000&commute=30']}>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText('Life Impact Breakdown')).toBeInTheDocument();
  });

  it("shows Saathi's Take section with URL params", () => {
    render(
      <MemoryRouter initialEntries={['/dashboard?city=Bangalore&salary=800000&commute=30']}>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText("Saathi's Take")).toBeInTheDocument();
  });
});
