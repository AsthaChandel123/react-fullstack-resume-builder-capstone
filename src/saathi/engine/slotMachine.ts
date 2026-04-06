// /mnt/experiments/astha-resume/src/saathi/engine/slotMachine.ts

import {
  createSlotState,
  getNextUnfilledSlot,
  getFilledPercentage,
  getRequiredFilledPercentage,
  getPhaseForSlot,
  type SlotState,
  type SlotId,
  type ConversationPhase,
} from './slots';
import { extractEntities, type ExtractedEntities } from './entityExtractor';
import { getGreeting, getResponse, type ResponseKey } from './responseBank';

export interface ChatMessage {
  id: string;
  role: 'user' | 'saathi';
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

/**
 * Process a user message: extract entities, fill slots, generate response.
 * Returns a new ConversationState (immutable).
 */
export function processUserInput(
  state: ConversationState,
  input: string,
): ConversationState {
  const trimmed = input.trim();

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

  return {
    messages: [...state.messages, userMsg, responseMsg],
    slots: newSlots,
    filledPercentage: filledPct,
    requiredFilledPercentage: reqPct,
    isComplete,
  };
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

  // Name extraction (first message without other structured data, or "I'm X" / "My name is X")
  if (!slots.values.has('personal.name')) {
    const nameMatch =
      rawText.match(/(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i) ||
      rawText.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)(?:\s+from\s|\s*$)/);
    if (nameMatch) {
      slots.values.set('personal.name', nameMatch[1].trim());
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

  // Institution extraction (look for common patterns)
  if (!slots.values.has('education[].institution')) {
    const instMatch = rawText.match(
      /(?:from|at)\s+((?:IIT|NIT|IIIT|BITS|VIT|SRM|Amity|Shoolini|Delhi|Mumbai|Manipal|Jadavpur|Anna|Osmania|JNTU|Pune|Bangalore|Hyderabad|Chennai|Kolkata)\s*[A-Za-z\s]*)/i,
    );
    if (instMatch) {
      slots.values.set('education[].institution', instMatch[1].trim());
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

  // Experience: company and role
  if (!slots.values.has('experience[].company')) {
    const compMatch = rawText.match(
      /(?:worked at|interned at|joined|working at|at)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/i,
    );
    if (compMatch) {
      slots.values.set('experience[].company', compMatch[1].trim());
    }
  }

  if (!slots.values.has('experience[].role')) {
    const roleMatch = rawText.match(
      /(?:as a|as an|role:?|position:?|worked as)\s+([A-Za-z\s]+?)(?:\s+at\s|\s*$|\.|,)/i,
    );
    if (roleMatch) {
      slots.values.set('experience[].role', roleMatch[1].trim());
    }
  }

  // Experience date ranges
  if (entities.dateRanges.length > 0 && !slots.values.has('experience[].dates')) {
    const range = entities.dateRanges[0];
    slots.values.set('experience[].dates', `${range.start} - ${range.end}`);
  }

  // Experience bullets: accumulate descriptive sentences about work
  if (slots.values.has('experience[].company') || slots.values.has('experience[].role')) {
    const bulletMatch = rawText.match(
      /(?:I |i |we |We )(?:built|developed|designed|led|managed|created|implemented|reduced|increased|improved|launched|deployed|migrated|optimized|integrated|automated|architected|delivered)(.+)/i,
    );
    if (bulletMatch) {
      const existing = slots.values.get('experience[].bullets[]');
      const prev = Array.isArray(existing) ? existing : [];
      prev.push(rawText.trim());
      slots.values.set('experience[].bullets[]', prev);
    }
  }

  // Project name
  if (!slots.values.has('projects[].name')) {
    const projMatch = rawText.match(
      /(?:built|created|made|developed|worked on)\s+(?:a\s+)?(?:project\s+(?:called\s+)?)?([A-Za-z][\w\s-]+?)(?:\s+using|\s+with|\s*\.|$)/i,
    );
    if (projMatch) {
      slots.values.set('projects[].name', projMatch[1].trim());
    }
  }
}

function updatePhase(slots: SlotState): void {
  const nameSet = slots.values.has('personal.name');
  const locationSet = slots.values.has('personal.location');
  const eduDone =
    slots.values.has('education[].degree') &&
    slots.values.has('education[].institution') &&
    slots.values.has('education[].year') &&
    slots.values.has('education[].field');
  const emailSet = slots.values.has('personal.email');
  const phoneSet = slots.values.has('personal.phone');

  if (!nameSet || !locationSet) {
    slots.phase = 'warmup';
  } else if (!eduDone) {
    slots.phase = 'education';
  } else if (!slots.values.has('experience[].company') && !slots.values.has('projects[].name')) {
    slots.phase = 'experience';
  } else if (!slots.values.has('projects[].name') && slots.values.has('experience[].company')) {
    slots.phase = 'projects';
  } else if (!slots.values.has('skills[]') || (Array.isArray(slots.values.get('skills[]')) && (slots.values.get('skills[]') as string[]).length === 0)) {
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
