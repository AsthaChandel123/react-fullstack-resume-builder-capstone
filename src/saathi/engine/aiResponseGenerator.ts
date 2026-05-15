// Conversational response generator. The goal is fewer, broader turns:
// one Saathi message asks for a whole phase's worth of context at once,
// not one slot at a time. The slot machine extracts whatever shows up.
//
// Cloud-first via Gemini Flash Lite. Hard 8s timeout per call.

import type { AIExtractedData } from './aiExtractor';
import {
  SAATHI_MODELS,
  modelEndpoint,
  CLOUD_INFERENCE_TIMEOUT_MS,
} from './modelConfig';

export interface ResponseTurn {
  role: 'user' | 'saathi';
  text: string;
}

// ── Phase prompt clusters ─────────────────────────────────────────────
//
// Each phase has a "what we need next" cluster. The model is told to ask
// for the WHOLE cluster in one message, in natural prose — never one item
// at a time. Adapt phrasing to the user's language register.

const PHASE_CLUSTERS: Record<string, { goal: string; ask: string }> = {
  warmup: {
    goal: 'Greet the user and gather identity in one go.',
    ask: 'Their name, the city they are in or moving to, and (if natural) the role they are aiming for.',
  },
  education: {
    goal: 'Capture their education in a single ask.',
    ask: 'Degree, college/university, graduation year, and field/major. If they typed something like "btech cse shoolini 2026" treat it as already answered.',
  },
  experience: {
    goal: 'Get one block of work or internship context.',
    ask: 'Company, role, dates, and 2-3 sentences on what they actually did. If they say no experience, accept it.',
  },
  projects: {
    goal: 'Capture one strong project.',
    ask: 'Project name, technologies used, and what it achieved. One paragraph is fine.',
  },
  skills: {
    goal: 'Collect skills.',
    ask: 'A comma-separated or natural list of technologies, languages, tools, frameworks. Encourage breadth.',
  },
  wrapup: {
    goal: 'Wrap up with contact + links.',
    ask: 'Email, phone, LinkedIn URL, GitHub URL. They can give all at once.',
  },
  review: {
    goal: 'Confirm completion.',
    ask: 'Tell the user the resume is ready and invite them to preview, edit, or share it.',
  },
};

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

  const cluster = PHASE_CLUSTERS[currentPhase] ?? PHASE_CLUSTERS.warmup;

  const historyText = history
    .slice(-8)
    .map((t) => `${t.role === 'user' ? 'User' : 'Saathi'}: ${t.text}`)
    .join('\n');

  const alreadyAsked = history
    .filter((t) => t.role === 'saathi')
    .slice(-6)
    .map((t) => `- ${t.text}`)
    .join('\n');

  return `You are Saathi, a warm, supportive resume companion for Indian users. You speak naturally, like a friend. Never robotic, never corporate, never use emojis.

Recent conversation:
${historyText}

The user just said: ${extractedSummary}
Current phase: ${currentPhase}
Phase goal: ${cluster.goal}
What to ask for this turn: ${cluster.ask}
Already collected: ${filledList}
Still missing overall: ${missingList}
User's name: ${userName || 'unknown'}

ABSOLUTE RULES:
1. Do NOT ask for any item already listed in "Already collected". If the user just shared something, acknowledge it briefly and move on.
2. Ask for the WHOLE cluster for the current phase in one short message. Never one item at a time. Group naturally: "Tell me about your education — degree, college, year, and field." not three separate turns.
3. If "Still missing overall" is empty, do NOT ask another question. Confirm the resume is ready and invite the user to preview it.
4. Two short sentences max. Be warm, specific, and forward-moving.
5. Match the user's language register. Hinglish reply → Hinglish answer. Formal English → formal English. No code-switching unless they do.
6. If extracted data has isConfusion=true, explain plainly in one sentence what you need.
7. If extracted data has isNegation=true for the current cluster, accept and move to the next phase's cluster.
8. If extracted data has isOffTopic=true, redirect once with a single friendly sentence.
9. Plain text only. No markdown, no emojis, no bullet points, no quotation marks around your answer.
10. Vary openings. Never start with "Got it" or "Okay" twice in a row.

Recent Saathi messages (do not repeat any verbatim):
${alreadyAsked || '(none yet)'}

Reply now with one short, natural Saathi message asking for the current phase cluster.`;
}

async function callGenerateModel(
  model: string,
  prompt: string,
  apiKey: string,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLOUD_INFERENCE_TIMEOUT_MS);

  try {
    const response = await fetch(modelEndpoint(model, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
          thinkingConfig: { thinkingBudget: 0 },
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

/**
 * Detect whether a generated response is asking for something the slot
 * machine already has. If so, the caller should fall back to a templated
 * cluster prompt instead of replaying the model's confusing question.
 */
function looksLikeStaleAsk(response: string, filledSlots: string[]): boolean {
  const lower = response.toLowerCase();
  const lookups: [string, RegExp][] = [
    ['Name', /(your|the)\s+name|what(?:'s| is)\s+your\s+name|naam\s+kya/i],
    ['Email', /your\s+email|email\s+id|email\s+address/i],
    ['Phone', /phone\s+(?:number|no)|mobile\s+(?:number|no)|contact\s+number/i],
    ['Location', /which\s+city|where\s+(?:are|do)\s+you|city\s+are\s+you/i],
    ['Degree', /which\s+degree|degree\s+(?:are|did)|qualification/i],
    ['Institution', /which\s+college|which\s+university|where\s+did\s+you\s+study/i],
    ['Graduation year', /graduation\s+year|year\s+(?:of|did)\s+you/i],
    ['Field of study', /which\s+field|field\s+of\s+study|specialization|major/i],
  ];
  for (const [slotLabel, re] of lookups) {
    if (filledSlots.includes(slotLabel) && re.test(lower)) return true;
  }
  return false;
}

function fallbackClusterPrompt(currentPhase: string, userName: string): string {
  const name = userName ? `${userName}, ` : '';
  switch (currentPhase) {
    case 'warmup':
      return `${name}quick intro — your name, the city you are in, and the kind of role you are aiming for.`;
    case 'education':
      return `${name}tell me about your education in one go — degree, college, graduation year, and your field of study.`;
    case 'experience':
      return `${name}walk me through any work or internship — company, role, dates, and what you actually did. Say no if you don't have any.`;
    case 'projects':
      return `${name}pick one project you are proud of — name, the tech you used, and what it achieved.`;
    case 'skills':
      return `${name}list the technologies, languages, and tools you know — as many as you like, comma-separated is fine.`;
    case 'wrapup':
      return `${name}let's finish up — email, phone, LinkedIn URL, and GitHub URL.`;
    case 'review':
    default:
      return `${name}your resume is ready. Open the preview to download or share it.`;
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
  // Phase has nothing left to ask — short-circuit to the review prompt
  // without spending a model call.
  if (currentPhase === 'review' || missingSlots.length === 0) {
    return fallbackClusterPrompt('review', userName);
  }

  if (!apiKey) {
    return fallbackClusterPrompt(currentPhase, userName);
  }

  const prompt = buildResponsePrompt(
    extractedData,
    currentPhase,
    filledSlots,
    missingSlots,
    userName,
    history,
  );

  let response: string;
  try {
    response = await callGenerateModel(SAATHI_MODELS.primary, prompt, apiKey);
  } catch (primaryErr) {
    if (import.meta.env?.DEV) {
      console.warn('[saathi] primary generate failed, falling back', primaryErr);
    }
    try {
      response = await callGenerateModel(SAATHI_MODELS.backup, prompt, apiKey);
    } catch {
      return fallbackClusterPrompt(currentPhase, userName);
    }
  }

  // Internal validation: if the model asked for something already collected,
  // discard its output and return a deterministic cluster prompt instead.
  if (looksLikeStaleAsk(response, filledSlots)) {
    if (import.meta.env?.DEV) {
      console.warn('[saathi] discarding stale ask, using fallback cluster prompt');
    }
    return fallbackClusterPrompt(currentPhase, userName);
  }

  return response;
}
