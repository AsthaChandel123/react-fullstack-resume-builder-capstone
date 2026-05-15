// Single source of truth for Saathi LLM models.
//
// Strategy: fast cloud first, local model as a strictly opt-in offline fallback.
// Heavy local models (Gemma 4 E2B) are *not* in the default chat path because
// on CPU-only browsers they take 30-60 seconds per turn — unusable for chat.
// The local path is reserved for explicit "offline mode" or a future small
// CPU-friendly model like Qwen 2.5 0.5B / SmolLM2-360M.

export const SAATHI_MODELS = {
  /** Fast cloud generator. Sub-second on typical Saathi prompts. */
  primary: 'gemini-2.5-flash-lite',
  /** Retry path. Larger Flash variant if Lite gets rate-limited or 5xxs. */
  backup: 'gemini-2.5-flash',
} as const;

export type SaathiModelRole = keyof typeof SAATHI_MODELS;

export function modelEndpoint(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

/** All Gemini variants support response mime + schema. */
export function supportsJsonMode(model: string): boolean {
  return model.startsWith('gemini-');
}

export function supportsResponseSchema(model: string): boolean {
  return model.startsWith('gemini-');
}

// ── Inference budgets ────────────────────────────────────────────────
// Hard cap on a single cloud call. Aborts and falls back to backup model.
export const CLOUD_INFERENCE_TIMEOUT_MS = 8_000;
// Local-model deadline. If on-device generation exceeds this, the cloud
// race wins and we ignore the local result for this turn.
export const LOCAL_INFERENCE_DEADLINE_MS = 4_000;
