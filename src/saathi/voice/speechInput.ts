// /mnt/experiments/astha-resume/src/saathi/voice/speechInput.ts

// Minimal Web Speech API shape. lib.dom does not yet ship these in
// TS 5.x ES2023 lib, so we declare just what we use.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [i: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  readonly [i: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface SpeechInput {
  start: () => void;
  stop: () => void;
  abort: () => void;
  readonly isListening: boolean;
  onResult: ((transcript: string, isFinal: boolean) => void) | null;
  onError: ((error: string) => void) | null;
  onEnd: (() => void) | null;
  setLang: (lang: string) => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** Check if Web Speech API is available */
export function isSpeechSupported(): boolean {
  return getSpeechRecognitionClass() !== null;
}

/** Create a speech input instance. Returns null if unsupported. */
export function createSpeechInput(lang: string): SpeechInput | null {
  const SpeechRecognitionClass = getSpeechRecognitionClass();
  if (!SpeechRecognitionClass) return null;

  const recognition = new SpeechRecognitionClass();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;

  let listening = false;

  const input: SpeechInput = {
    get isListening() {
      return listening;
    },
    onResult: null,
    onError: null,
    onEnd: null,

    start() {
      if (listening) return;
      try {
        recognition.start();
        listening = true;
      } catch {
        // Already started or other error
      }
    },

    stop() {
      if (!listening) return;
      recognition.stop();
      listening = false;
    },

    abort() {
      recognition.abort();
      listening = false;
    },

    setLang(newLang: string) {
      recognition.lang = newLang;
    },
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    if (!input.onResult) return;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      input.onResult(result[0].transcript, result.isFinal);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    // 'no-speech' and 'aborted' are not real errors
    if (event.error === 'no-speech' || event.error === 'aborted') return;
    input.onError?.(event.error);
  };

  recognition.onend = () => {
    listening = false;
    input.onEnd?.();
  };

  return input;
}
