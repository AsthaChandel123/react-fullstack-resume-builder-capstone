// /mnt/experiments/astha-resume/src/saathi/engine/aiExtractor.ts

import { extractEntities, type ExtractedEntities } from './entityExtractor';

/**
 * AI-extracted resume data from natural user speech.
 * Handles Hinglish, lazy input, confusion, negation, off-topic.
 */
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
  /** User is saying they don't have something: "nahi hai projects" */
  isNegation?: boolean;
  /** User is confused or asking a question: "what do you mean?" */
  isConfusion?: boolean;
  /** User went off-topic: "what's the weather?" */
  isOffTopic?: boolean;
  /** AI's plain-language understanding of what the user meant */
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

const GEMINI_ENDPOINT = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const EXTRACT_TIMEOUT_MS = 10_000;

function buildExtractionPrompt(
  userMessage: string,
  conversationContext: string,
  currentPhase: string,
): string {
  return `You are Saathi, a resume-building assistant for Indian users. The user is speaking naturally, possibly in Hindi, Hinglish, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, or any Indian language mixed with English.

Extract structured resume data from their message. Return JSON with whatever you can extract.

Current phase: ${currentPhase}
Recent conversation:
${conversationContext}

User message: "${userMessage}"

Rules:
- If user says their name in ANY format (mera naam X hai, I'm X, call me X, just a bare name), extract it. Proper-case it: "rahul sharma" -> "Rahul Sharma".
- For location, accept city names in any language. "Solan mein rehta hoon" -> location: "Solan". "Delhi se hoon" -> location: "Delhi".
- For degree, normalize: "btech" -> "B.Tech", "mtech" -> "M.Tech", "bsc" -> "B.Sc", "mba" -> "MBA". "cse" or "cs" -> field: "Computer Science".
- For institution, extract university/college names even if abbreviated or in Hindi.
- For year, extract graduation year from any format: "2026", "passing out 2026", "final year" (infer if possible).
- For skills, extract ALL mentioned technologies, languages, tools. "react, node, mongo" -> ["React", "Node.js", "MongoDB"].
- For experience bullets, if the user describes what they did at work, extract as bullets.
- If user is confused or asking a question ("kya matlab?", "what do you mean?", "samajh nahi aaya"), set isConfusion=true and rawMeaning to what they seem confused about.
- If user says they don't have something ("nahi hai", "no experience", "skip", "I don't have projects"), set isNegation=true.
- If user is off-topic ("what's the weather?", "tell me a joke", "kya time hua?"), set isOffTopic=true.
- rawMeaning: always include a brief English summary of what the user meant.
- Only set fields you can confidently extract. Leave others out entirely.
- For lazy/terse input like "btech cse, shoolini, 2026", extract: degree="B.Tech", field="Computer Science", institution="Shoolini", year="2026".`;
}

/**
 * Extract structured resume data from natural user speech using Gemini 2.5 Flash.
 * Falls back to regex-based extractEntities on any failure.
 */
export async function extractWithAI(
  userMessage: string,
  conversationContext: string,
  currentPhase: string,
  apiKey: string,
): Promise<AIExtractedData> {
  if (!apiKey) {
    return regexFallback(userMessage);
  }

  const prompt = buildExtractionPrompt(userMessage, conversationContext, currentPhase);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXTRACT_TIMEOUT_MS);

  try {
    const response = await fetch(GEMINI_ENDPOINT(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          responseSchema: AI_EXTRACTION_SCHEMA,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return regexFallback(userMessage);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return regexFallback(userMessage);
    }

    const parsed: AIExtractedData = JSON.parse(text);
    return parsed;
  } catch {
    return regexFallback(userMessage);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Convert regex ExtractedEntities into AIExtractedData shape for fallback.
 */
function regexFallback(userMessage: string): AIExtractedData {
  const entities = extractEntities(userMessage);
  const result: AIExtractedData = {
    rawMeaning: userMessage,
  };

  if (entities.email) result.email = entities.email;
  if (entities.phone) result.phone = entities.phone;
  if (entities.degree) result.degree = entities.degree;
  if (entities.gpa) result.gpa = entities.gpa;
  if (entities.linkedin) result.linkedin = entities.linkedin;
  if (entities.github) result.github = entities.github;
  if (entities.skills.length > 0) result.skills = entities.skills;

  // Attempt name extraction via regex
  const nameMatch =
    userMessage.match(/(?:my name is|i'm|i am|call me|this is)\s+([a-z]+(?:\s[a-z]+)?)\b/i) ||
    userMessage.match(/(?:mera naam|main)\s+([a-z]+(?:\s[a-z]+)?)(?:\s+(?:hai|hoon|hu))?/i);
  if (nameMatch) {
    const raw = nameMatch[1].trim();
    result.name = raw
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // Location
  const locMatch = userMessage.match(
    /(?:from|in|at|based in|located in|live in|living in|se hoon|mein rehta|mein rehti|se|mein)\s+([A-Z][a-zA-Z]+(?:[,\s]+[A-Z][a-zA-Z]+)*)/i,
  );
  if (locMatch) result.location = locMatch[1].trim();

  // Year
  if (entities.dates.length > 0) {
    const years = entities.dates.map(Number).filter((y) => y >= 1990 && y <= 2035);
    if (years.length > 0) result.year = String(Math.max(...years));
  }

  return result;
}

/**
 * Get API key from env or localStorage.
 */
export function getGeminiApiKey(): string {
  // Vite env var
  const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (envKey) return envKey;

  // localStorage fallback
  try {
    return localStorage.getItem('gemini_api_key') || '';
  } catch {
    return '';
  }
}
