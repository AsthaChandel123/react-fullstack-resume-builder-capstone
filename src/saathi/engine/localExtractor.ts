// /mnt/experiments/astha-resume/src/saathi/engine/localExtractor.ts
//
// On-device Gemma 4 E2B extraction path for Saathi chat.
// Uses the same dynamic import of webllm.ts so the ~1.5GB model only
// loads when the user device supports it and the user has opted in.
//
// Contract matches callExtractModel in aiExtractor.ts — returns
// AIExtractedData or throws.

import type { AIExtractedData } from './aiExtractor';
import { isModelReady as isLocalModelReady } from '@/ai/models/webllmStatus';

const LOCAL_TIMEOUT_MS = 30_000;

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenceStart = trimmed.indexOf('{');
  const fenceEnd = trimmed.lastIndexOf('}');
  if (fenceStart === -1 || fenceEnd === -1 || fenceEnd < fenceStart) {
    throw new Error('No JSON object found in local model output');
  }
  return trimmed.slice(fenceStart, fenceEnd + 1);
}

/** Whether on-device Gemma has finished downloading and is usable. */
export function canExtractLocally(): boolean {
  return isLocalModelReady();
}

/**
 * Run extraction on-device via Gemma 4 E2B.
 *
 * Throws on timeout, model load failure, or invalid JSON so the caller
 * can fall back to the cloud path.
 */
export async function extractLocally(prompt: string): Promise<AIExtractedData> {
  const { getOrCreateEngine, generate } = await import('@/ai/models/webllm');

  const engine = await Promise.race<Awaited<ReturnType<typeof getOrCreateEngine>>>([
    getOrCreateEngine(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('local model load timeout')), LOCAL_TIMEOUT_MS);
    }),
  ]);

  const systemPrompt =
    'You extract structured data for a resume assistant. Respond only with a single valid JSON object. No prose, no markdown fences.';

  const raw = await Promise.race<string>([
    generate(engine, prompt, 1024, systemPrompt),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('local inference timeout')), LOCAL_TIMEOUT_MS);
    }),
  ]);

  const jsonText = stripJsonFence(raw);
  return JSON.parse(jsonText) as AIExtractedData;
}
