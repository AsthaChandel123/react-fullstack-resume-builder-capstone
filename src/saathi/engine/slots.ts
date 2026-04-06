// /mnt/experiments/astha-resume/src/saathi/engine/slots.ts

export type ConversationPhase =
  | 'warmup'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'wrapup'
  | 'review';

export type SlotId =
  | 'personal.name'
  | 'personal.email'
  | 'personal.phone'
  | 'personal.location'
  | 'personal.linkedin'
  | 'personal.github'
  | 'education[].degree'
  | 'education[].institution'
  | 'education[].year'
  | 'education[].field'
  | 'education[].gpa'
  | 'experience[].company'
  | 'experience[].role'
  | 'experience[].dates'
  | 'experience[].bullets[]'
  | 'projects[].name'
  | 'projects[].tech'
  | 'projects[].outcome'
  | 'skills[]'
  | 'certifications[]'
  | 'summary'
  | 'relocation_preference'
  | 'target_role';

export interface SlotDefinition {
  id: SlotId;
  phase: ConversationPhase;
  required: boolean;
  /** Whether this slot accepts multiple values (arrays) */
  isArray: boolean;
  /** Human-readable label for progress display */
  label: string;
}

export interface SlotState {
  /** SlotId -> value (string for single, string[] for arrays) */
  values: Map<SlotId, string | string[]>;
  /** Current conversation phase */
  phase: ConversationPhase;
  /** Index within array slots (e.g., which experience entry) */
  arrayIndices: Map<string, number>;
  /** Slots explicitly skipped by the user (negation / "no projects" etc.) */
  skippedSlots: Set<SlotId>;
}

/** Prefixes for sections that store multiple entries as JSON arrays */
export const ARRAY_SECTION_PREFIXES = ['experience', 'projects', 'education'] as const;
export type ArraySectionPrefix = (typeof ARRAY_SECTION_PREFIXES)[number];

/**
 * Add a new entry to an array section (experience, projects, education).
 * Each entry is a JSON-serialized object stored in a string[] under
 * a synthetic slot key like `experience[]._entries`.
 */
export function addArrayEntry(
  state: SlotState,
  prefix: ArraySectionPrefix,
  fields: Record<string, string>,
): void {
  const key = `${prefix}[]._entries` as SlotId;
  const existing = state.values.get(key);
  const arr: string[] = Array.isArray(existing) ? [...existing] : [];
  arr.push(JSON.stringify(fields));
  state.values.set(key, arr);
}

/**
 * Get parsed array entries for a section.
 */
export function getArrayEntries(
  state: SlotState,
  prefix: ArraySectionPrefix,
): Record<string, string>[] {
  const key = `${prefix}[]._entries` as SlotId;
  const raw = state.values.get(key);
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    try { return JSON.parse(s); }
    catch { return {}; }
  });
}

/** Negation pattern: user wants to skip a section */
export const NEGATION_RE = /^(no|none|i don'?t have|nothing|skip|na|nahi|nhi|not applicable)\b/i;

export const REQUIRED_SLOTS: SlotDefinition[] = [
  { id: 'personal.name', phase: 'warmup', required: true, isArray: false, label: 'Name' },
  { id: 'personal.email', phase: 'wrapup', required: true, isArray: false, label: 'Email' },
  { id: 'personal.phone', phase: 'wrapup', required: true, isArray: false, label: 'Phone' },
  { id: 'personal.location', phase: 'warmup', required: true, isArray: false, label: 'Location' },
  { id: 'education[].degree', phase: 'education', required: true, isArray: false, label: 'Degree' },
  { id: 'education[].institution', phase: 'education', required: true, isArray: false, label: 'Institution' },
  { id: 'education[].year', phase: 'education', required: true, isArray: false, label: 'Graduation year' },
  { id: 'education[].field', phase: 'education', required: true, isArray: false, label: 'Field of study' },
];

export const PREFERRED_SLOTS: SlotDefinition[] = [
  { id: 'education[].gpa', phase: 'education', required: false, isArray: false, label: 'GPA' },
  { id: 'experience[].company', phase: 'experience', required: false, isArray: false, label: 'Company' },
  { id: 'experience[].role', phase: 'experience', required: false, isArray: false, label: 'Role' },
  { id: 'experience[].dates', phase: 'experience', required: false, isArray: false, label: 'Dates' },
  { id: 'experience[].bullets[]', phase: 'experience', required: false, isArray: true, label: 'What you did' },
  { id: 'projects[].name', phase: 'projects', required: false, isArray: false, label: 'Project name' },
  { id: 'projects[].tech', phase: 'projects', required: false, isArray: false, label: 'Technologies' },
  { id: 'projects[].outcome', phase: 'projects', required: false, isArray: false, label: 'Outcome' },
  { id: 'skills[]', phase: 'skills', required: false, isArray: true, label: 'Skills' },
  { id: 'certifications[]', phase: 'wrapup', required: false, isArray: true, label: 'Certifications' },
  { id: 'summary', phase: 'wrapup', required: false, isArray: false, label: 'Summary' },
  { id: 'personal.linkedin', phase: 'wrapup', required: false, isArray: false, label: 'LinkedIn' },
  { id: 'personal.github', phase: 'wrapup', required: false, isArray: false, label: 'GitHub' },
  { id: 'relocation_preference', phase: 'warmup', required: false, isArray: false, label: 'Relocation preference' },
  { id: 'target_role', phase: 'warmup', required: false, isArray: false, label: 'Target role' },
];

export const ALL_SLOTS: SlotDefinition[] = [...REQUIRED_SLOTS, ...PREFERRED_SLOTS];

const PHASE_ORDER: ConversationPhase[] = [
  'warmup',
  'education',
  'experience',
  'projects',
  'skills',
  'wrapup',
  'review',
];

export function createSlotState(): SlotState {
  return {
    values: new Map(),
    phase: 'warmup',
    arrayIndices: new Map(),
    skippedSlots: new Set(),
  };
}

export function isSlotFilled(state: SlotState, slotId: SlotId): boolean {
  const value = state.values.get(slotId);
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
}

export function getFilledPercentage(state: SlotState): number {
  const total = ALL_SLOTS.length;
  if (total === 0) return 0;
  let filled = 0;
  for (const slot of ALL_SLOTS) {
    if (isSlotFilled(state, slot.id)) filled++;
  }
  return Math.round((filled / total) * 100);
}

export function getRequiredFilledPercentage(state: SlotState): number {
  const total = REQUIRED_SLOTS.length;
  if (total === 0) return 0;
  let filled = 0;
  for (const slot of REQUIRED_SLOTS) {
    if (isSlotFilled(state, slot.id)) filled++;
  }
  return Math.round((filled / total) * 100);
}

export function isSlotSkipped(state: SlotState, slotId: SlotId): boolean {
  return state.skippedSlots.has(slotId);
}

export function getNextUnfilledSlot(state: SlotState): SlotDefinition | null {
  // Required slots first, in phase order
  for (const phase of PHASE_ORDER) {
    for (const slot of REQUIRED_SLOTS) {
      if (slot.phase === phase && !isSlotFilled(state, slot.id) && !isSlotSkipped(state, slot.id)) {
        return slot;
      }
    }
  }
  // Then preferred, in phase order
  for (const phase of PHASE_ORDER) {
    for (const slot of PREFERRED_SLOTS) {
      if (slot.phase === phase && !isSlotFilled(state, slot.id) && !isSlotSkipped(state, slot.id)) {
        return slot;
      }
    }
  }
  return null;
}

/**
 * Skip all slots belonging to a given phase.
 */
export function skipPhaseSlots(state: SlotState, phase: ConversationPhase): void {
  for (const slot of ALL_SLOTS) {
    if (slot.phase === phase && !isSlotFilled(state, slot.id)) {
      state.skippedSlots.add(slot.id);
    }
  }
}

export function getPhaseForSlot(slotId: SlotId): ConversationPhase {
  const slot = ALL_SLOTS.find((s) => s.id === slotId);
  return slot?.phase ?? 'warmup';
}

export function getPhaseIndex(phase: ConversationPhase): number {
  return PHASE_ORDER.indexOf(phase);
}
