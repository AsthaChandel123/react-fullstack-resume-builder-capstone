import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaathiChat } from '../components/SaathiChat';

vi.mock('@/store/persist', () => ({
  createIndexedDBStorage: () => ({
    load: () => Promise.resolve(undefined),
    save: () => {},
  }),
}));

// Mock speech API as unavailable in JSDOM
vi.mock('../voice/speechInput', () => ({
  isSpeechSupported: () => false,
  createSpeechInput: () => null,
}));

describe('SaathiChat', () => {
  it('renders greeting message on mount', () => {
    render(<SaathiChat />);
    // Greeting contains "Saathi" label
    expect(screen.getByText('Saathi')).toBeInTheDocument();
  });

  it('has a text input field', () => {
    render(<SaathiChat />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('has a send button', () => {
    render(<SaathiChat />);
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('sends message on form submit', () => {
    render(<SaathiChat />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'My name is Rahul' } });
    fireEvent.submit(input.closest('form')!);
    // User message should appear
    expect(screen.getByText('My name is Rahul')).toBeInTheDocument();
    // Saathi should respond with name acknowledgment
    expect(screen.getByText(/Rahul/)).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    render(<SaathiChat />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('clears input after send', () => {
    render(<SaathiChat />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);
    expect(input.value).toBe('');
  });
});
