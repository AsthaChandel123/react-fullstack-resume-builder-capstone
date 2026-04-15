/**
 * L4 Fallback Agent -- Gemini 2.5 Flash API.
 *
 * Only invoked when L3 (Gemma 4 E2B WebLLM) fails entirely.
 * Uses the same prompt templates as L3 for consistency.
 * Requires user-provided API key (stored in localStorage, never transmitted elsewhere).
 *
 * Gemini 2.5 Flash chosen over Pro for higher rate limits:
 *   Flash: 10 RPM / 250 RPD vs Pro: 5 RPM / 100 RPD (2x/2.5x).
 *
 * Privacy: API key entered by user in settings per spec section 5.6.
 * This is the only component that requires network access.
 */

const GEMINI_ENDPOINT = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 2_000;
const MAX_RETRIES = 1;

/**
 * Schema for contradiction detection structured output.
 * Each item represents one detected issue in the resume.
 */
const CONTRADICTION_SCHEMA = {
  type: "ARRAY" as const,
  items: {
    type: "OBJECT" as const,
    properties: {
      type: { type: "STRING" as const, enum: ["contradiction", "framing", "date-inconsistency", "skill-inflation", "hidden-text"] },
      dimension: { type: "STRING" as const, enum: ["fabrication", "embellishment", "omission"] },
      description: { type: "STRING" as const },
      evidence: { type: "STRING" as const },
      penalty: { type: "NUMBER" as const },
      citation: { type: "STRING" as const },
    },
    required: ["type", "dimension", "description", "evidence", "penalty", "citation"],
  },
};

/**
 * Schema for refinement structured output.
 * Returns experience assessment and per-project scores.
 */
const REFINEMENT_SCHEMA = {
  type: "OBJECT" as const,
  properties: {
    experienceLevel: { type: "STRING" as const, enum: ["high", "medium", "low"] },
    projectScores: { type: "ARRAY" as const, items: { type: "NUMBER" as const } },
    reasoning: { type: "STRING" as const },
  },
  required: ["experienceLevel", "projectScores", "reasoning"],
};

/** Transient HTTP status codes that warrant a retry. */
function isTransient(status: number): boolean {
  return status === 429 || status === 503;
}

/**
 * Fire a single Gemini request with timeout.
 * Returns the raw Response object.
 */
async function geminiRequest(
  endpoint: string,
  body: Record<string, unknown>
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Execute a Gemini request with retry on transient errors (429/503).
 * 1 retry with 2s exponential backoff.
 */
async function geminiRequestWithRetry(
  endpoint: string,
  body: Record<string, unknown>
): Promise<Response> {
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }

    lastResponse = await geminiRequest(endpoint, body);

    if (lastResponse.ok || !isTransient(lastResponse.status)) {
      return lastResponse;
    }
  }

  return lastResponse!;
}

/**
 * Extract text from a Gemini API response.
 */
function extractText(data: Record<string, unknown>): string {
  const text =
    (data as any)?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }
  return text;
}

/**
 * @deprecated Use `analyzeWithGeminiStructured` for typed JSON output.
 *
 * Send a prompt to Gemini 2.5 Flash and return the response text.
 * Kept for backwards compatibility with callers expecting raw text.
 *
 * Uses the Gemini REST API (generativelanguage.googleapis.com).
 * Timeout: 30 seconds. 1 retry on transient 429/503.
 */
export async function analyzeWithGemini(
  apiKey: string,
  prompt: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API key required for L4 fallback analysis');
  }

  const endpoint = GEMINI_ENDPOINT(apiKey);

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  };

  const response = await geminiRequestWithRetry(endpoint, body);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return extractText(data);
}

/**
 * Send a prompt to Gemini 2.5 Flash with structured JSON output.
 *
 * Returns parsed JSON matching the provided schema.
 * Uses `responseMimeType: "application/json"` and `responseSchema`
 * in generationConfig to enforce structured output from the model.
 *
 * Timeout: 30 seconds. 1 retry on transient 429/503.
 */
export async function analyzeWithGeminiStructured<T>(
  apiKey: string,
  prompt: string,
  schema: Record<string, unknown>
): Promise<T> {
  if (!apiKey) {
    throw new Error('Gemini API key required for L4 fallback analysis');
  }

  const endpoint = GEMINI_ENDPOINT(apiKey);

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  };

  const response = await geminiRequestWithRetry(endpoint, body);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = extractText(data);
  return JSON.parse(text) as T;
}

/**
 * Send a PDF directly to Gemini 2.5 Flash for native document understanding.
 *
 * Uses Gemini's inline_data capability to send the PDF as base64,
 * avoiding lossy text extraction. Returns raw text response.
 *
 * Timeout: 30 seconds. 1 retry on transient 429/503.
 */
export async function analyzePdfWithGemini(
  apiKey: string,
  pdfBase64: string,
  prompt: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API key required for L4 fallback analysis');
  }

  const endpoint = GEMINI_ENDPOINT(apiKey);

  const body = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  };

  const response = await geminiRequestWithRetry(endpoint, body);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return extractText(data);
}

export { CONTRADICTION_SCHEMA, REFINEMENT_SCHEMA };
