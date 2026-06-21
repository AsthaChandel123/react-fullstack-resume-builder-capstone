// Server-side audio playback for the Gemini Live API.
//
// Gemini Live ships TTS as 24 kHz mono PCM16 little-endian inside
// base64-encoded `inlineData` parts. We decode each chunk to Float32,
// drop it into the head of an AudioContext at 24 kHz, and schedule
// playback contiguously so chunks join seamlessly. A barge-in flush
// (called when the server reports `interrupted: true`) cancels every
// pending source so the model can stop mid-sentence.

export interface AudioPlaybackOptions {
  /** Server sample rate. Gemini Live native audio is 24 kHz. */
  sampleRate?: number;
  /** Fired when the queue empties (model finished speaking). */
  onIdle?: () => void;
  /** Fired when the queue starts producing sound. */
  onActive?: () => void;
}

export interface AudioPlayback {
  /** Lazily build / resume the AudioContext (must be called from a user gesture). */
  prime: () => Promise<void>;
  /** Enqueue one base64 PCM16 chunk. */
  enqueueBase64: (base64: string) => void;
  /** Drop everything that hasn't started yet, stop anything in flight. */
  flush: () => void;
  /** Tear everything down. */
  close: () => Promise<void>;
  /** Whether something is currently playing or scheduled. */
  isPlaying: () => boolean;
}

const DEFAULT_RATE = 24000;

/**
 * Decode base64 to a Uint8Array. Uses atob — safe for any Gemini-sent
 * audio chunk which is always valid base64.
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/**
 * Convert little-endian PCM16 bytes to a Float32Array in [-1, 1].
 */
function pcm16ToFloat32(bytes: Uint8Array): Float32Array<ArrayBuffer> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const len = Math.floor(bytes.byteLength / 2);
  const buf = new ArrayBuffer(len * 4);
  const out = new Float32Array(buf);
  for (let i = 0; i < len; i++) {
    const s = view.getInt16(i * 2, true);
    out[i] = s < 0 ? s / 0x8000 : s / 0x7fff;
  }
  return out;
}

export function createAudioPlayback(
  opts: AudioPlaybackOptions = {},
): AudioPlayback {
  const sampleRate = opts.sampleRate ?? DEFAULT_RATE;
  let context: AudioContext | null = null;
  let nextStart = 0;
  let activeSources = new Set<AudioBufferSourceNode>();
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let wasIdle = true;

  function getCtx(): AudioContext | null {
    return context;
  }

  function scheduleIdleCheck(): void {
    if (idleTimer) clearTimeout(idleTimer);
    const ctx = getCtx();
    if (!ctx) return;
    const remainingMs = Math.max(0, (nextStart - ctx.currentTime) * 1000);
    idleTimer = setTimeout(() => {
      idleTimer = null;
      if (activeSources.size === 0 && !wasIdle) {
        wasIdle = true;
        opts.onIdle?.();
      }
    }, remainingMs + 60);
  }

  async function prime(): Promise<void> {
    if (!context) {
      const Ctx =
        (window as unknown as { AudioContext?: typeof AudioContext })
          .AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) throw new Error('AudioContext not supported');
      context = new Ctx({ sampleRate });
    }
    if (context.state === 'suspended') {
      await context.resume().catch(() => {});
    }
    nextStart = context.currentTime;
  }

  function enqueueBase64(base64: string): void {
    if (!context) return; // caller must prime() first
    const ctx = context;
    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(base64);
    } catch {
      return;
    }
    if (bytes.byteLength === 0) return;
    const samples = pcm16ToFloat32(bytes);
    if (samples.length === 0) return;

    const buffer = ctx.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(samples, 0);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, nextStart);
    src.start(startAt);
    nextStart = startAt + buffer.duration;

    if (wasIdle) {
      wasIdle = false;
      opts.onActive?.();
    }
    activeSources.add(src);
    src.onended = () => {
      activeSources.delete(src);
      if (activeSources.size === 0) {
        scheduleIdleCheck();
      }
    };
    scheduleIdleCheck();
  }

  function flush(): void {
    const ctx = getCtx();
    for (const src of activeSources) {
      try {
        src.onended = null;
        src.stop();
      } catch {
        /* already stopped */
      }
      try {
        src.disconnect();
      } catch {
        /* ignore */
      }
    }
    activeSources = new Set();
    if (ctx) nextStart = ctx.currentTime;
    if (!wasIdle) {
      wasIdle = true;
      opts.onIdle?.();
    }
  }

  async function close(): Promise<void> {
    flush();
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    if (context) {
      try {
        await context.close();
      } catch {
        /* ignore */
      }
      context = null;
    }
  }

  return {
    prime,
    enqueueBase64,
    flush,
    close,
    isPlaying: () => activeSources.size > 0,
  };
}
