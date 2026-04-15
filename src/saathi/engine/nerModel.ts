// /mnt/experiments/astha-resume/src/saathi/engine/nerModel.ts

/**
 * DistilBERT-NER ONNX model loader via @huggingface/transformers.
 * Loads Xenova/distilbert-NER INT8 (67MB) for entity extraction.
 * Entities: PER, ORG, LOC, MISC.
 * Citation: Sanh, V. et al. (2019). "DistilBERT." NeurIPS Workshop.
 */

import { pipeline as tfPipeline, type TokenClassificationPipeline } from '@huggingface/transformers';

let nerPipeline: TokenClassificationPipeline | null = null;
let loading: Promise<TokenClassificationPipeline> | null = null;

export interface NEREntity {
  word: string;
  entity_group: 'PER' | 'ORG' | 'LOC' | 'MISC';
  score: number;
  start: number;
  end: number;
}

/**
 * Load the NER model. Cached after first load.
 * Returns null if loading fails (graceful degradation to regex-only extraction).
 */
export async function loadNER(): Promise<TokenClassificationPipeline | null> {
  if (nerPipeline) return nerPipeline;
  if (loading) return loading;

  loading = tfPipeline('token-classification', 'Xenova/distilbert-NER', {
    dtype: 'q8',
  })
    .then((p) => {
      nerPipeline = p as TokenClassificationPipeline;
      return nerPipeline;
    })
    .catch(() => {
      loading = null;
      return null;
    });

  return loading;
}

/**
 * Run NER on text. Returns extracted entities with types.
 * Falls back to empty array if model not loaded.
 */
export async function extractNEREntities(text: string): Promise<NEREntity[]> {
  const model = await loadNER();
  if (!model) return [];

  try {
    const results = await model(text, { aggregation_strategy: 'simple' });
    return (results as any[]).map((r) => ({
      word: r.word,
      entity_group: r.entity_group,
      score: r.score,
      start: r.start,
      end: r.end,
    }));
  } catch {
    return [];
  }
}

/** Check if NER model is ready (loaded) */
export function isNERReady(): boolean {
  return nerPipeline !== null;
}
