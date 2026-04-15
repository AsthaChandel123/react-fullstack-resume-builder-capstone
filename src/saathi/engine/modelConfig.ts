// /mnt/experiments/astha-resume/src/saathi/engine/modelConfig.ts
// Single source of truth for Saathi LLM models.
// Primary: Gemma. Backup: Gemini. Allowed values: Gemma 3/4 family, Gemini 2.5 / 3.

export const SAATHI_MODELS = {
  primary: 'gemma-3-27b-it',
  backup: 'gemini-2.5-flash',
} as const;

export type SaathiModelRole = keyof typeof SAATHI_MODELS;

export function modelEndpoint(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

/** Gemini supports JSON mime type and responseSchema. Gemma via Generative Language API does not. */
export function supportsJsonMode(model: string): boolean {
  return model.startsWith('gemini-');
}

export function supportsResponseSchema(model: string): boolean {
  return model.startsWith('gemini-');
}
