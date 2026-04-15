/**
 * Tests for the Landing page.
 * Covers: hero heading, student/recruiter cards, feature pills.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Landing } from '../Landing';

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}

describe('Landing page', () => {
  it('renders hero heading with Saathi', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Meet Saathi/)).toBeInTheDocument();
  });

  it('renders "Talk to Saathi" card', () => {
    renderLanding();
    expect(screen.getByText('Talk to Saathi')).toBeInTheDocument();
  });

  it('student card links to /builder', () => {
    renderLanding();
    const card = screen.getByText('Start Talking').closest('a');
    expect(card).toHaveAttribute('href', '/builder');
  });

  it('recruiter card links to /employer', () => {
    renderLanding();
    const recruiterLink = screen.getAllByRole('link').find(
      (el) => el.getAttribute('href') === '/employer',
    );
    expect(recruiterLink).toBeTruthy();
  });

  it('renders feature pills', () => {
    renderLanding();
    expect(screen.getByText('Conversational Resume Building')).toBeInTheDocument();
    expect(screen.getByText('Voice Input in 11 Languages')).toBeInTheDocument();
    expect(screen.getByText('Wellbeing Score for Every Job')).toBeInTheDocument();
    expect(screen.getByText('Research-Backed Insights')).toBeInTheDocument();
    expect(screen.getByText('Zero Data Leaves Your Device')).toBeInTheDocument();
  });

  it('renders Start Talking CTA', () => {
    renderLanding();
    expect(screen.getByText('Start Talking')).toBeInTheDocument();
  });
});
