import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SaathiChat } from '../components/SaathiChat';

vi.mock('@/store/persist', () => ({
  createIndexedDBStorage: () => ({
    load: () => Promise.resolve(undefined),
    save: () => {},
  }),
}));

vi.mock('@/store/resumeStore', () => ({
  useResumeStore: Object.assign(
    () => ({}),
    {
      getState: () => ({
        resume: {
          personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '' },
          summary: '',
          sections: [],
        },
        setPersonal: vi.fn(),
        setSummary: vi.fn(),
        addEntry: vi.fn(),
        removeEntry: vi.fn(),
      }),
    },
  ),
}));

// Mock speech API as unavailable in JSDOM
vi.mock('../voice/speechInput', () => ({
  isSpeechSupported: () => false,
  createSpeechInput: () => null,
}));

// Mock slotMachine to avoid heavy dependencies
vi.mock('../engine/slotMachine', () => {
  let counter = 0;
  const msgId = () => `msg-${++counter}-${Date.now()}`;
  const createConversation = () => ({
    messages: [
      {
        id: msgId(),
        role: 'saathi' as const,
        text: 'Hello! I am Saathi, your resume building companion.',
        timestamp: Date.now(),
      },
    ],
    slots: { phase: 'warmup', values: new Map() },
    filledPercentage: 0,
    requiredFilledPercentage: 0,
    isComplete: false,
  });
  return {
    createConversation,
    processUserInput: (prev: any, text: string) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { id: msgId(), role: 'user', text, timestamp: Date.now() },
        { id: msgId(), role: 'saathi', text: `Got it: ${text}`, timestamp: Date.now() },
      ],
      filledPercentage: prev.filledPercentage + 5,
    }),
    loadFromStorage: () => null,
    clearStorage: vi.fn(),
  };
});

vi.mock('../engine/resumeGenerator', () => ({
  slotsToResume: () => ({
    personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '' },
    summary: '',
    sections: [],
  }),
}));

vi.mock('../engine/responseBank', () => ({
  getResponse: (_key: string) => 'Keep going!',
  getGreeting: () => 'Hello! I am Saathi.',
}));

vi.mock('../components/ChatBubble', () => ({
  ChatBubble: ({ message }: { message: { text: string; role: string } }) => (
    <div data-testid={`bubble-${message.role}`}>{message.text}</div>
  ),
}));

vi.mock('../components/VoiceButton', () => ({
  VoiceButton: () => <button type="button" aria-label="Voice input">Mic</button>,
}));

vi.mock('../components/SlotProgress', () => ({
  SlotProgress: ({ filledPercentage }: { filledPercentage: number }) => (
    <div role="progressbar" aria-valuenow={filledPercentage} aria-label="Progress" />
  ),
  crossedMilestone: () => null,
}));

// JSDOM doesn't have scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('SaathiChat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders greeting message on mount', () => {
    render(<SaathiChat />);
    expect(screen.getByText('Hello! I am Saathi, your resume building companion.')).toBeInTheDocument();
  });

  it('has a text input field', () => {
    render(<SaathiChat />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('has a send button', () => {
    render(<SaathiChat />);
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('sends message on form submit and shows reply after typing delay', () => {
    render(<SaathiChat />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'My name is Rahul' } });
    fireEvent.submit(input.closest('form')!);

    // User message appears immediately
    expect(screen.getByText('My name is Rahul')).toBeInTheDocument();

    // Saathi reply appears after typing delay
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Got it: My name is Rahul')).toBeInTheDocument();
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
