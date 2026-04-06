// /mnt/experiments/astha-resume/src/saathi/engine/slotMachine.ts

import {
  createSlotState,
  getNextUnfilledSlot,
  getFilledPercentage,
  getRequiredFilledPercentage,
  getPhaseForSlot,
  skipPhaseSlots,
  addArrayEntry,
  NEGATION_RE,
  type SlotState,
  type SlotId,
  type ConversationPhase,
} from './slots';
import { extractEntities, type ExtractedEntities } from './entityExtractor';
import { getGreeting, getResponse, type ResponseKey } from './responseBank';

const STORAGE_KEY = 'saathi_conversation';

export interface ChatMessage {
  id: string;
  role: 'user' | 'saathi' | 'system';
  text: string;
  timestamp: number;
  /** Entities extracted from this message (user messages only) */
  entities?: ExtractedEntities;
}

export interface ConversationState {
  messages: ChatMessage[];
  slots: SlotState;
  filledPercentage: number;
  requiredFilledPercentage: number;
  isComplete: boolean;
}

let _msgCounter = 0;
function msgId(): string {
  return `msg-${++_msgCounter}-${Date.now()}`;
}

export function createConversation(): ConversationState {
  const greeting = getGreeting();
  const slots = createSlotState();
  return {
    messages: [
      {
        id: msgId(),
        role: 'saathi',
        text: greeting,
        timestamp: Date.now(),
      },
    ],
    slots,
    filledPercentage: 0,
    requiredFilledPercentage: 0,
    isComplete: false,
  };
}

// ── Serialization (Bug 4) ──────────────────────────────────────────────

interface SerializedState {
  messages: ChatMessage[];
  slotValues: [string, string | string[]][];
  phase: ConversationPhase;
  arrayIndices: [string, number][];
  skippedSlots: string[];
  filledPercentage: number;
  requiredFilledPercentage: number;
  isComplete: boolean;
}

export function serializeState(state: ConversationState): string {
  const s: SerializedState = {
    messages: state.messages,
    slotValues: [...state.slots.values.entries()],
    phase: state.slots.phase,
    arrayIndices: [...state.slots.arrayIndices.entries()],
    skippedSlots: [...state.slots.skippedSlots],
    filledPercentage: state.filledPercentage,
    requiredFilledPercentage: state.requiredFilledPercentage,
    isComplete: state.isComplete,
  };
  return JSON.stringify(s);
}

export function deserializeState(json: string): ConversationState | null {
  try {
    const s: SerializedState = JSON.parse(json);
    const slots: SlotState = {
      values: new Map(s.slotValues as [SlotId, string | string[]][]),
      phase: s.phase,
      arrayIndices: new Map(s.arrayIndices),
      skippedSlots: new Set(s.skippedSlots as SlotId[]),
    };
    return {
      messages: s.messages,
      slots,
      filledPercentage: s.filledPercentage,
      requiredFilledPercentage: s.requiredFilledPercentage,
      isComplete: s.isComplete,
    };
  } catch {
    return null;
  }
}

export function saveToStorage(state: ConversationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeState(state));
  } catch {
    // Storage full or unavailable, silently ignore
  }
}

export function loadFromStorage(): ConversationState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return deserializeState(raw);
  } catch {
    return null;
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Process a user message: extract entities, fill slots, generate response.
 * Returns a new ConversationState (immutable).
 */
export function processUserInput(
  state: ConversationState,
  input: string,
): ConversationState {
  // Input validation: cap at 2000 chars to prevent ReDoS, strip control chars
  const sanitized = input.slice(0, 2000).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  const trimmed = sanitized.trim();

  // Add user message
  const entities = trimmed.length > 0 ? extractEntities(trimmed) : null;
  const userMsg: ChatMessage = {
    id: msgId(),
    role: 'user',
    text: trimmed,
    timestamp: Date.now(),
    entities: entities ?? undefined,
  };

  const newSlots: SlotState = {
    values: new Map(state.slots.values),
    phase: state.slots.phase,
    arrayIndices: new Map(state.slots.arrayIndices),
    skippedSlots: new Set(state.slots.skippedSlots),
  };

  if (!trimmed) {
    // Empty input: ask for clarification
    const clarification: ChatMessage = {
      id: msgId(),
      role: 'saathi',
      text: getResponse('clarification', {}),
      timestamp: Date.now(),
    };
    return {
      ...state,
      messages: [...state.messages, userMsg, clarification],
    };
  }

  // Bug 2: Detect negation and skip current phase slots
  if (NEGATION_RE.test(trimmed)) {
    const currentPhase = newSlots.phase;
    // Only skip non-required phases (experience, projects, skills, wrapup optional slots)
    const skippablePhases: ConversationPhase[] = ['experience', 'projects', 'skills'];
    if (skippablePhases.includes(currentPhase)) {
      skipPhaseSlots(newSlots, currentPhase);
      updatePhase(newSlots);
      const nextSlot = getNextUnfilledSlot(newSlots);
      const responseKey: ResponseKey = nextSlot
        ? phaseToAskKey(nextSlot.phase, newSlots)
        : 'review.show';
      const name = (newSlots.values.get('personal.name') as string) || '';
      const responseMsg: ChatMessage = {
        id: msgId(),
        role: 'saathi',
        text: getResponse(responseKey, { name }),
        timestamp: Date.now(),
      };
      const filledPct = getFilledPercentage(newSlots);
      const reqPct = getRequiredFilledPercentage(newSlots);
      const result: ConversationState = {
        messages: [...state.messages, userMsg, responseMsg],
        slots: newSlots,
        filledPercentage: filledPct,
        requiredFilledPercentage: reqPct,
        isComplete: reqPct === 100,
      };
      saveToStorage(result);
      return result;
    }
  }

  // Fill slots from extracted entities
  if (entities) {
    fillSlotsFromEntities(newSlots, entities, trimmed, state);
  }

  // Determine response
  const responseMsg = generateResponse(newSlots, entities, state);

  // Update phase based on what's filled
  updatePhase(newSlots);

  const filledPct = getFilledPercentage(newSlots);
  const reqPct = getRequiredFilledPercentage(newSlots);
  const isComplete = reqPct === 100;

  const result: ConversationState = {
    messages: [...state.messages, userMsg, responseMsg],
    slots: newSlots,
    filledPercentage: filledPct,
    requiredFilledPercentage: reqPct,
    isComplete,
  };
  saveToStorage(result);
  return result;
}

function fillSlotsFromEntities(
  slots: SlotState,
  entities: ExtractedEntities,
  rawText: string,
  prevState: ConversationState,
): void {
  // Email
  if (entities.email && !slots.values.has('personal.email')) {
    slots.values.set('personal.email', entities.email);
  }

  // Phone
  if (entities.phone && !slots.values.has('personal.phone')) {
    slots.values.set('personal.phone', entities.phone);
  }

  // LinkedIn
  if (entities.linkedin && !slots.values.has('personal.linkedin')) {
    slots.values.set('personal.linkedin', entities.linkedin);
  }

  // GitHub
  if (entities.github && !slots.values.has('personal.github')) {
    slots.values.set('personal.github', entities.github);
  }

  // GPA
  if (entities.gpa && !slots.values.has('education[].gpa')) {
    slots.values.set('education[].gpa', entities.gpa);
  }

  // Degree
  if (entities.degree && !slots.values.has('education[].degree')) {
    slots.values.set('education[].degree', entities.degree);
  }

  // Skills (accumulate)
  if (entities.skills.length > 0) {
    const existing = slots.values.get('skills[]');
    const prev = Array.isArray(existing) ? existing : [];
    const merged = [...new Set([...prev, ...entities.skills])];
    slots.values.set('skills[]', merged);
  }

  // Name extraction (Bug 5: case-insensitive, Hindi patterns, proper capitalization)
  if (!slots.values.has('personal.name')) {
    const nameMatch =
      rawText.match(/(?:my name is|i'm|i am|call me|this is)\s+([a-z]+(?:\s[a-z]+){0,2})/i) ||
      rawText.match(/(?:mera naam|main)\s+([a-z]+(?:\s[a-z]+){0,2})(?:\s+(?:hai|hoon|hu))?/i) ||
      rawText.match(/^([a-z]+(?:\s[a-z]+){0,2})(?:\s+from\s|\s*$)/i);
    if (nameMatch) {
      const raw = nameMatch[1].trim();
      // Proper case: "rahul sharma" -> "Rahul Sharma"
      const properCased = raw
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      slots.values.set('personal.name', properCased);
    }
  }

  // Location extraction
  if (!slots.values.has('personal.location')) {
    const locMatch = rawText.match(
      /(?:from|in|at|based in|located in|live in|living in)\s+([A-Z][a-zA-Z]+(?:[,\s]+[A-Z][a-zA-Z]+)*)/i,
    );
    if (locMatch) {
      slots.values.set('personal.location', locMatch[1].trim());
    }
  }

  // Year extraction for education
  if (entities.dates.length > 0 && !slots.values.has('education[].year')) {
    // Use the most recent year as graduation year
    const years = entities.dates.map(Number).filter((y) => y >= 1990 && y <= 2030);
    if (years.length > 0) {
      slots.values.set('education[].year', String(Math.max(...years)));
    }
  }

  // Institution extraction (Bug 6: whitelist + fallback for any university/college/institute)
  if (!slots.values.has('education[].institution')) {
    // Quick match: known prefixes
    const instMatch = rawText.match(
      /(?:from|at)\s+((?:IIT|NIT|IIIT|BITS|VIT|SRM|Amity|Shoolini|Delhi|Mumbai|Manipal|Jadavpur|Anna|Osmania|JNTU|Pune|Bangalore|Hyderabad|Chennai|Kolkata)\s*[A-Za-z\s]*)/i,
    );
    if (instMatch) {
      slots.values.set('education[].institution', instMatch[1].trim());
    } else {
      // Fallback: "from/at X University/College/Institute/School/Academy"
      const fallbackInst = rawText.match(
        /(?:from|at|in)\s+([A-Z][a-zA-Z\s]+(?:University|College|Institute|School|Academy|Vidyalaya|Vishwavidyalaya))/i,
      );
      if (fallbackInst) {
        slots.values.set('education[].institution', fallbackInst[1].trim());
      } else {
        // "B.Tech from X" where X is a capitalized multi-word phrase (at least 2 words)
        const degreeFrom = rawText.match(
          /(?:B\.?Tech|M\.?Tech|B\.?Sc|M\.?Sc|B\.?E|M\.?E|MBA|MCA|BCA|PhD)\s+(?:from|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/i,
        );
        if (degreeFrom) {
          slots.values.set('education[].institution', degreeFrom[1].trim());
        }
      }
    }
  }

  // Field of study extraction
  if (!slots.values.has('education[].field')) {
    const fieldMatch = rawText.match(
      /(?:in|studying|studied|major(?:ing)? in)\s+(Computer Science|CS|Information Technology|IT|Electronics|Electrical|Mechanical|Civil|Chemical|Biotechnology|Data Science|Artificial Intelligence|AI|Machine Learning|Mathematics|Physics|Commerce|Business|Management|Arts|Design|Architecture)/i,
    );
    if (fieldMatch) {
      slots.values.set('education[].field', fieldMatch[1].trim());
    }
  }

  // Target role extraction
  if (!slots.values.has('target_role')) {
    const roleMatch = rawText.match(
      /(?:looking for|want to be|aiming for|targeting|interested in|going for)\s+(?:a\s+)?(.+?)(?:\.|$)/i,
    );
    if (roleMatch) {
      slots.values.set('target_role', roleMatch[1].trim());
    }
  }

  // Experience: company and role (Bug 1: support multiple entries)
  {
    const compMatch = rawText.match(
      /(?:worked at|interned at|joined|working at|at)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/i,
    );
    const roleMatch = rawText.match(
      /(?:as a|as an|role:?|position:?|worked as)\s+([A-Za-z\s]+?)(?:\s+at\s|\s*$|\.|,)/i,
    );
    const dateRange = entities.dateRanges.length > 0
      ? `${entities.dateRanges[0].start} - ${entities.dateRanges[0].end}`
      : '';

    if (compMatch || roleMatch) {
      const company = compMatch ? compMatch[1].trim() : '';
      const role = roleMatch ? roleMatch[1].trim() : '';

      // If this is the first experience entry, fill the flat slots for backward compat
      if (!slots.values.has('experience[].company')) {
        if (company) slots.values.set('experience[].company', company);
        if (role) slots.values.set('experience[].role', role);
        if (dateRange) slots.values.set('experience[].dates', dateRange);
      } else {
        // Already have one entry. Commit current flat entry to array if not already done,
        // then store the new entry.
        commitCurrentExperienceToArray(slots);
      }

      // Always add to array entries for multi-entry support
      const fields: Record<string, string> = {};
      if (company) fields.company = company;
      if (role) fields.role = role;
      if (dateRange) fields.dates = dateRange;
      addArrayEntry(slots, 'experience', fields);
    }

    // Experience date ranges for current entry (no new company/role mentioned)
    if (!compMatch && !roleMatch && dateRange && slots.values.has('experience[].company') && !slots.values.has('experience[].dates')) {
      slots.values.set('experience[].dates', dateRange);
    }
  }

  // Experience bullets: accumulate descriptive sentences about work
  if (slots.values.has('experience[].company') || slots.values.has('experience[].role')) {
    const bulletMatch = rawText.match(
      /(?:I |i |we |We )(?:built|developed|designed|led|managed|created|implemented|reduced|increased|improved|launched|deployed|migrated|optimized|integrated|automated|architected|delivered)(.+)/i,
    );
    if (bulletMatch) {
      const existing = slots.values.get('experience[].bullets[]');
      const prev = Array.isArray(existing) ? [...existing] : [];
      prev.push(rawText.trim());
      slots.values.set('experience[].bullets[]', prev);
    }
  }

  // Project name (Bug 1: support multiple entries)
  {
    const projMatch = rawText.match(
      /(?:built|created|made|developed|worked on)\s+(?:a\s+)?(?:project\s+(?:called\s+)?)?([A-Za-z][\w\s-]+?)(?:\s+using|\s+with|\s*\.|$)/i,
    );
    if (projMatch) {
      const projName = projMatch[1].trim();
      if (!slots.values.has('projects[].name')) {
        slots.values.set('projects[].name', projName);
      }
      // Always add to array entries
      addArrayEntry(slots, 'projects', { name: projName });
    }
  }
}

/**
 * Commit the current flat experience slots into the array entries store,
 * then update flat slots with the new entry's data.
 */
function commitCurrentExperienceToArray(slots: SlotState): void {
  const company = slots.values.get('experience[].company') as string || '';
  const role = slots.values.get('experience[].role') as string || '';
  const dates = slots.values.get('experience[].dates') as string || '';
  const bullets = slots.values.get('experience[].bullets[]');

  // Check if already committed (first entry is already in array from initial add)
  // Clear flat slots so next entry can fill them
  slots.values.delete('experience[].role' as SlotId);
  slots.values.delete('experience[].dates' as SlotId);
  slots.values.delete('experience[].bullets[]' as SlotId);
  // Keep experience[].company so the slot stays "filled" for phase logic
}

function slotDoneOrSkipped(slots: SlotState, id: SlotId): boolean {
  return slots.values.has(id) || slots.skippedSlots.has(id);
}

function updatePhase(slots: SlotState): void {
  const nameSet = slots.values.has('personal.name');
  const locationSet = slots.values.has('personal.location');
  const eduDone =
    slotDoneOrSkipped(slots, 'education[].degree') &&
    slotDoneOrSkipped(slots, 'education[].institution') &&
    slotDoneOrSkipped(slots, 'education[].year') &&
    slotDoneOrSkipped(slots, 'education[].field');
  const emailSet = slots.values.has('personal.email');
  const phoneSet = slots.values.has('personal.phone');

  const expDone = slotDoneOrSkipped(slots, 'experience[].company');
  const projDone = slotDoneOrSkipped(slots, 'projects[].name');
  const skillsDone = slotDoneOrSkipped(slots, 'skills[]') &&
    (!Array.isArray(slots.values.get('skills[]')) || (slots.values.get('skills[]') as string[]).length > 0 || slots.skippedSlots.has('skills[]'));

  if (!nameSet || !locationSet) {
    slots.phase = 'warmup';
  } else if (!eduDone) {
    slots.phase = 'education';
  } else if (!expDone && !projDone) {
    slots.phase = 'experience';
  } else if (!projDone && expDone) {
    slots.phase = 'projects';
  } else if (!skillsDone) {
    slots.phase = 'skills';
  } else if (!emailSet || !phoneSet) {
    slots.phase = 'wrapup';
  } else {
    slots.phase = 'review';
  }
}

function generateResponse(
  slots: SlotState,
  entities: ExtractedEntities | null,
  prevState: ConversationState,
): ChatMessage {
  const name = (slots.values.get('personal.name') as string) || '';
  const location = (slots.values.get('personal.location') as string) || '';
  const degree = (slots.values.get('education[].degree') as string) || '';
  const institution = (slots.values.get('education[].institution') as string) || '';
  const year = (slots.values.get('education[].year') as string) || '';
  const field = (slots.values.get('education[].field') as string) || '';
  const company = (slots.values.get('experience[].company') as string) || '';
  const role = (slots.values.get('experience[].role') as string) || '';
  const skills = slots.values.get('skills[]');
  const skillsList = Array.isArray(skills) ? skills.join(', ') : '';
  const project = (slots.values.get('projects[].name') as string) || '';

  const vars = {
    name,
    location,
    degree,
    institution,
    year,
    field,
    company,
    role,
    skills_list: skillsList,
    project,
  };

  let key: ResponseKey;

  // Determine what was just filled and respond accordingly
  const prevSlots = prevState.slots.values;
  const justFilledName = !prevSlots.has('personal.name') && slots.values.has('personal.name');
  const justFilledLocation = !prevSlots.has('personal.location') && slots.values.has('personal.location');
  const justFilledEdu =
    !prevSlots.has('education[].degree') && slots.values.has('education[].degree') &&
    slots.values.has('education[].institution');
  const justFilledRole =
    !prevSlots.has('experience[].role') && slots.values.has('experience[].role');

  if (justFilledName && !slots.values.has('personal.location')) {
    key = 'warmup.name_ack';
  } else if (justFilledLocation) {
    key = 'warmup.location_ack';
  } else if (justFilledEdu && degree && institution) {
    key = 'education.acknowledged';
  } else if (justFilledRole && company) {
    key = 'experience.role_ack';
  } else {
    // Fall back to asking for next unfilled slot
    const nextSlot = getNextUnfilledSlot(slots);
    if (!nextSlot) {
      key = 'review.show';
    } else {
      key = phaseToAskKey(nextSlot.phase, slots);
    }
  }

  const text = getResponse(key, vars);

  return {
    id: msgId(),
    role: 'saathi',
    text,
    timestamp: Date.now(),
  };
}

function phaseToAskKey(phase: ConversationPhase, slots: SlotState): ResponseKey {
  switch (phase) {
    case 'warmup': {
      if (!slots.values.has('personal.name')) return 'greeting';
      if (!slots.values.has('personal.location')) return 'warmup.name_ack';
      return 'warmup.target_role_ask';
    }
    case 'education':
      return 'education.ask';
    case 'experience':
      return 'experience.ask';
    case 'projects':
      return 'projects.ask';
    case 'skills':
      return 'skills.confirm';
    case 'wrapup':
      return 'wrapup.contact_ask';
    case 'review':
      return 'review.show';
  }
}
