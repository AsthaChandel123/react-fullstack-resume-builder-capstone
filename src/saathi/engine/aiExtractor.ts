// /mnt/experiments/astha-resume/src/saathi/engine/aiExtractor.ts
// Pure LLM extraction. No regex. Gemma primary, Gemini backup.

import { SAATHI_MODELS, modelEndpoint, supportsJsonMode, supportsResponseSchema } from './modelConfig';

export interface AIExtractedData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  targetRole?: string;
  degree?: string;
  institution?: string;
  year?: string;
  field?: string;
  gpa?: string;
  company?: string;
  role?: string;
  dates?: string;
  bullets?: string[];
  skills?: string[];
  linkedin?: string;
  github?: string;
  isNegation?: boolean;
  isConfusion?: boolean;
  isOffTopic?: boolean;
  rawMeaning?: string;
}

const AI_EXTRACTION_SCHEMA = {
  type: 'OBJECT' as const,
  properties: {
    name: { type: 'STRING' as const, nullable: true },
    email: { type: 'STRING' as const, nullable: true },
    phone: { type: 'STRING' as const, nullable: true },
    location: { type: 'STRING' as const, nullable: true },
    targetRole: { type: 'STRING' as const, nullable: true },
    degree: { type: 'STRING' as const, nullable: true },
    institution: { type: 'STRING' as const, nullable: true },
    year: { type: 'STRING' as const, nullable: true },
    field: { type: 'STRING' as const, nullable: true },
    gpa: { type: 'STRING' as const, nullable: true },
    company: { type: 'STRING' as const, nullable: true },
    role: { type: 'STRING' as const, nullable: true },
    dates: { type: 'STRING' as const, nullable: true },
    bullets: { type: 'ARRAY' as const, items: { type: 'STRING' as const }, nullable: true },
    skills: { type: 'ARRAY' as const, items: { type: 'STRING' as const }, nullable: true },
    linkedin: { type: 'STRING' as const, nullable: true },
    github: { type: 'STRING' as const, nullable: true },
    isNegation: { type: 'BOOLEAN' as const, nullable: true },
    isConfusion: { type: 'BOOLEAN' as const, nullable: true },
    isOffTopic: { type: 'BOOLEAN' as const, nullable: true },
    rawMeaning: { type: 'STRING' as const, nullable: true },
  },
  required: ['rawMeaning'] as const,
};

const EXTRACT_TIMEOUT_MS = 15_000;

function buildExtractionPrompt(
  userMessage: string,
  conversationContext: string,
  currentPhase: string,
  lastSaathiQuestion: string,
  missingSlots: string[],
): string {
  return `You extract structured resume data from a user's natural-language reply for Saathi, a resume assistant for Indian users. Users may speak in English, Hindi, Hinglish, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, or any mix.

Conversation so far:
${conversationContext}

Saathi's last question: "${lastSaathiQuestion}"
Currently missing fields: ${missingSlots.join(', ') || 'none'}
Current phase: ${currentPhase}

User's new reply: "${userMessage}"

CRITICAL RULES:
1. The user's reply most likely answers Saathi's last question. A bare token like "Shimla" answering "where are you based?" means location="Shimla".
2. If the question asks for a name and user replies "Rahul" or "main rahul", set name="Rahul".
3. Accept bare answers without prepositions.
4. Proper-case names and locations: "rahul sharma" -> "Rahul Sharma", "shimla" -> "Shimla".
5. Normalize degrees: btech->B.Tech, mtech->M.Tech, bsc->B.Sc, msc->M.Sc, mba->MBA, bca->BCA, mca->MCA, phd->PhD.
6. Normalize fields: cse/cs->Computer Science, it->Information Technology, ece->Electronics and Communication, ai->Artificial Intelligence, ml->Machine Learning, ds->Data Science.
7. For lazy combined input "btech cse shoolini 2026" extract: degree=B.Tech, field=Computer Science, institution=Shoolini, year=2026.
8. Skills: extract every technology, language, or tool mentioned. Normalize: react->React, node->Node.js, mongo->MongoDB, py->Python, js->JavaScript.
9. If user clearly says they don't have something ("nahi hai", "no experience", "skip", "don't have", "none"), set isNegation=true.
10. If user is confused ("kya?", "matlab?", "what do you mean?", "samajh nahi aaya"), set isConfusion=true.
11. If user is off-topic ("weather kaisa hai?", "tell me a joke"), set isOffTopic=true.
12. ALWAYS include rawMeaning: a one-sentence English summary of what the user actually said.
13. Only set fields you are confident about. Leave others null. Do NOT invent data.
14. If the reply is a single ambiguous token, use Saathi's last question to decide which field it answers.

Output ONLY a single JSON object. No prose, no markdown fences, no commentary.

JSON schema (use null for unknown fields, omit fields you cannot confidently extract):
{
  "name": string|null,
  "email": string|null,
  "phone": string|null,
  "location": string|null,
  "targetRole": string|null,
  "degree": string|null,
  "institution": string|null,
  "year": string|null,
  "field": string|null,
  "gpa": string|null,
  "company": string|null,
  "role": string|null,
  "dates": string|null,
  "bullets": string[]|null,
  "skills": string[]|null,
  "linkedin": string|null,
  "github": string|null,
  "isNegation": boolean|null,
  "isConfusion": boolean|null,
  "isOffTopic": boolean|null,
  "rawMeaning": string
}`;
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenceStart = trimmed.indexOf('{');
  const fenceEnd = trimmed.lastIndexOf('}');
  if (fenceStart === -1 || fenceEnd === -1 || fenceEnd < fenceStart) {
    throw new Error('No JSON object found in model output');
  }
  return trimmed.slice(fenceStart, fenceEnd + 1);
}

async function callExtractModel(
  model: string,
  prompt: string,
  apiKey: string,
): Promise<AIExtractedData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXTRACT_TIMEOUT_MS);

  const generationConfig: Record<string, unknown> = {
    temperature: 0.1,
    maxOutputTokens: 2048,
    ...(model.startsWith('gemini-') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
  };
  if (supportsJsonMode(model)) {
    generationConfig.responseMimeType = 'application/json';
  }
  if (supportsResponseSchema(model)) {
    generationConfig.responseSchema = AI_EXTRACTION_SCHEMA;
  }

  try {
    const response = await fetch(modelEndpoint(model, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Extract HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Extract: empty response');
    }

    const jsonText = supportsResponseSchema(model) ? text : stripJsonFence(text);
    return JSON.parse(jsonText) as AIExtractedData;
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractWithAI(
  userMessage: string,
  conversationContext: string,
  currentPhase: string,
  lastSaathiQuestion: string,
  missingSlots: string[],
  apiKey: string,
): Promise<AIExtractedData> {
  if (!apiKey) {
    throw new Error('Gemini API key missing');
  }

  const prompt = buildExtractionPrompt(
    userMessage,
    conversationContext,
    currentPhase,
    lastSaathiQuestion,
    missingSlots,
  );

  try {
    return await callExtractModel(SAATHI_MODELS.primary, prompt, apiKey);
  } catch (primaryErr) {
    if (import.meta.env?.DEV) {
      console.warn('[saathi] primary extract failed, falling back', primaryErr);
    }
    return await callExtractModel(SAATHI_MODELS.backup, prompt, apiKey);
  }
}

export function getGeminiApiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (envKey) return envKey;
  try {
    return localStorage.getItem('gemini_api_key') || '';
  } catch {
    return '';
  }
}
