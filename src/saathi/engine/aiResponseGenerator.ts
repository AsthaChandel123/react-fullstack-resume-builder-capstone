// /mnt/experiments/astha-resume/src/saathi/engine/aiResponseGenerator.ts

import type { AIExtractedData } from './aiExtractor';
import { getResponse, type ResponseKey } from './responseBank';

const GEMINI_ENDPOINT = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const RESPONSE_TIMEOUT_MS = 10_000;

function buildResponsePrompt(
  extractedData: AIExtractedData,
  currentPhase: string,
  filledSlots: string[],
  missingSlots: string[],
  userName: string,
): string {
  const extractedSummary = extractedData.rawMeaning || JSON.stringify(extractedData);
  const filledList = filledSlots.length > 0 ? filledSlots.join(', ') : 'nothing yet';
  const missingList = missingSlots.length > 0 ? missingSlots.join(', ') : 'nothing more needed';

  return `You are Saathi, a warm, encouraging career companion helping an Indian user build their resume. You speak naturally, like a supportive friend. Never robotic. Never corporate.

The user just shared: ${extractedSummary}

Current phase: ${currentPhase}
Already collected: ${filledList}
Still needed: ${missingList}
User's name: ${userName || 'unknown'}

Rules:
- Generate a natural, conversational response. 1-2 sentences max. Be warm but concise.
- If they shared education info, acknowledge it specifically (e.g., "B.Tech from Shoolini, nice!").
- If they shared their name, welcome them warmly.
- If they shared work experience, acknowledge the company/role.
- If they seem confused (isConfusion), explain what you need in simple terms. Example: "No worries! I just need to know where you studied. Like your college name and what degree you did."
- If they're saying they don't have something (isNegation), acknowledge it and move on: "That's totally fine! Let's move to the next section."
- If they're off-topic (isOffTopic), gently redirect: "Haha, I wish I could help with that! But let's get your resume sorted first. [ask for what you need]"
- Match their language style. If they're speaking Hinglish, respond in Hinglish. If formal English, match that.
- After acknowledging, ask for the next missing item naturally. Don't just list what you need.
- If nothing is missing, celebrate and tell them the resume is ready.
- Never use emojis. Keep it plain text.
- Do NOT repeat what they said back verbatim. Acknowledge with a fresh phrasing.`;
}

/**
 * Generate a natural, contextual Saathi response using Gemini 2.5 Flash.
 * Falls back to template responseBank on failure.
 */
export async function generateSaathiResponse(
  extractedData: AIExtractedData,
  currentPhase: string,
  filledSlots: string[],
  missingSlots: string[],
  userName: string,
  apiKey: string,
): Promise<string> {
  if (!apiKey) {
    return templateFallback(currentPhase, userName, missingSlots);
  }

  const prompt = buildResponsePrompt(
    extractedData,
    currentPhase,
    filledSlots,
    missingSlots,
    userName,
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESPONSE_TIMEOUT_MS);

  try {
    const response = await fetch(GEMINI_ENDPOINT(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return templateFallback(currentPhase, userName, missingSlots);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || text.trim().length === 0) {
      return templateFallback(currentPhase, userName, missingSlots);
    }

    // Strip any markdown formatting the model might add
    return text.trim().replace(/^\*+|\*+$/g, '').trim();
  } catch {
    return templateFallback(currentPhase, userName, missingSlots);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fallback: use existing template responseBank when API is unavailable.
 */
function templateFallback(
  currentPhase: string,
  userName: string,
  missingSlots: string[],
): string {
  const vars = { name: userName, location: '', degree: '', institution: '', year: '', field: '', company: '', role: '', skills_list: '', project: '' };

  const phaseKeyMap: Record<string, ResponseKey> = {
    warmup: 'greeting',
    education: 'education.ask',
    experience: 'experience.ask',
    projects: 'projects.ask',
    skills: 'skills.confirm',
    wrapup: 'wrapup.contact_ask',
    review: 'review.show',
  };

  const key = phaseKeyMap[currentPhase] || 'clarification';
  return getResponse(key, vars);
}
