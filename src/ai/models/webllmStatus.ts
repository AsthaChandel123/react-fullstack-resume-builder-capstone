// /mnt/experiments/astha-resume/src/ai/models/webllmStatus.ts
//
// Tiny status module that can be statically imported from hot code paths
// (e.g. Navbar) without pulling the ~100KB+ webllm bundle into the main chunk.
// webllm.ts calls into here to publish its download/ready state.

const KEY = 'resumeai_ai_ready';

let ready = false;

function readInitial(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

ready = readInitial();

export function isModelReady(): boolean {
  return ready;
}

export function markModelReady(): void {
  ready = true;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // Storage unavailable — in-memory flag is still authoritative.
    }
  }
}

export function markModelUnready(): void {
  ready = false;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  }
}
