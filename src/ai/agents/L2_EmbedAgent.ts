/**
 * L2 Embedding Agent -- Semantic similarity via ONNX E5-small-v2.
 *
 * Primary: ONNX Runtime Web + E5-small-v2 (384-dim embeddings, ~67M params).
 * Fallback: TF-IDF cosine similarity (zero model download, runs anywhere).
 *
 * The agent tries ONNX first. If model fails to load (offline without cache,
 * old browser, etc.), it transparently falls back to TF-IDF.
 *
 * Citations:
 * - Wang, L. et al. (2024). "Text Embeddings by Weakly-Supervised
 *   Contrastive Pre-training." ACL 2024.
 * - Previously used: Wang, W. et al. (2020). MiniLM. NeurIPS.
 * - Reimers & Gurevych (2019). Sentence-BERT. EMNLP.
 * - Salton, G. (1975). A Theory of Indexing. SIAM.
 * - scikit-learn cosine_similarity: scikit-learn.org/stable/modules/metrics.html
 */

import { TfIdfVectorizer, cosineSimilarity } from '../scoring/tfidf';
import {
  loadModel,
  embed,
  embeddingCosineSimilarity,
  isModelLoaded,
} from '../models/onnx';

export interface L2Result {
  semanticScore: number;
  semanticMatches: string[];
  method: 'onnx-e5' | 'tfidf-fallback';
}

/**
 * Extract meaningful bigram phrases that appear in both texts.
 */
function findSemanticMatches(resumeText: string, jdText: string): string[] {
  const normalize = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const resumeNorm = normalize(resumeText);
  const jdNorm = normalize(jdText);

  const resumeWords = resumeNorm.split(' ');
  const jdBigrams = new Set<string>();
  const jdWords = jdNorm.split(' ');

  for (let i = 0; i < jdWords.length - 1; i++) {
    if (jdWords[i].length > 2 && jdWords[i + 1].length > 2) {
      jdBigrams.add(`${jdWords[i]} ${jdWords[i + 1]}`);
    }
  }

  const matches: string[] = [];
  for (let i = 0; i < resumeWords.length - 1; i++) {
    const bigram = `${resumeWords[i]} ${resumeWords[i + 1]}`;
    if (jdBigrams.has(bigram) && !matches.includes(bigram)) {
      matches.push(bigram);
    }
  }

  return matches.slice(0, 20);
}

/**
 * TF-IDF fallback (zero dependency, runs anywhere).
 * Citation: Salton (1975), scikit-learn cosine similarity.
 */
function analyzeWithTfIdf(resumeText: string, jdText: string): L2Result {
  const vectorizer = new TfIdfVectorizer();
  vectorizer.fit([resumeText, jdText]);

  const resumeVec = vectorizer.transform(resumeText);
  const jdVec = vectorizer.transform(jdText);
  const semanticScore = cosineSimilarity(resumeVec, jdVec);
  const semanticMatches = findSemanticMatches(resumeText, jdText);

  return { semanticScore, semanticMatches, method: 'tfidf-fallback' };
}

/**
 * ONNX E5-small-v2 embedding similarity.
 * Citation: Wang, L. et al. (2024) ACL; Reimers & Gurevych (2019) SBERT.
 */
async function analyzeWithOnnx(
  resumeText: string,
  jdText: string,
): Promise<L2Result> {
  if (!isModelLoaded()) {
    await loadModel();
  }

  const [resumeEmbed, jdEmbed] = await Promise.all([
    embed(resumeText, 'passage'),
    embed(jdText, 'query'),
  ]);

  const semanticScore = embeddingCosineSimilarity(resumeEmbed, jdEmbed);
  const semanticMatches = findSemanticMatches(resumeText, jdText);

  return { semanticScore, semanticMatches, method: 'onnx-e5' };
}

/**
 * Analyze resume vs JD using L2 semantic embeddings.
 *
 * Tries ONNX E5-small-v2 first, falls back to TF-IDF on failure.
 * Both methods produce a cosine similarity score in [0, 1].
 */
export async function analyzeL2(
  resumeText: string,
  jdText: string,
): Promise<L2Result> {
  try {
    return await analyzeWithOnnx(resumeText, jdText);
  } catch {
    // ONNX failed (no WASM, offline, model error) -- fall back to TF-IDF
    return analyzeWithTfIdf(resumeText, jdText);
  }
}

/**
 * Synchronous TF-IDF-only version (for tests and environments without async).
 */
export function analyzeL2Sync(
  resumeText: string,
  jdText: string,
): L2Result {
  return analyzeWithTfIdf(resumeText, jdText);
}
