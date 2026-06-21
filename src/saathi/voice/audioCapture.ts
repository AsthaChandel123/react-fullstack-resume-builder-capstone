// Mic capture → 16 kHz mono PCM16 frames for the Gemini Live API.
//
// We use an AudioWorklet (loaded from an inline Blob URL so we don't have to
// add a separate worklet file to the bundler) to pull Float32 audio off the
// real-time thread, downsample it to 16 kHz, convert to little-endian PCM16,
// and post 100 ms chunks back to the main thread.
//
// Browser support: AudioWorklet is available on Chrome 66+, Edge 79+,
// Firefox 76+, Safari 14.1+. Requires a secure context (HTTPS or
// localhost). If unavailable we report it via isVoiceCaptureSupported().

export interface AudioCaptureOptions {
  /** Target sample rate the server expects. */
  targetSampleRate?: number;
  /** Frame size in milliseconds. 100ms gives ~6 frames/sec, low overhead. */
  frameMs?: number;
  /** Called with each PCM16 chunk, little-endian. */
  onFrame: (pcm16: Int16Array) => void;
  /** Called with normalized RMS level [0,1] for waveform UI. */
  onLevel?: (level: number) => void;
  /** Called on any unrecoverable capture error. */
  onError?: (error: Error) => void;
}

export interface AudioCapture {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  isMuted: () => boolean;
}

const TARGET_RATE = 16000;
const FRAME_MS = 100;

/**
 * Returns true when mic capture + AudioWorklet are available in this
 * environment. Caller should disable the voice button when this is false.
 */
export function isVoiceCaptureSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.isSecureContext) return false;
  const md = navigator.mediaDevices;
  if (!md || typeof md.getUserMedia !== 'function') return false;
  const Ctx =
    (window as unknown as { AudioContext?: typeof AudioContext })
      .AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return false;
  // AudioWorklet is exposed as a getter on BaseAudioContext.prototype.
  // We cannot READ the getter without an instance (throws "Illegal invocation"),
  // so we only check for the property's existence on the prototype chain.
  return 'audioWorklet' in (Ctx as unknown as { prototype: object }).prototype;
}

// AudioWorkletProcessor source. Runs on the audio thread. We post 16 kHz PCM16
// frames back to the main thread. Downsampling uses simple decimation with
// box averaging — fine for 16 kHz speech going to a far-larger ASR model.
const WORKLET_SOURCE = /* js */ `
class CaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.targetRate = opts.targetRate || 16000;
    this.frameSamples = Math.round(this.targetRate * (opts.frameMs || 100) / 1000);
    this.ratio = sampleRate / this.targetRate;
    this.buf = new Float32Array(this.frameSamples);
    this.bufFill = 0;
    this.muted = false;
    this.port.onmessage = (e) => {
      const d = e.data || {};
      if (d.type === 'mute') this.muted = !!d.muted;
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const ch = input[0];
    if (!ch) return true;

    // Compute RMS for level meter on the source data so the muted state
    // still shows a flat line.
    let rmsSum = 0;
    for (let i = 0; i < ch.length; i++) rmsSum += ch[i] * ch[i];
    const rms = Math.sqrt(rmsSum / ch.length);

    if (this.muted) {
      // Drop frames; still report a zero level so the UI updates.
      if (rms > 0) this.port.postMessage({ type: 'level', value: 0 });
      return true;
    }

    // Linear-interpolation downsample to targetRate.
    const ratio = this.ratio;
    for (let i = 0; ; i++) {
      const srcIdx = i * ratio;
      const srcFloor = Math.floor(srcIdx);
      if (srcFloor >= ch.length - 1) break;
      const frac = srcIdx - srcFloor;
      const s = ch[srcFloor] * (1 - frac) + ch[srcFloor + 1] * frac;
      this.buf[this.bufFill++] = s;
      if (this.bufFill >= this.frameSamples) {
        this._flush();
      }
    }

    this.port.postMessage({ type: 'level', value: Math.min(1, rms * 4) });
    return true;
  }

  _flush() {
    const out = new Int16Array(this.frameSamples);
    for (let i = 0; i < this.frameSamples; i++) {
      let s = this.buf[i];
      if (s > 1) s = 1; else if (s < -1) s = -1;
      out[i] = (s < 0 ? s * 0x8000 : s * 0x7fff) | 0;
    }
    this.bufFill = 0;
    // Transfer the underlying buffer so we don't copy across threads.
    this.port.postMessage({ type: 'frame', buffer: out.buffer }, [out.buffer]);
  }
}

registerProcessor('saathi-capture-processor', CaptureProcessor);
`;

let workletUrl: string | null = null;
function getWorkletUrl(): string {
  if (workletUrl) return workletUrl;
  const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' });
  workletUrl = URL.createObjectURL(blob);
  return workletUrl;
}

/**
 * Create a microphone capture pipeline that emits 16 kHz PCM16 frames.
 * Caller must call start() to request the mic and stop() to release it.
 */
export function createAudioCapture(opts: AudioCaptureOptions): AudioCapture {
  const targetRate = opts.targetSampleRate ?? TARGET_RATE;
  const frameMs = opts.frameMs ?? FRAME_MS;

  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let node: AudioWorkletNode | null = null;
  let muted = false;
  let running = false;

  async function start(): Promise<void> {
    if (running) return;
    running = true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const Ctx =
        (window as unknown as { AudioContext?: typeof AudioContext })
          .AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext!;
      context = new Ctx();
      // Some browsers start the context suspended until a user gesture
      // — caller is expected to invoke start() from a click handler.
      if (context.state === 'suspended') {
        await context.resume().catch(() => {});
      }
      await context.audioWorklet.addModule(getWorkletUrl());

      source = context.createMediaStreamSource(stream);
      node = new AudioWorkletNode(context, 'saathi-capture-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        processorOptions: { targetRate, frameMs },
      });

      node.port.onmessage = (event: MessageEvent) => {
        const data = event.data as { type: string; buffer?: ArrayBuffer; value?: number };
        if (data.type === 'frame' && data.buffer) {
          opts.onFrame(new Int16Array(data.buffer));
        } else if (data.type === 'level' && typeof data.value === 'number') {
          opts.onLevel?.(data.value);
        }
      };
      // Push current mute state in case it was set before start()
      node.port.postMessage({ type: 'mute', muted });

      source.connect(node);
    } catch (err) {
      running = false;
      await cleanup();
      opts.onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  async function stop(): Promise<void> {
    if (!running) return;
    running = false;
    await cleanup();
  }

  async function cleanup(): Promise<void> {
    try {
      source?.disconnect();
    } catch {
      /* ignore */
    }
    try {
      node?.disconnect();
    } catch {
      /* ignore */
    }
    if (node) {
      node.port.onmessage = null;
    }
    source = null;
    node = null;
    if (stream) {
      for (const track of stream.getTracks()) {
        try {
          track.stop();
        } catch {
          /* ignore */
        }
      }
      stream = null;
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

  function setMuted(m: boolean): void {
    muted = m;
    node?.port.postMessage({ type: 'mute', muted: m });
  }

  return {
    start,
    stop,
    setMuted,
    isMuted: () => muted,
  };
}

/**
 * Encode an Int16Array (PCM16 little-endian) to base64. Used by the
 * caller before sending in a Gemini realtimeInput frame.
 */
export function pcm16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  // Chunked conversion to avoid call-stack blow-up on large buffers.
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + CHUNK)),
    );
  }
  return btoa(binary);
}
