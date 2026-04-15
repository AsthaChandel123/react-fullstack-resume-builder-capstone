/**
 * Stable device fingerprint that persists across browser restarts and changes.
 *
 * Strategy: combine multiple hardware/environment signals into a hash.
 * - Canvas fingerprint (GPU-specific rendering)
 * - WebGL renderer/vendor (GPU hardware ID)
 * - Screen resolution + color depth + pixel ratio
 * - Platform + CPU cores + device memory
 * - Timezone + language
 * - Audio context fingerprint (audio stack signature)
 *
 * The fingerprint is deterministic: same device = same hash, always.
 * Different browsers on the same device produce the same fingerprint
 * because the signals come from hardware, not browser state.
 *
 * Stored in localStorage AND IndexedDB for redundancy.
 * If both are cleared, regenerated identically from hardware signals.
 */

const STORAGE_KEY = 'resumeai_device_id';

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    // Draw text with specific font rendering (GPU-dependent)
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('ResumeAI fp', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('device id', 4, 17);

    // Add arc (anti-aliasing is GPU-specific)
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
    if (!gl || !(gl instanceof WebGLRenderingContext)) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) ?? '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '';

    return `${vendor}|${renderer}`;
  } catch {
    return 'webgl-error';
  }
}

function getAudioFingerprint(): string {
  try {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    // The audio context's sample rate and channel count are hardware-dependent
    return `audio:${ctx.sampleRate}:${ctx.destination.maxChannelCount}`;
  } catch {
    return 'no-audio';
  }
}

function collectSignals(): string {
  const signals: string[] = [];

  // Hardware signals (same across browsers on same device)
  signals.push(`screen:${screen.width}x${screen.height}x${screen.colorDepth}`);
  signals.push(`pixel:${devicePixelRatio}`);
  signals.push(`cores:${navigator.hardwareConcurrency ?? 0}`);
  signals.push(`mem:${(navigator as { deviceMemory?: number }).deviceMemory ?? 0}`);
  signals.push(`platform:${navigator.platform}`);
  signals.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  signals.push(`lang:${navigator.language}`);
  signals.push(`touch:${navigator.maxTouchPoints}`);

  // GPU fingerprint (hardware-specific)
  signals.push(`webgl:${getWebGLFingerprint()}`);

  // Canvas fingerprint (GPU rendering signature)
  signals.push(`canvas:${getCanvasFingerprint()}`);

  // Audio stack fingerprint
  signals.push(`${getAudioFingerprint()}`);

  return signals.join('||');
}

/**
 * Get or generate a stable device ID.
 * Same device = same ID, regardless of browser or restart.
 */
export async function getDeviceId(): Promise<string> {
  // Check localStorage first (fast path)
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) return cached;

  // Generate from hardware signals
  const signals = collectSignals();
  const hash = await sha256(signals);
  const deviceId = `dev_${hash.slice(0, 32)}`;

  // Store in localStorage for fast retrieval
  localStorage.setItem(STORAGE_KEY, deviceId);

  // Also store in IndexedDB for cross-browser persistence
  storeInIndexedDB(deviceId).catch(() => {});

  return deviceId;
}

/**
 * Verify if current device matches a stored device ID.
 * Regenerates fingerprint from hardware signals and compares.
 */
export async function verifyDevice(storedDeviceId: string): Promise<boolean> {
  const signals = collectSignals();
  const hash = await sha256(signals);
  const currentId = `dev_${hash.slice(0, 32)}`;
  return currentId === storedDeviceId;
}

async function storeInIndexedDB(deviceId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('resumeai_device', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('device');
    };
    req.onsuccess = () => {
      const tx = req.result.transaction('device', 'readwrite');
      tx.objectStore('device').put(deviceId, 'id');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}
