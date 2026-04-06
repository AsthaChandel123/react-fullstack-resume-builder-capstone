/**
 * AI Analysis Pipeline (Legacy Linear)
 *
 * @deprecated Use `analyzeResumeAgentic` from `./orchestrator` instead.
 * The new agentic pipeline runs agents in a DAG with parallel branches,
 * skills taxonomy matching, JD processing, and ReAct traces.
 *
 * This file is kept for backwards compatibility with existing callers.
 *
 * Legacy pipeline order:
 *   L1_NLPAgent -> L2_EmbedAgent -> L3_ReasonAgent -> L4_FallbackAgent -> ScoreAgent -> DistanceAgent
 */

import type { CandidateScores, AnalysisLayer, RedFlag } from '../store/types';
import { analyzeL1 } from './agents/L1_NLPAgent';
import { analyzeL2, analyzeL2Sync } from './agents/L2_EmbedAgent';
import {
  analyzeL3,
  buildContradictionPrompt,
  buildRefinementPrompt,
  parseContradictionResponse,
  type L3Result,
} from './agents/L3_ReasonAgent';
import { analyzeWithGemini } from './agents/L4_FallbackAgent';
import { computeScore } from './agents/ScoreAgent';
import { getDistance } from './agents/DistanceAgent';
// detectCapabilities no longer gates L3 -- we always attempt it

export interface PipelineConfig {
  geminiApiKey?: string;
  mapsApiKey?: string;
  jobLocation?: string;
  concurrency?: number;
}

export interface PipelineProgress {
  candidateId: string;
  layer: AnalysisLayer | 'done' | 'error';
  scores: CandidateScores | null;
  redFlags: RedFlag[];
  error?: string;
  /** The highest AI layer that produced results for this candidate */
  pipelineLevel?: 'L1' | 'L2' | 'L3' | 'L4';
}

export type ProgressCallback = (progress: PipelineProgress) => void;

/**
 * Run the full analysis pipeline for a single resume.
 *
 * Pipeline stages:
 * 1. L1 (NLP): instant keyword + section + entity extraction
 * 2. L2 (Embed): ONNX MiniLM-L6-v2 embeddings, TF-IDF fallback
 * 3. L3 (Reason): Gemma 4 E2B 1B via WebLLM (WebGPU/WASM)
 * 4. L4 (Fallback): Gemini 2.5 Pro API -- only if L3 fails entirely
 * 5. Score: weighted composite per spec section 6.13
 * 6. Distance: Google Maps (optional, async)
 */
export async function analyzeResume(
  candidateId: string,
  resumeText: string,
  jdText: string,
  config: PipelineConfig = {},
  onProgress?: ProgressCallback,
): Promise<{ scores: CandidateScores; redFlags: RedFlag[] }> {
  let redFlags: RedFlag[] = [];

  // --- Layer 1: NLP (instant) ---
  const l1 = analyzeL1(resumeText, jdText);
  onProgress?.({ candidateId, layer: 'L1', scores: null, redFlags: [] });

  // --- Layer 2: Embedding (ONNX MiniLM -> TF-IDF fallback) ---
  let l2;
  try {
    l2 = await analyzeL2(resumeText, jdText);
  } catch {
    // ONNX completely failed, use sync TF-IDF
    l2 = analyzeL2Sync(resumeText, jdText);
  }
  onProgress?.({ candidateId, layer: 'L2', scores: null, redFlags: [] });

  // --- Layer 3: Reasoning (Gemma 4 E2B via WebLLM) ---
  // Always attempt L3 first. Only skip if it genuinely fails.
  let l3: L3Result | null = null;
  let activeLevel: 'L1' | 'L2' | 'L3' | 'L4' = 'L2';

  try {
    l3 = await analyzeL3(resumeText, jdText);
    redFlags = l3.redFlags;
    activeLevel = 'L3';
  } catch {
    // L3 genuinely failed (model download error, WebGPU/WASM unavailable)
    l3 = null;
  }

  // --- Layer 4: Gemini API fallback -- only if L3 failed entirely ---
  if (!l3 && config.geminiApiKey) {
    try {
      const prompt = buildContradictionPrompt(resumeText, jdText);
      const response = await analyzeWithGemini(config.geminiApiKey, prompt);
      redFlags = parseContradictionResponse(response);

      const refinePrompt = buildRefinementPrompt(resumeText);
      const refineResponse = await analyzeWithGemini(
        config.geminiApiKey,
        refinePrompt,
      );
      try {
        let cleaned = refineResponse.trim();
        const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) cleaned = jsonMatch[1].trim();
        const objMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objMatch) {
          const parsed = JSON.parse(objMatch[0]);
          l3 = {
            redFlags,
            experienceLevel: parsed.experienceLevel ?? 'medium',
            projectScores: parsed.projectScores ?? [],
            reasoning: parsed.reasoning ?? '',
          };
        }
      } catch {
        l3 = {
          redFlags,
          experienceLevel: 'medium',
          projectScores: [],
          reasoning: '',
        };
      }
      activeLevel = 'L4';
    } catch {
      // L4 also failed -- continue with L1+L2 only
      l3 = null;
    }
  }

  onProgress?.({ candidateId, layer: 'L3', scores: null, redFlags, pipelineLevel: activeLevel });

  // --- Distance (optional, async, online-only) ---
  let distance: { km: number } | null = null;
  if (config.mapsApiKey && config.jobLocation && l1.name) {
    const candidateLocation = extractLocation(resumeText);
    if (candidateLocation) {
      const distResult = await getDistance(
        config.mapsApiKey,
        candidateLocation,
        config.jobLocation,
      );
      if (distResult) {
        distance = { km: distResult.km };
      }
    }
  }

  // --- Score computation (spec section 6.13) ---
  const scores = computeScore(l1, l2, l3, distance);

  onProgress?.({ candidateId, layer: 'done', scores, redFlags, pipelineLevel: activeLevel });

  return { scores, redFlags };
}

/**
 * Extract a location string from resume text (near the top, likely contact area).
 */
function extractLocation(text: string): string {
  const lines = text.split('\n').slice(0, 10);
  for (const line of lines) {
    const locationMatch = line.match(
      /\b(?:[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2}\b|[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Za-z\s]+(?:India|USA|UK|Canada))/,
    );
    if (locationMatch) return locationMatch[0];
  }
  return '';
}

/**
 * Batch analyze multiple resumes with concurrency control.
 * Processes up to `concurrency` resumes in parallel (default: 4).
 */
export async function analyzeBatch(
  candidates: Array<{ id: string; resumeText: string }>,
  jdText: string,
  config: PipelineConfig = {},
  onProgress?: ProgressCallback,
): Promise<
  Map<string, { scores: CandidateScores; redFlags: RedFlag[] }>
> {
  const concurrency = config.concurrency ?? 4;
  const results = new Map<
    string,
    { scores: CandidateScores; redFlags: RedFlag[] }
  >();

  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((c) =>
        analyzeResume(c.id, c.resumeText, jdText, config, onProgress)
          .then((result) => ({ id: c.id, result }))
          .catch((error) => {
            onProgress?.({
              candidateId: c.id,
              layer: 'error',
              scores: null,
              redFlags: [],
              error: String(error),
            });
            return null;
          }),
      ),
    );

    for (const settled of batchResults) {
      if (settled.status === 'fulfilled' && settled.value) {
        results.set(settled.value.id, settled.value.result);
      }
    }
  }

  return results;
}
