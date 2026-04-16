import { describe, it, expect, vi } from 'vitest';
import { isSpeechSupported, createSpeechInput } from '../voice/speechInput';

// Mock SpeechRecognition
class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

describe('speechInput', () => {
  it('detects speech support', () => {
    // In JSDOM, SpeechRecognition is not available
    expect(isSpeechSupported()).toBe(false);
  });

  it('createSpeechInput returns null when unsupported', () => {
    const input = createSpeechInput('en-IN');
    expect(input).toBeNull();
  });

  it('createSpeechInput returns SpeechInput when API is available', () => {
    // Monkey-patch
    (globalThis as any).webkitSpeechRecognition = MockSpeechRecognition;
    const input = createSpeechInput('en-IN');
    expect(input).not.toBeNull();
    expect(input!.isListening).toBe(false);
    delete (globalThis as any).webkitSpeechRecognition;
  });
});
