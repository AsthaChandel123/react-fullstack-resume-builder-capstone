/**
 * Tests for Layout, Navbar, and Footer components.
 * Covers: branding, navigation links, theme toggle, skip-to-content, logo.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../ai/models/webllm', () => ({
  isModelReady: () => false,
}));

// Ensure localStorage exists before component imports
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  length: 0,
  key: () => null,
});

import { Layout } from '../Layout';

describe('Layout with Navbar and Footer', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add('light');
    // Ensure localStorage is available in jsdom
    if (!window.localStorage) {
      const store: Record<string, string> = {};
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => { store[k] = v; },
          removeItem: (k: string) => { delete store[k]; },
          clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        },
        writable: true,
      });
    }
  });

  function renderLayout() {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    );
  }

  it('renders Navbar with "ResumeAI" text', () => {
    renderLayout();
    expect(screen.getAllByText('ResumeAI').length).toBeGreaterThan(0);
  });

  it('renders Footer with "Astha Chandel"', () => {
    renderLayout();
    expect(screen.getByText('Astha Chandel')).toBeInTheDocument();
  });

  it('renders Shoolini University logo', () => {
    renderLayout();
    const logos = screen.getAllByAltText(/Shoolini University/i);
    expect(logos.length).toBeGreaterThan(0);
  });

  it('theme toggle button present', () => {
    renderLayout();
    const toggleBtn = screen.getByRole('button', { name: /switch to/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('skip-to-content link present', () => {
    renderLayout();
    expect(screen.getByText('Skip to content')).toBeInTheDocument();
  });

  it('navigation has mode toggle and context links', () => {
    renderLayout();
    // Mode toggle buttons
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Employer')).toBeInTheDocument();
    // Default student mode shows builder link
    expect(screen.getByText('Resume Builder')).toBeInTheDocument();
    expect(screen.getByText('My Applications')).toBeInTheDocument();
  });

  it('main content area has correct id', () => {
    const { container } = renderLayout();
    expect(container.querySelector('#main-content')).toBeInTheDocument();
  });
});
