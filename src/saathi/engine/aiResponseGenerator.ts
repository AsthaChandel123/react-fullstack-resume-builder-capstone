// /mnt/experiments/astha-resume/src/saathi/engine/aiResponseGenerator.ts
// Pure LLM response generation. Gemma primary, Gemini backup.

import type { AIExtractedData } from './aiExtractor';
import { SAATHI_MODELS, modelEndpoint } from './modelConfig';

const RESPONSE_TIMEOUT_MS = 15_000;

export interface ResponseTurn {
  role: 'user' | 'saathi';
  text: string;
}

function buildResponsePrompt(
  extractedData: AIExtractedData,
  currentPhase: string,
  filledSlots: string[],
  missingSlots: string[],
  userName: string,
  history: ResponseTurn[],
): string {
  const extractedSummary = extractedData.rawMeaning || JSON.stringify(extractedData);
  const filledList = filledSlots.length > 0 ? filledSlots.join(', ') : 'nothing yet';
  const missingList = missingSlots.length > 0 ? missingSlots.join(', ') : 'nothing more needed';

  const historyText = history
    .slice(-12)
    .map((t) => `${t.role === 'user' ? 'User' : 'Saathi'}: ${t.text}`)
    .join('\n');

  const alreadyAsked = history
    .filter((t) => t.role === 'saathi')
    .map((t) => `- ${t.text}`)
    .join('\n');

  return `You are Saathi, a warm, supportive resume companion for Indian users. You speak naturally, like a friend. Never robotic, never corporate, never use emojis.

Conversation so far:
${historyText}

The user just said: ${extractedSummary}
Phase: ${currentPhase}
Already collected: ${filledList}
Still needed: ${missingList}
User's name: ${userName || 'unknown'}

CRITICAL RULES:
1. NEVER repeat a question you already asked in the conversation above. Read the history carefully. If you see you already asked "where are you based?" do NOT ask it again. Vary wording or move on to a different missing field.
2. Acknowledge what the user just shared with a fresh phrasing. Do not echo their words verbatim.
3. After acknowledging, ask for the NEXT missing item from the "Still needed" list. Pick the most natural next field for the current phase.
4. Keep it 1-2 short sentences. Be warm but concise.
5. If the user seems confused (isConfusion), explain in simple plain words what you need. Example: "No worries! I just need to know which city you live in."
6. If they're saying they don't have something (isNegation), accept it and immediately move on to the next topic.
7. If they're off-topic (isOffTopic), gently redirect: "Haha, let's get your resume sorted first." then ask the next missing item.
8. Match their language register. Hinglish reply -> Hinglish answer. Formal English -> formal English.
9. If "Still needed" is empty, celebrate: tell them their resume is ready.
10. Plain text only. No markdown, no emojis, no bullet points, no quotation marks around your answer.
11. Never start with "Got it" or "Okay" twice in a row. Vary openings.

Questions you have already asked (do NOT repeat any of these verbatim):
${alreadyAsked || '(none yet)'}

Reply now with one short, natural Saathi message.`;
}

async function callGenerateModel(
  model: string,
  prompt: string,
  apiKey: string,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESPONSE_TIMEOUT_MS);

  try {
    const response = await fetch(modelEndpoint(model, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          ...(model.startsWith('gemini-') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Generate HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || text.trim().length === 0) {
      throw new Error('Generate: empty response');
    }

    return text.trim().replace(/^\*+|\*+$/g, '').trim();
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateSaathiResponse(
  extractedData: AIExtractedData,
  currentPhase: string,
  filledSlots: string[],
  missingSlots: string[],
  userName: string,
  history: ResponseTurn[],
  apiKey: string,
): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API key missing');
  }

  const prompt = buildResponsePrompt(
    extractedData,
    currentPhase,
    filledSlots,
    missingSlots,
    userName,
    history,
  );

  try {
    return await callGenerateModel(SAATHI_MODELS.primary, prompt, apiKey);
  } catch (primaryErr) {
    if (import.meta.env?.DEV) {
      console.warn('[saathi] primary generate failed, falling back', primaryErr);
    }
    return await callGenerateModel(SAATHI_MODELS.backup, prompt, apiKey);
  }
}
