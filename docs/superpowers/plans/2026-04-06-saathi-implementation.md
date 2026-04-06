# Saathi Implementation Plan

**Date:** 2026-04-06
**Spec:** `/mnt/experiments/astha-resume/docs/superpowers/specs/2026-04-06-saathi-reimagine-design.md`
**Status:** Ready to execute

## Goal

Transform the ResumeAI app from a form-based resume builder into a conversational companion ("Saathi") that builds resumes through natural conversation, scores job wellbeing across 8 research-backed parameters, and shows candidates a career health dashboard.

## Architecture

```
src/
  saathi/                          # NEW: Conversational builder engine
    engine/
      slotMachine.ts               # State machine for conversation flow
      slots.ts                     # Slot definitions and validation
      responseBank.ts              # 200+ response templates
      entityExtractor.ts           # Regex layer on top of NER
      resumeGenerator.ts           # Slot data -> Resume store
    voice/
      speechInput.ts               # Web Speech API wrapper
      languageDetect.ts            # Script-based language detection
    components/
      SaathiChat.tsx               # Main chat UI
      ChatBubble.tsx               # Individual message bubble
      VoiceButton.tsx              # Mic toggle with visual feedback
      SlotProgress.tsx             # Visual progress indicator
    __tests__/
      slotMachine.test.ts
      responseBank.test.ts
      entityExtractor.test.ts
      resumeGenerator.test.ts
      speechInput.test.ts
      SaathiChat.test.tsx
  wellbeing/                       # NEW: Wellbeing score engine
    engine/
      wellbeingScorer.ts           # 8-parameter composite scorer
      commuteScorer.ts             # Non-linear commute decay
      formulas.ts                  # All sub-score formulas
      mapsClient.ts                # Google Maps Distance Matrix
      citations.ts                 # Research citation registry
    data/
      cityCoL.ts                   # India city cost-of-living index
      cityAQI.ts                   # City AQI averages
      cityWBGT.ts                  # City WBGT averages
      attritionRates.ts            # Industry attrition data
      transitCosts.ts              # City transit costs
      fuelRate.ts                  # Current fuel rate
    __tests__/
      wellbeingScorer.test.ts
      commuteScorer.test.ts
      formulas.test.ts
      mapsClient.test.ts
  pages/
    SaathiBuilder.tsx              # NEW: /builder route (Saathi)
    BuilderLegacy.tsx              # RENAMED: old Builder.tsx -> /builder/form
    CandidateDashboard.tsx         # NEW: /builder/dashboard
  theme/
    tokens.css                     # MODIFIED: add positive aura tokens
```

## Tech Stack

- React 19 + TypeScript + Vite 6 + Tailwind CSS 4 (existing)
- Zustand 5 (existing state management)
- Web Speech API (browser native, zero download)
- @huggingface/transformers (already in package.json, for DistilBERT-NER ONNX)
- Google Maps Distance Matrix API (for commute calculation)
- Vitest + React Testing Library (existing test setup)

## Commits

After each phase, commit with a descriptive message.

---

## Phase 1: Positive Aura Design Tokens

### Task 1.1: Add warm design tokens to tokens.css

**File:** `/mnt/experiments/astha-resume/src/theme/tokens.css`
**Action:** Modify

Add new CSS custom properties for the Saathi positive aura design system. Keep all existing tokens intact for backward compatibility.

**Test first:** `/mnt/experiments/astha-resume/src/theme/__tests__/tokens.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('design tokens', () => {
  it('defines positive aura tokens on :root', () => {
    // Load the CSS file and verify tokens exist
    const css = require('fs').readFileSync(
      require('path').resolve(__dirname, '../tokens.css'),
      'utf-8'
    );
    const requiredTokens = [
      '--saathi-bg-warm',
      '--saathi-bg-cream',
      '--saathi-accent-teal',
      '--saathi-success',
      '--saathi-warning',
      '--saathi-concern',
      '--saathi-radius',
      '--saathi-spacing',
      '--saathi-line-height',
      '--saathi-transition',
    ];
    for (const token of requiredTokens) {
      expect(css).toContain(token);
    }
  });

  it('preserves existing tokens', () => {
    const css = require('fs').readFileSync(
      require('path').resolve(__dirname, '../tokens.css'),
      'utf-8'
    );
    expect(css).toContain('--accent-red');
    expect(css).toContain('--accent-navy');
    expect(css).toContain('--accent-gold');
  });
});
```

**Implementation:** Add to `:root, .light` block in `/mnt/experiments/astha-resume/src/theme/tokens.css`:

```css
  /* Saathi Positive Aura tokens (spec section 5.3) */
  --saathi-bg-warm: #fefefe;
  --saathi-bg-cream: #faf7f2;
  --saathi-accent-teal: #0d9488;
  --saathi-accent-teal-light: rgba(13, 148, 136, 0.1);
  --saathi-success: rgba(34, 197, 94, 0.15);
  --saathi-success-text: #16a34a;
  --saathi-warning: #f59e0b;
  --saathi-warning-bg: rgba(245, 158, 11, 0.1);
  --saathi-concern: rgba(244, 63, 94, 0.6);
  --saathi-concern-bg: rgba(244, 63, 94, 0.08);
  --saathi-radius: 12px;
  --saathi-spacing: 24px;
  --saathi-line-height: 1.7;
  --saathi-transition: 200ms ease;
```

Add to `.dark` block:

```css
  /* Saathi Positive Aura tokens (dark mode) */
  --saathi-bg-warm: #0f1a24;
  --saathi-bg-cream: #131f2b;
  --saathi-accent-teal: #2dd4bf;
  --saathi-accent-teal-light: rgba(45, 212, 191, 0.15);
  --saathi-success: rgba(34, 197, 94, 0.2);
  --saathi-success-text: #4ade80;
  --saathi-warning: #fbbf24;
  --saathi-warning-bg: rgba(251, 191, 36, 0.15);
  --saathi-concern: rgba(251, 113, 133, 0.7);
  --saathi-concern-bg: rgba(251, 113, 133, 0.12);
  --saathi-radius: 12px;
  --saathi-spacing: 24px;
  --saathi-line-height: 1.7;
  --saathi-transition: 200ms ease;
```

**Commit:** `feat: add Saathi positive aura design tokens`

---

## Phase 2: Slot-Filling State Machine (Conversation Engine)

### Task 2.1: Define slot types and validation

**File:** `/mnt/experiments/astha-resume/src/saathi/engine/slots.ts` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/saathi/__tests__/slots.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  REQUIRED_SLOTS,
  PREFERRED_SLOTS,
  ALL_SLOTS,
  createSlotState,
  isSlotFilled,
  getFilledPercentage,
  getNextUnfilledSlot,
  type SlotState,
  type SlotId,
} from '../engine/slots';

describe('slots', () => {
  it('defines all required slots from spec', () => {
    const requiredIds = REQUIRED_SLOTS.map((s) => s.id);
    expect(requiredIds).toContain('personal.name');
    expect(requiredIds).toContain('personal.email');
    expect(requiredIds).toContain('personal.phone');
    expect(requiredIds).toContain('personal.location');
    expect(requiredIds).toContain('education[].degree');
    expect(requiredIds).toContain('education[].institution');
    expect(requiredIds).toContain('education[].year');
    expect(requiredIds).toContain('education[].field');
    expect(requiredIds.length).toBe(8);
  });

  it('defines all preferred slots from spec', () => {
    const prefIds = PREFERRED_SLOTS.map((s) => s.id);
    expect(prefIds).toContain('education[].gpa');
    expect(prefIds).toContain('experience[].company');
    expect(prefIds).toContain('experience[].role');
    expect(prefIds).toContain('experience[].dates');
    expect(prefIds).toContain('experience[].bullets[]');
    expect(prefIds).toContain('projects[].name');
    expect(prefIds).toContain('projects[].tech');
    expect(prefIds).toContain('projects[].outcome');
    expect(prefIds).toContain('skills[]');
    expect(prefIds).toContain('certifications[]');
    expect(prefIds).toContain('summary');
    expect(prefIds).toContain('personal.linkedin');
    expect(prefIds).toContain('personal.github');
    expect(prefIds).toContain('relocation_preference');
    expect(prefIds).toContain('target_role');
  });

  it('creates empty slot state', () => {
    const state = createSlotState();
    expect(getFilledPercentage(state)).toBe(0);
    expect(isSlotFilled(state, 'personal.name')).toBe(false);
  });

  it('tracks filled slots', () => {
    const state = createSlotState();
    state.values.set('personal.name', 'Rahul');
    expect(isSlotFilled(state, 'personal.name')).toBe(true);
    expect(getFilledPercentage(state)).toBeGreaterThan(0);
  });

  it('getNextUnfilledSlot returns required slots first', () => {
    const state = createSlotState();
    const next = getNextUnfilledSlot(state);
    expect(next).not.toBeNull();
    const requiredIds = REQUIRED_SLOTS.map((s) => s.id);
    expect(requiredIds).toContain(next!.id);
  });

  it('getNextUnfilledSlot returns preferred after all required filled', () => {
    const state = createSlotState();
    for (const slot of REQUIRED_SLOTS) {
      state.values.set(slot.id, 'test-value');
    }
    const next = getNextUnfilledSlot(state);
    if (next) {
      const prefIds = PREFERRED_SLOTS.map((s) => s.id);
      expect(prefIds).toContain(next.id);
    }
  });
});
```

**Implementation:**

```typescript
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
}

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

export function getNextUnfilledSlot(state: SlotState): SlotDefinition | null {
  // Required slots first, in phase order
  for (const phase of PHASE_ORDER) {
    for (const slot of REQUIRED_SLOTS) {
      if (slot.phase === phase && !isSlotFilled(state, slot.id)) {
        return slot;
      }
    }
  }
  // Then preferred, in phase order
  for (const phase of PHASE_ORDER) {
    for (const slot of PREFERRED_SLOTS) {
      if (slot.phase === phase && !isSlotFilled(state, slot.id)) {
        return slot;
      }
    }
  }
  return null;
}

export function getPhaseForSlot(slotId: SlotId): ConversationPhase {
  const slot = ALL_SLOTS.find((s) => s.id === slotId);
  return slot?.phase ?? 'warmup';
}

export function getPhaseIndex(phase: ConversationPhase): number {
  return PHASE_ORDER.indexOf(phase);
}
```

### Task 2.2: Build the response template bank

**File:** `/mnt/experiments/astha-resume/src/saathi/engine/responseBank.ts` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/saathi/__tests__/responseBank.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  getGreeting,
  getResponse,
  RESPONSE_TEMPLATES,
  type ResponseKey,
} from '../engine/responseBank';

describe('responseBank', () => {
  it('has at least 3 greeting variants', () => {
    expect(RESPONSE_TEMPLATES['greeting'].length).toBeGreaterThanOrEqual(3);
  });

  it('has templates for every conversation phase', () => {
    const phases: ResponseKey[] = [
      'greeting',
      'warmup.name_ack',
      'warmup.location_ack',
      'warmup.target_role_ask',
      'education.ask',
      'education.acknowledged',
      'education.gpa_ask',
      'experience.ask',
      'experience.role_ack',
      'experience.bullets_ask',
      'experience.another_ask',
      'projects.ask',
      'projects.tech_ask',
      'projects.outcome_ask',
      'projects.another_ask',
      'skills.confirm',
      'skills.missing_ask',
      'wrapup.contact_ask',
      'wrapup.summary_offer',
      'review.show',
      'review.edit_ask',
      'deviation.return',
      'encouragement',
      'clarification',
    ];
    for (const key of phases) {
      expect(RESPONSE_TEMPLATES[key], `Missing template: ${key}`).toBeDefined();
      expect(RESPONSE_TEMPLATES[key].length, `Empty template: ${key}`).toBeGreaterThan(0);
    }
  });

  it('has at least 200 total template variants', () => {
    let total = 0;
    for (const variants of Object.values(RESPONSE_TEMPLATES)) {
      total += variants.length;
    }
    expect(total).toBeGreaterThanOrEqual(200);
  });

  it('getGreeting returns a string without template markers', () => {
    const greeting = getGreeting();
    expect(greeting).not.toContain('{{');
    expect(greeting.length).toBeGreaterThan(10);
  });

  it('getResponse interpolates variables', () => {
    const result = getResponse('warmup.name_ack', { name: 'Rahul' });
    expect(result).toContain('Rahul');
    expect(result).not.toContain('{{name}}');
  });

  it('rotates variants to avoid repetition', () => {
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(getResponse('encouragement', {}));
    }
    // Should get more than 1 unique variant in 10 calls
    expect(results.size).toBeGreaterThan(1);
  });
});
```

**Implementation:**

```typescript
// /mnt/experiments/astha-resume/src/saathi/engine/responseBank.ts

export type ResponseKey =
  | 'greeting'
  | 'warmup.name_ack'
  | 'warmup.location_ack'
  | 'warmup.target_role_ask'
  | 'education.ask'
  | 'education.acknowledged'
  | 'education.gpa_ask'
  | 'experience.ask'
  | 'experience.role_ack'
  | 'experience.bullets_ask'
  | 'experience.another_ask'
  | 'projects.ask'
  | 'projects.tech_ask'
  | 'projects.outcome_ask'
  | 'projects.another_ask'
  | 'skills.confirm'
  | 'skills.missing_ask'
  | 'wrapup.contact_ask'
  | 'wrapup.summary_offer'
  | 'review.show'
  | 'review.edit_ask'
  | 'deviation.return'
  | 'encouragement'
  | 'clarification';

/**
 * 200+ natural response variants organized by conversation phase.
 * Warm, encouraging, concise. Never corporate-speak.
 * Variables: {{name}}, {{degree}}, {{institution}}, {{year}}, {{field}},
 *            {{company}}, {{role}}, {{skill}}, {{project}}, {{location}},
 *            {{target_role}}, {{skills_list}}
 */
export const RESPONSE_TEMPLATES: Record<ResponseKey, string[]> = {
  greeting: [
    "Hey! I'm Saathi, your resume companion. I'm here to help you put your best self forward. Just talk to me like you would a friend. Any language. Ready when you are.",
    "Welcome! Building a resume shouldn't feel like homework. I'll ask a few questions, you talk, and I'll handle the rest. Sound good?",
    "Hi there! Let's build something that shows who you really are. Speak, type, mix languages. Whatever feels natural. Let's start with the basics: what's your name?",
    "Hello! Think of me as your career buddy. No boring forms, just a conversation. Tell me your name and we'll get started.",
    "Hey! I'm Saathi. Let's skip the form-filling and just talk. What's your name?",
    "Hi! Resume building should be a conversation, not a chore. I'm Saathi, and I'm here to help. What should I call you?",
    "Welcome! I'm Saathi. Let's build your resume together through a simple chat. No stress, no pressure. What's your name?",
    "Hey there! Ready to build a resume that actually represents you? I'm Saathi, your companion for this. What's your name?",
  ],

  'warmup.name_ack': [
    "Nice to meet you, {{name}}! Where are you based?",
    "Great name, {{name}}! Which city are you in?",
    "Hey {{name}}! Good to have you here. Where do you live?",
    "{{name}}, welcome! Tell me where you're located.",
    "Perfect, {{name}}. What city or town are you in?",
    "Got it, {{name}}! And where are you currently based?",
    "{{name}}! Love it. Where are you calling from?",
    "Welcome aboard, {{name}}. Where are you located right now?",
    "Awesome, {{name}}. Quick one: which city are you in?",
    "{{name}}, great to meet you! What's your current location?",
  ],

  'warmup.location_ack': [
    "{{location}}, nice! What kind of role are you looking for?",
    "Cool, {{location}}! What type of work are you interested in?",
    "Got it, {{location}}. What's the dream job? Or at least the next one you're aiming for?",
    "{{location}}! What role or field are you targeting?",
    "Nice, {{location}}. What are you looking to do career-wise?",
    "{{location}}, got it. What kind of positions are you going after?",
    "Great, {{location}}! So what's the goal? What kind of role excites you?",
    "{{location}}, solid. What type of job are you after?",
    "Noted, {{location}}. What's the role you're going for?",
    "{{location}}! Now tell me, what kind of work gets you excited?",
  ],

  'warmup.target_role_ask': [
    "What kind of role are you looking for?",
    "What type of job are you targeting?",
    "What's the dream role? Even a rough idea helps.",
    "Any specific job title or field you're aiming for?",
    "What work would you love to do?",
    "Tell me about the role you're looking for.",
    "What position are you going after?",
    "What's your target role or industry?",
  ],

  'education.ask': [
    "Let's talk about your education. What degree did you pursue, and from where?",
    "Now let's cover your academics. Where did you study, and what was your degree?",
    "Tell me about your education. Degree, college, the basics.",
    "Time for the education section. What did you study and where?",
    "Let's get your education down. What degree and which institution?",
    "Moving on to education! What's your educational background?",
    "What about your studies? Degree, institution, and year.",
    "Let's build your education section. Walk me through it.",
    "Next up: education. What degree did you complete, and from which college?",
    "Tell me about where you studied. Degree, institution, year, field.",
  ],

  'education.acknowledged': [
    "{{degree}} from {{institution}}, solid foundation! What have you been up to since {{year}}?",
    "Nice, {{institution}}! {{field}} is a great field. Did you do any internships during college?",
    "Got it. {{degree}} in {{field}}, {{institution}}, {{year}}. Tell me about your work experience.",
    "{{institution}}, {{year}}. {{field}} is a solid choice. Any work experience to add?",
    "Great, {{degree}} from {{institution}}. {{field}} opens a lot of doors. Let's talk about what you did next.",
    "{{institution}} in {{year}}, nice. Did you pick up any work experience along the way?",
    "{{degree}} in {{field}} from {{institution}}. Good stuff. What about work experience?",
    "Noted! {{institution}}, {{year}}, {{field}}. Now let's talk about what you've done professionally.",
    "{{degree}} from {{institution}} in {{year}}. Strong background. Any jobs or internships?",
    "{{institution}}, {{field}}, {{year}}. Let's build on that. Tell me about your experience.",
  ],

  'education.gpa_ask': [
    "What was your GPA or percentage? Totally optional, but it can help if it's strong.",
    "Got a GPA or CGPA you'd like to include? No pressure if not.",
    "Any GPA or percentage to add? Only if you want to.",
    "Did you want to include your academic score? GPA, CGPA, or percentage?",
    "Optional: what was your GPA? If it's good, it's worth mentioning.",
    "Any GPA to include? This is optional, skip if you prefer.",
    "Your call: want to add your GPA or percentage?",
    "If you have a strong GPA, it's worth listing. Want to include it?",
  ],

  'experience.ask': [
    "Tell me about your work experience. Company, role, and what you did there.",
    "Let's talk experience. Any jobs, internships, or freelance work?",
    "What about work? Any companies, roles, or internships?",
    "Now for experience. Walk me through your professional history.",
    "Time for work experience! What have you done professionally?",
    "Have you worked anywhere? Internships count too. Tell me about it.",
    "Let's get your experience down. Company name, your role, what you did.",
    "Any work experience? Jobs, internships, freelance. All counts.",
    "What's your professional background? Talk me through it.",
    "Let's cover your work history. Start with the most recent.",
  ],

  'experience.role_ack': [
    "{{role}} at {{company}}, nice! What did you actually do there? Give me the highlights.",
    "Got it, {{role}} at {{company}}. Tell me about your main accomplishments there.",
    "{{company}}, {{role}}. What were your biggest wins in that role?",
    "{{role}} at {{company}}. Walk me through what you worked on.",
    "Nice, {{role}} at {{company}}! What were you responsible for?",
    "{{company}}, {{role}}. What's the coolest thing you did there?",
    "Got it! {{role}} at {{company}}. Tell me what you built or achieved.",
    "{{role}} at {{company}}, interesting! What did that involve day to day?",
    "{{company}} as {{role}}. Tell me about your key contributions.",
    "Nice! {{role}} at {{company}}. What should a recruiter know about your time there?",
  ],

  'experience.bullets_ask': [
    "What else did you do in that role? Any other achievements or projects?",
    "Anything else from that position? Numbers and results are gold.",
    "Any other highlights from {{company}}? Think impact and results.",
    "More to add from that role? Every achievement counts.",
    "What else stands out from your time there?",
    "Any other wins from {{company}}? Don't be modest.",
    "Got it. Anything else from that role worth mentioning?",
    "More from {{company}}? Think about things you improved or built.",
  ],

  'experience.another_ask': [
    "Any other work experience to add? More roles, internships, freelance?",
    "Do you have another role to add? Or should we move on?",
    "Any more positions to include? Or ready for the next section?",
    "Another job or internship? Or shall we talk about projects?",
    "More experience to add? If not, let's move to projects.",
    "Any other roles? Say 'no' if we're good, and I'll move on.",
    "Got that covered. Any more work experience, or should we continue?",
    "Another position to add? Otherwise, let's talk projects.",
  ],

  'projects.ask': [
    "Let's talk projects. What have you built? Side projects, academic work, anything you're proud of.",
    "Now for projects! Tell me about something you've built or worked on.",
    "Any projects to showcase? Personal, academic, open source. All fair game.",
    "Projects time! What's something you've built that you're proud of?",
    "Tell me about a project. What did you build, what tech did you use, what was the result?",
    "Let's add some projects. What have you created or contributed to?",
    "Do you have any projects? These really stand out for freshers. Tell me about one.",
    "Projects are where you shine. What have you worked on?",
    "Got any projects to add? They're huge for standing out. Walk me through one.",
    "What have you built? Personal projects, hackathon work, academic projects. All count.",
  ],

  'projects.tech_ask': [
    "What tech stack did you use for {{project}}?",
    "What technologies went into building {{project}}?",
    "What did you build {{project}} with? Languages, frameworks, tools.",
    "Tech stack for {{project}}? Languages, libraries, databases.",
    "What tools and technologies powered {{project}}?",
    "For {{project}}, what was the tech? Languages, frameworks, anything.",
    "What was the tech behind {{project}}?",
    "Technologies used in {{project}}? Hit me with the list.",
  ],

  'projects.outcome_ask': [
    "What was the result? Any numbers, users, or impact?",
    "What outcome did {{project}} achieve? Users, speed, downloads, anything measurable.",
    "How did {{project}} turn out? Any metrics or results?",
    "What was the impact of {{project}}?",
    "Any measurable results from {{project}}? Numbers are powerful.",
    "What happened with {{project}}? Users, deployments, recognition?",
    "What's the outcome? Even rough numbers help a lot.",
    "Results for {{project}}? Think users, performance gains, recognition.",
  ],

  'projects.another_ask': [
    "Another project to add? Or ready to move on?",
    "Any more projects? Or should we cover skills next?",
    "Got more projects? Otherwise, let's talk skills.",
    "Another project? Or shall we move to the skills section?",
    "More projects to showcase? If not, let's move on.",
    "Want to add another project? Or are we good here?",
    "Any other projects? Say the word and we'll continue, or I'll move on.",
    "One more project? Or let's wrap up this section.",
  ],

  'skills.confirm': [
    "Based on what you've told me, I've picked up these skills: {{skills_list}}. Anything I missed?",
    "I found these skills in our conversation: {{skills_list}}. Want to add or remove any?",
    "Here are the skills I've gathered: {{skills_list}}. Sound right? Anything to add?",
    "Skills I've detected: {{skills_list}}. Did I miss anything important?",
    "Your skills so far: {{skills_list}}. Any additions or corrections?",
    "I've noted these skills: {{skills_list}}. Anything else you're good at?",
    "Skill check! I got: {{skills_list}}. Anything to add or remove?",
    "From our chat, your skills: {{skills_list}}. Looks right? Want to add more?",
  ],

  'skills.missing_ask': [
    "Any other technical or soft skills to add? Think tools, languages, frameworks.",
    "Anything else? Soft skills count too: leadership, communication, teamwork.",
    "More skills? Cloud platforms, databases, methodologies?",
    "What else? Design tools, testing frameworks, project management?",
    "Any more to add? Don't forget soft skills and methodologies.",
    "Other skills? Agile, Git, Docker, cloud services?",
    "Anything I'm missing? Think about the tools you use daily.",
    "More to add? Every relevant skill improves your match score.",
  ],

  'wrapup.contact_ask': [
    "Almost done! I need your email and phone number for the resume header.",
    "Let's wrap up the essentials. What's your email and phone?",
    "Final details: email address and phone number, please.",
    "Just need your contact info. Email and phone number?",
    "Last bit: what's the best email and phone to reach you?",
    "Quick one: email and phone for the resume?",
    "We're close! Just need your email and phone number.",
    "For the header: your email address and phone number?",
  ],

  'wrapup.summary_offer': [
    "Want me to write a professional summary based on everything you've told me? Or would you prefer to write your own?",
    "I can generate a summary from our conversation. Want me to draft one?",
    "Should I create a professional summary for you? I've got enough to work with.",
    "I can write a summary based on what you've shared. Want me to?",
    "Ready to generate your summary. Should I draft it, or do you have one in mind?",
    "I have enough to write a solid summary. Want me to generate one?",
    "Let me draft a professional summary from our chat. Sound good?",
    "I can create a summary that highlights your strengths. Want me to?",
  ],

  'review.show': [
    "Here's your resume! Take a look and let me know if anything needs changing.",
    "Your resume is ready! Review it below. I can adjust anything you want.",
    "Done! Check out your resume. Want to change anything?",
    "Here it is! Your resume, built from our conversation. Any edits?",
    "Resume complete! Look it over. I can tweak anything that doesn't feel right.",
    "All set! Here's what we built together. Any final adjustments?",
    "Your resume is ready for review. Take a look and tell me what to change.",
    "Tada! Here's your resume. Any last edits before you download?",
  ],

  'review.edit_ask': [
    "What would you like to change? Just tell me and I'll update it.",
    "What needs adjusting? I can modify any section.",
    "Which part needs work? Tell me what to fix.",
    "Any changes? Just say what needs updating.",
    "What should I change? Point me to the section.",
    "What needs editing? I'll make it happen.",
    "Tell me what to adjust. I'm all ears.",
    "What's not right? Let's fix it together.",
  ],

  'deviation.return': [
    "Got it! By the way, you mentioned {{field}} earlier. What year did you graduate?",
    "Noted. Quick thing: we still need your {{field}}. Can you fill that in?",
    "Sure! Oh, one thing: I'm still missing your {{field}}. Want to add it?",
    "No problem. Coming back to something: what's your {{field}}?",
    "Understood! Let me circle back. We're still missing {{field}}.",
    "Makes sense. Going back a step: I need your {{field}}. What is it?",
    "Got it! Also, I noticed we're missing {{field}}. Can you share that?",
    "Cool. One gap though: your {{field}}. Can you fill me in?",
  ],

  encouragement: [
    "You're doing great! Almost there.",
    "This is shaping up nicely.",
    "Strong background! Let's keep going.",
    "Looking good so far!",
    "Nice work. You've got solid experience.",
    "Great stuff. Just a few more things.",
    "This resume is coming together well!",
    "Impressive! Let's keep building.",
    "You've got more to offer than you think.",
    "Keep going. Every detail matters.",
    "Good progress! We're getting close.",
    "This is going to be a strong resume.",
    "Nice! Let's round this out.",
    "You've got a lot to show. Let's capture it all.",
    "Solid! A few more questions and we're done.",
    "Looking great, {{name}}! Almost finished.",
    "Your resume is really coming along.",
    "You're a natural at this. Keep going!",
    "Love it. Just a bit more.",
    "That's the kind of detail recruiters love.",
  ],

  clarification: [
    "I didn't quite catch that. Could you rephrase?",
    "Hmm, I'm not sure I understood. Can you say that differently?",
    "Could you clarify? I want to get this right.",
    "Not sure I followed. Can you try again?",
    "I want to make sure I get this right. Could you explain again?",
    "Let me make sure I understand. Can you rephrase?",
    "Sorry, I missed that. One more time?",
    "Can you say that again? I want to be accurate.",
    "Not quite sure I got that. Could you elaborate?",
    "I want to capture this correctly. Can you rephrase?",
  ],
};

// Track last used index per key to rotate variants
const _lastIndex: Map<ResponseKey, number> = new Map();

function pickVariant(key: ResponseKey): string {
  const variants = RESPONSE_TEMPLATES[key];
  if (!variants || variants.length === 0) return '';
  const last = _lastIndex.get(key) ?? -1;
  const next = (last + 1) % variants.length;
  _lastIndex.set(key, next);
  return variants[next];
}

function interpolate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  // Remove any remaining template markers
  result = result.replaceAll(/\{\{[^}]+\}\}/g, '');
  return result;
}

export function getGreeting(): string {
  return pickVariant('greeting');
}

export function getResponse(key: ResponseKey, vars: Record<string, string>): string {
  return interpolate(pickVariant(key), vars);
}
```

### Task 2.3: Entity extraction (regex layer)

**File:** `/mnt/experiments/astha-resume/src/saathi/engine/entityExtractor.ts` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/saathi/__tests__/entityExtractor.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { extractEntities, type ExtractedEntities } from '../engine/entityExtractor';

describe('entityExtractor', () => {
  it('extracts email addresses', () => {
    const result = extractEntities('my email is rahul@example.com');
    expect(result.email).toBe('rahul@example.com');
  });

  it('extracts Indian phone numbers', () => {
    const result = extractEntities('call me at +91 98765 43210');
    expect(result.phone).toBe('+91 98765 43210');
  });

  it('extracts phone without country code', () => {
    const result = extractEntities('9876543210');
    expect(result.phone).toBe('9876543210');
  });

  it('extracts dates in various formats', () => {
    const r1 = extractEntities('I worked there from 2019 to 2022');
    expect(r1.dates).toContain('2019');
    expect(r1.dates).toContain('2022');

    const r2 = extractEntities('Jan 2020 to Mar 2022');
    expect(r2.dateRanges.length).toBeGreaterThan(0);
  });

  it('extracts GPA in CGPA format', () => {
    const result = extractEntities('I got 8.5 CGPA');
    expect(result.gpa).toBe('8.5');
  });

  it('extracts GPA in percentage format', () => {
    const result = extractEntities('my score was 85%');
    expect(result.gpa).toBe('85%');
  });

  it('extracts GPA in X/Y format', () => {
    const result = extractEntities('3.8/4.0 GPA');
    expect(result.gpa).toBe('3.8/4.0');
  });

  it('extracts degree abbreviations', () => {
    const result = extractEntities('I have a B.Tech in Computer Science');
    expect(result.degree).toBe('B.Tech');
  });

  it('extracts skills matching taxonomy', () => {
    const result = extractEntities('I know Python, React, and Docker');
    expect(result.skills).toContain('python');
    expect(result.skills).toContain('react');
    expect(result.skills).toContain('docker');
  });

  it('extracts LinkedIn URLs', () => {
    const result = extractEntities('linkedin.com/in/rahul-sharma');
    expect(result.linkedin).toBe('linkedin.com/in/rahul-sharma');
  });

  it('extracts GitHub URLs', () => {
    const result = extractEntities('github.com/rahulsharma');
    expect(result.github).toBe('github.com/rahulsharma');
  });

  it('returns empty for gibberish', () => {
    const result = extractEntities('asdfghjkl');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.skills.length).toBe(0);
  });
});
```

**Implementation:**

```typescript
// /mnt/experiments/astha-resume/src/saathi/engine/entityExtractor.ts

import { normalizeSkill, matchSkillsToTaxonomy } from '@/ai/taxonomy/skillsGraph';

export interface ExtractedEntities {
  email: string | null;
  phone: string | null;
  dates: string[];
  dateRanges: Array<{ start: string; end: string }>;
  gpa: string | null;
  degree: string | null;
  skills: string[];
  linkedin: string | null;
  github: string | null;
  /** Raw proper nouns that might be names, companies, or institutions */
  properNouns: string[];
  /** Detected numbers with context */
  numbers: Array<{ value: string; context: string }>;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/;
const PHONE_INTL_RE = /\+\d{1,3}[\s-]?\d{4,5}[\s-]?\d{4,5}/;
const YEAR_RE = /\b(19|20)\d{2}\b/g;
const DATE_RANGE_RE = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:19|20)\d{2}\s*(?:to|[-\u2013])\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:(?:19|20)\d{2}|present|current|now)/gi;
const CGPA_RE = /(\d+(?:\.\d+)?)\s*(?:CGPA|cgpa|GPA|gpa|CPI|cpi|SGPA|sgpa)/;
const PERCENTAGE_RE = /(\d{2,3})%/;
const GPA_FRACTION_RE = /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*(?:GPA|gpa|CGPA|cgpa)?/;
const DEGREE_RE = /\b(B\.?Tech|M\.?Tech|B\.?Sc|M\.?Sc|B\.?E|M\.?E|MBA|MCA|BCA|B\.?Com|M\.?Com|B\.?A|M\.?A|PhD|Ph\.?D|Diploma|B\.?Des|M\.?Des|LLB|LLM|MBBS|MD|BBA)\b/i;
const LINKEDIN_RE = /(?:linkedin\.com\/in\/[\w-]+)/i;
const GITHUB_RE = /(?:github\.com\/[\w-]+)/i;

// Common tech skills for quick extraction (before taxonomy lookup)
const SKILL_WORDS = new Set([
  'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
  'nodejs', 'node', 'express', 'django', 'flask', 'spring', 'docker',
  'kubernetes', 'aws', 'azure', 'gcp', 'git', 'linux', 'sql', 'mysql',
  'postgresql', 'mongodb', 'redis', 'graphql', 'rest', 'html', 'css',
  'tailwind', 'bootstrap', 'figma', 'photoshop', 'tensorflow', 'pytorch',
  'scikit-learn', 'pandas', 'numpy', 'c', 'c++', 'cpp', 'rust', 'go',
  'golang', 'kotlin', 'swift', 'dart', 'flutter', 'react native',
  'next', 'nextjs', 'vite', 'webpack', 'jenkins', 'terraform',
  'ansible', 'nginx', 'apache', 'firebase', 'supabase', 'vercel',
  'netlify', 'heroku', 'jira', 'agile', 'scrum', 'kanban',
  'machine learning', 'deep learning', 'nlp', 'computer vision',
  'data science', 'data analysis', 'power bi', 'tableau',
  'excel', 'matlab', 'r', 'scala', 'hadoop', 'spark', 'kafka',
  'elasticsearch', 'rabbitmq', 'ci/cd', 'devops',
]);

export function extractEntities(text: string): ExtractedEntities {
  const result: ExtractedEntities = {
    email: null,
    phone: null,
    dates: [],
    dateRanges: [],
    gpa: null,
    degree: null,
    skills: [],
    linkedin: null,
    github: null,
    properNouns: [],
    numbers: [],
  };

  // Email
  const emailMatch = text.match(EMAIL_RE);
  if (emailMatch) result.email = emailMatch[0];

  // Phone (try Indian format first, then international)
  const phoneMatch = text.match(PHONE_RE) || text.match(PHONE_INTL_RE);
  if (phoneMatch) result.phone = phoneMatch[0].trim();

  // Years
  const yearMatches = text.match(YEAR_RE);
  if (yearMatches) result.dates = [...new Set(yearMatches)];

  // Date ranges
  const rangeMatches = text.matchAll(DATE_RANGE_RE);
  for (const m of rangeMatches) {
    const parts = m[0].split(/\s*(?:to|[-\u2013])\s*/i);
    if (parts.length === 2) {
      result.dateRanges.push({ start: parts[0].trim(), end: parts[1].trim() });
    }
  }

  // GPA (try CGPA, then fraction, then percentage)
  const cgpaMatch = text.match(CGPA_RE);
  if (cgpaMatch) {
    result.gpa = cgpaMatch[1];
  } else {
    const fracMatch = text.match(GPA_FRACTION_RE);
    if (fracMatch) {
      result.gpa = `${fracMatch[1]}/${fracMatch[2]}`;
    } else {
      const pctMatch = text.match(PERCENTAGE_RE);
      if (pctMatch) {
        const val = parseInt(pctMatch[1], 10);
        // Only treat as GPA if context suggests academic performance
        if (val <= 100 && /(?:score|marks?|grade|percent|result|cgpa|gpa)/i.test(text)) {
          result.gpa = `${pctMatch[1]}%`;
        }
      }
    }
  }

  // Degree
  const degreeMatch = text.match(DEGREE_RE);
  if (degreeMatch) result.degree = degreeMatch[1];

  // LinkedIn
  const linkedinMatch = text.match(LINKEDIN_RE);
  if (linkedinMatch) result.linkedin = linkedinMatch[0];

  // GitHub
  const githubMatch = text.match(GITHUB_RE);
  if (githubMatch) result.github = githubMatch[0];

  // Skills: tokenize and check against known skills + taxonomy
  const lower = text.toLowerCase();
  const foundSkills = new Set<string>();

  for (const skill of SKILL_WORDS) {
    // Word boundary check for single words; substring check for multi-word
    if (skill.includes(' ')) {
      if (lower.includes(skill)) foundSkills.add(skill);
    } else {
      const re = new RegExp(`\\b${skill.replace(/[+]/g, '\\+')}\\b`, 'i');
      if (re.test(lower)) foundSkills.add(skill);
    }
  }

  // Also try taxonomy normalization for words that might be aliases
  const words = lower.split(/[\s,;|]+/).filter((w) => w.length >= 2);
  for (const word of words) {
    const normalized = normalizeSkill(word);
    if (normalized && !foundSkills.has(normalized)) {
      foundSkills.add(normalized);
    }
  }

  result.skills = [...foundSkills];

  return result;
}
```

### Task 2.4: Slot-filling state machine

**File:** `/mnt/experiments/astha-resume/src/saathi/engine/slotMachine.ts` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/saathi/__tests__/slotMachine.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createConversation,
  processUserInput,
  type ConversationState,
  type ChatMessage,
} from '../engine/slotMachine';

describe('slotMachine', () => {
  let conversation: ConversationState;

  beforeEach(() => {
    conversation = createConversation();
  });

  it('starts with a greeting message', () => {
    expect(conversation.messages.length).toBe(1);
    expect(conversation.messages[0].role).toBe('saathi');
    expect(conversation.messages[0].text.length).toBeGreaterThan(10);
  });

  it('starts in warmup phase', () => {
    expect(conversation.slots.phase).toBe('warmup');
  });

  it('extracts name from first user input', () => {
    const updated = processUserInput(conversation, 'My name is Rahul');
    expect(updated.slots.values.get('personal.name')).toBe('Rahul');
    // Saathi should acknowledge the name
    const lastSaathiMsg = updated.messages.filter((m) => m.role === 'saathi').pop();
    expect(lastSaathiMsg?.text).toContain('Rahul');
  });

  it('extracts location from user input', () => {
    let state = processUserInput(conversation, "I'm Rahul");
    state = processUserInput(state, "I'm from Solan, HP");
    expect(state.slots.values.get('personal.location')).toBe('Solan, HP');
  });

  it('transitions phases as slots are filled', () => {
    let state = processUserInput(conversation, "I'm Rahul from Delhi");
    // Fill warmup, should eventually prompt education
    state = processUserInput(state, "I want to be a software developer");
    expect(
      state.slots.phase === 'warmup' || state.slots.phase === 'education'
    ).toBe(true);
  });

  it('extracts email and phone in wrapup', () => {
    let state = conversation;
    state = processUserInput(state, 'Rahul from Delhi');
    state = processUserInput(state, 'B.Tech Computer Science from IIT Delhi 2023');
    // Skip ahead: fill required education
    state.slots.values.set('education[].degree', 'B.Tech');
    state.slots.values.set('education[].institution', 'IIT Delhi');
    state.slots.values.set('education[].year', '2023');
    state.slots.values.set('education[].field', 'Computer Science');
    state = processUserInput(state, 'rahul@example.com and phone is 9876543210');
    expect(state.slots.values.get('personal.email')).toBe('rahul@example.com');
    expect(state.slots.values.get('personal.phone')).toBe('9876543210');
  });

  it('handles skill extraction from natural language', () => {
    let state = processUserInput(conversation, 'Rahul from Mumbai');
    state = processUserInput(state, 'I know Python, React, and Docker');
    const skills = state.slots.values.get('skills[]');
    expect(Array.isArray(skills)).toBe(true);
    if (Array.isArray(skills)) {
      expect(skills).toContain('python');
      expect(skills).toContain('react');
      expect(skills).toContain('docker');
    }
  });

  it('adds user messages to history', () => {
    const updated = processUserInput(conversation, 'Hello there');
    const userMsgs = updated.messages.filter((m) => m.role === 'user');
    expect(userMsgs.length).toBe(1);
    expect(userMsgs[0].text).toBe('Hello there');
  });

  it('handles empty input gracefully', () => {
    const updated = processUserInput(conversation, '');
    // Should ask for clarification
    const last = updated.messages[updated.messages.length - 1];
    expect(last.role).toBe('saathi');
  });

  it('tracks filled percentage', () => {
    let state = processUserInput(conversation, "I'm Rahul from Solan");
    const pct = state.filledPercentage;
    expect(pct).toBeGreaterThan(0);
  });
});
```

**Implementation:**

```typescript
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
```

### Task 2.5: Resume generator (slots -> resume store)

**File:** `/mnt/experiments/astha-resume/src/saathi/engine/resumeGenerator.ts` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/saathi/__tests__/resumeGenerator.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { slotsToResume } from '../engine/resumeGenerator';
import { createSlotState, type SlotState } from '../engine/slots';

vi.mock('@/store/persist', () => ({
  createIndexedDBStorage: () => ({
    load: () => Promise.resolve(undefined),
    save: () => {},
  }),
}));

describe('resumeGenerator', () => {
  function filledSlots(): SlotState {
    const state = createSlotState();
    state.values.set('personal.name', 'Rahul Sharma');
    state.values.set('personal.email', 'rahul@example.com');
    state.values.set('personal.phone', '9876543210');
    state.values.set('personal.location', 'Delhi');
    state.values.set('personal.linkedin', 'linkedin.com/in/rahul');
    state.values.set('personal.github', 'github.com/rahul');
    state.values.set('education[].degree', 'B.Tech');
    state.values.set('education[].institution', 'IIT Delhi');
    state.values.set('education[].year', '2023');
    state.values.set('education[].field', 'Computer Science');
    state.values.set('education[].gpa', '8.5');
    state.values.set('experience[].company', 'Google');
    state.values.set('experience[].role', 'SDE Intern');
    state.values.set('experience[].dates', 'May 2022 - Aug 2022');
    state.values.set('experience[].bullets[]', [
      'Built a REST API serving 10k requests per second',
      'Improved test coverage from 60% to 95%',
    ]);
    state.values.set('projects[].name', 'ResumeAI');
    state.values.set('projects[].tech', 'React, TypeScript, Vite');
    state.values.set('projects[].outcome', '500 users in first week');
    state.values.set('skills[]', ['python', 'react', 'typescript', 'docker']);
    state.values.set('summary', 'Passionate CS graduate from IIT Delhi');
    return state;
  }

  it('generates a Resume object from filled slots', () => {
    const resume = slotsToResume(filledSlots());
    expect(resume.personal.name).toBe('Rahul Sharma');
    expect(resume.personal.email).toBe('rahul@example.com');
    expect(resume.personal.phone).toBe('9876543210');
    expect(resume.personal.location).toBe('Delhi');
    expect(resume.personal.linkedin).toBe('linkedin.com/in/rahul');
    expect(resume.personal.github).toBe('github.com/rahul');
    expect(resume.summary).toBe('Passionate CS graduate from IIT Delhi');
  });

  it('creates education section entries', () => {
    const resume = slotsToResume(filledSlots());
    const edu = resume.sections.find((s) => s.type === 'education');
    expect(edu).toBeDefined();
    expect(edu!.entries.length).toBeGreaterThan(0);
    const entry = edu!.entries[0];
    expect(entry.fields['degree']).toBe('B.Tech');
    expect(entry.fields['institution']).toBe('IIT Delhi');
  });

  it('creates experience section entries with bullets', () => {
    const resume = slotsToResume(filledSlots());
    const exp = resume.sections.find((s) => s.type === 'experience');
    expect(exp).toBeDefined();
    expect(exp!.entries.length).toBeGreaterThan(0);
    expect(exp!.entries[0].bullets.length).toBe(2);
  });

  it('creates skills section entries', () => {
    const resume = slotsToResume(filledSlots());
    const skills = resume.sections.find((s) => s.type === 'skills');
    expect(skills).toBeDefined();
    expect(skills!.entries.length).toBeGreaterThan(0);
  });

  it('creates project section entries', () => {
    const resume = slotsToResume(filledSlots());
    const proj = resume.sections.find((s) => s.type === 'projects');
    expect(proj).toBeDefined();
    expect(proj!.entries.length).toBeGreaterThan(0);
    expect(proj!.entries[0].fields['name']).toBe('ResumeAI');
  });

  it('handles minimal slots gracefully', () => {
    const state = createSlotState();
    state.values.set('personal.name', 'Test');
    const resume = slotsToResume(state);
    expect(resume.personal.name).toBe('Test');
    expect(resume.sections.length).toBeGreaterThan(0);
  });
});
```

**Implementation:**

```typescript
// /mnt/experiments/astha-resume/src/saathi/engine/resumeGenerator.ts

import type { Resume, Section, Entry } from '@/store/types';
import type { SlotState } from './slots';

function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Convert filled conversation slots into a Resume object
 * compatible with the existing resume store.
 */
export function slotsToResume(slots: SlotState): Resume {
  const get = (key: string): string => {
    const val = slots.values.get(key as any);
    if (typeof val === 'string') return val;
    return '';
  };

  const getArray = (key: string): string[] => {
    const val = slots.values.get(key as any);
    if (Array.isArray(val)) return val;
    return [];
  };

  const sections: Section[] = [];

  // Education
  const eduEntries: Entry[] = [];
  if (get('education[].degree') || get('education[].institution')) {
    eduEntries.push({
      id: uuid(),
      fields: {
        degree: get('education[].degree'),
        institution: get('education[].institution'),
        year: get('education[].year'),
        field: get('education[].field'),
        gpa: get('education[].gpa'),
      },
      bullets: [],
    });
  }
  sections.push({
    id: uuid(),
    type: 'education',
    heading: 'Education',
    layout: 'list',
    entries: eduEntries,
  });

  // Experience
  const expEntries: Entry[] = [];
  if (get('experience[].company') || get('experience[].role')) {
    expEntries.push({
      id: uuid(),
      fields: {
        company: get('experience[].company'),
        role: get('experience[].role'),
        dates: get('experience[].dates'),
      },
      bullets: getArray('experience[].bullets[]'),
    });
  }
  sections.push({
    id: uuid(),
    type: 'experience',
    heading: 'Experience',
    layout: 'list',
    entries: expEntries,
  });

  // Projects
  const projEntries: Entry[] = [];
  if (get('projects[].name')) {
    projEntries.push({
      id: uuid(),
      fields: {
        name: get('projects[].name'),
        tech: get('projects[].tech'),
        outcome: get('projects[].outcome'),
      },
      bullets: [],
    });
  }
  sections.push({
    id: uuid(),
    type: 'projects',
    heading: 'Projects',
    layout: 'list',
    entries: projEntries,
  });

  // Skills
  const skillsArr = getArray('skills[]');
  const skillEntries: Entry[] = [];
  if (skillsArr.length > 0) {
    skillEntries.push({
      id: uuid(),
      fields: {},
      bullets: skillsArr,
    });
  }
  sections.push({
    id: uuid(),
    type: 'skills',
    heading: 'Skills',
    layout: 'tags',
    entries: skillEntries,
  });

  // Certifications (empty placeholder)
  const certArr = getArray('certifications[]');
  const certEntries: Entry[] = [];
  if (certArr.length > 0) {
    certEntries.push({
      id: uuid(),
      fields: {},
      bullets: certArr,
    });
  }
  sections.push({
    id: uuid(),
    type: 'certifications',
    heading: 'Certifications',
    layout: 'list',
    entries: certEntries,
  });

  // Extracurricular (empty placeholder)
  sections.push({
    id: uuid(),
    type: 'extracurricular',
    heading: 'Extracurricular & Leadership',
    layout: 'list',
    entries: [],
  });

  return {
    id: uuid(),
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templateId: 'ats-classic',
    },
    personal: {
      name: get('personal.name'),
      email: get('personal.email'),
      phone: get('personal.phone'),
      location: get('personal.location'),
      linkedin: get('personal.linkedin'),
      github: get('personal.github'),
    },
    summary: get('summary'),
    sections,
  };
}
```

**Commit:** `feat: Saathi conversation engine with slot machine, entity extraction, response bank, resume generator`

---

## Phase 3: Web Speech API Integration

### Task 3.1: Language detection

**File:** `/mnt/experiments/astha-resume/src/saathi/voice/languageDetect.ts` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/saathi/__tests__/languageDetect.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { detectScript, getSpeechLang } from '../voice/languageDetect';

describe('languageDetect', () => {
  it('detects Devanagari script', () => {
    expect(detectScript('मेरा नाम राहुल है')).toBe('devanagari');
  });

  it('detects Latin script', () => {
    expect(detectScript('My name is Rahul')).toBe('latin');
  });

  it('detects Tamil script', () => {
    expect(detectScript('என் பெயர் ராகுல்')).toBe('tamil');
  });

  it('detects Bengali script', () => {
    expect(detectScript('আমার নাম রাহুল')).toBe('bengali');
  });

  it('returns latin for mixed text', () => {
    expect(detectScript('Hello world मेरा')).toBe('latin');
  });

  it('maps scripts to BCP-47 speech lang', () => {
    expect(getSpeechLang('devanagari')).toBe('hi-IN');
    expect(getSpeechLang('latin')).toBe('en-IN');
    expect(getSpeechLang('tamil')).toBe('ta-IN');
    expect(getSpeechLang('bengali')).toBe('bn-IN');
  });
});
```

**Implementation:**

```typescript
// /mnt/experiments/astha-resume/src/saathi/voice/languageDetect.ts

export type Script =
  | 'latin'
  | 'devanagari'
  | 'tamil'
  | 'bengali'
  | 'telugu'
  | 'malayalam'
  | 'gujarati'
  | 'kannada'
  | 'punjabi'
  | 'odia';

const SCRIPT_RANGES: Array<{ script: Script; test: RegExp }> = [
  { script: 'devanagari', test: /[\u0900-\u097F]/ },
  { script: 'tamil', test: /[\u0B80-\u0BFF]/ },
  { script: 'bengali', test: /[\u0980-\u09FF]/ },
  { script: 'telugu', test: /[\u0C00-\u0C7F]/ },
  { script: 'malayalam', test: /[\u0D00-\u0D7F]/ },
  { script: 'gujarati', test: /[\u0A80-\u0AFF]/ },
  { script: 'kannada', test: /[\u0C80-\u0CFF]/ },
  { script: 'punjabi', test: /[\u0A00-\u0A7F]/ },
  { script: 'odia', test: /[\u0B00-\u0B7F]/ },
];

/**
 * Detect the dominant script in a text string.
 * Uses Unicode block detection. Returns 'latin' as default.
 */
export function detectScript(text: string): Script {
  let maxCount = 0;
  let dominant: Script = 'latin';

  for (const { script, test } of SCRIPT_RANGES) {
    const matches = text.match(new RegExp(test.source, 'g'));
    const count = matches?.length ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominant = script;
    }
  }

  return dominant;
}

const SPEECH_LANG_MAP: Record<Script, string> = {
  latin: 'en-IN',
  devanagari: 'hi-IN',
  tamil: 'ta-IN',
  bengali: 'bn-IN',
  telugu: 'te-IN',
  malayalam: 'ml-IN',
  gujarati: 'gu-IN',
  kannada: 'kn-IN',
  punjabi: 'pa-IN',
  odia: 'or-IN',
};

/** Map a detected script to the BCP-47 language tag for Web Speech API */
export function getSpeechLang(script: Script): string {
  return SPEECH_LANG_MAP[script] ?? 'en-IN';
}

/** All supported BCP-47 languages for the speech recognizer */
export const SUPPORTED_SPEECH_LANGS = Object.values(SPEECH_LANG_MAP);
```

### Task 3.2: Web Speech API wrapper

**File:** `/mnt/experiments/astha-resume/src/saathi/voice/speechInput.ts` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/saathi/__tests__/speechInput.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { isSpeechSupported, createSpeechInput, type SpeechInput } from '../voice/speechInput';

// Mock SpeechRecognition
class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

describe('speechInput', () => {
  it('detects speech support', () => {
    // In JSDOM, SpeechRecognition is not available
    expect(isSpeechSupported()).toBe(false);
  });

  it('createSpeechInput returns null when unsupported', () => {
    const input = createSpeechInput('en-IN');
    expect(input).toBeNull();
  });

  it('createSpeechInput returns SpeechInput when API is available', () => {
    // Monkey-patch
    (globalThis as any).webkitSpeechRecognition = MockSpeechRecognition;
    const input = createSpeechInput('en-IN');
    expect(input).not.toBeNull();
    expect(input!.isListening).toBe(false);
    delete (globalThis as any).webkitSpeechRecognition;
  });
});
```

**Implementation:**

```typescript
// /mnt/experiments/astha-resume/src/saathi/voice/speechInput.ts

export interface SpeechInput {
  start: () => void;
  stop: () => void;
  abort: () => void;
  readonly isListening: boolean;
  onResult: ((transcript: string, isFinal: boolean) => void) | null;
  onError: ((error: string) => void) | null;
  onEnd: (() => void) | null;
  setLang: (lang: string) => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** Check if Web Speech API is available */
export function isSpeechSupported(): boolean {
  return getSpeechRecognitionClass() !== null;
}

/** Create a speech input instance. Returns null if unsupported. */
export function createSpeechInput(lang: string): SpeechInput | null {
  const SpeechRecognitionClass = getSpeechRecognitionClass();
  if (!SpeechRecognitionClass) return null;

  const recognition = new SpeechRecognitionClass();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;

  let listening = false;

  const input: SpeechInput = {
    get isListening() {
      return listening;
    },
    onResult: null,
    onError: null,
    onEnd: null,

    start() {
      if (listening) return;
      try {
        recognition.start();
        listening = true;
      } catch {
        // Already started or other error
      }
    },

    stop() {
      if (!listening) return;
      recognition.stop();
      listening = false;
    },

    abort() {
      recognition.abort();
      listening = false;
    },

    setLang(newLang: string) {
      recognition.lang = newLang;
    },
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    if (!input.onResult) return;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      input.onResult(result[0].transcript, result.isFinal);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    // 'no-speech' and 'aborted' are not real errors
    if (event.error === 'no-speech' || event.error === 'aborted') return;
    input.onError?.(event.error);
  };

  recognition.onend = () => {
    listening = false;
    input.onEnd?.();
  };

  return input;
}
```

**Commit:** `feat: Web Speech API integration with multilingual script detection`

---

## Phase 4: Saathi Chat UI Components

### Task 4.1: ChatBubble component

**File:** `/mnt/experiments/astha-resume/src/saathi/components/ChatBubble.tsx` (NEW)

```typescript
// /mnt/experiments/astha-resume/src/saathi/components/ChatBubble.tsx

import type { ChatMessage } from '../engine/slotMachine';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isSaathi = message.role === 'saathi';

  return (
    <div
      className={`flex ${isSaathi ? 'justify-start' : 'justify-end'} mb-3`}
      role="listitem"
    >
      <div
        className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%]"
        style={{
          background: isSaathi
            ? 'var(--saathi-accent-teal-light)'
            : 'var(--bg-surface)',
          color: 'var(--text-primary)',
          borderRadius: isSaathi
            ? 'var(--saathi-radius) var(--saathi-radius) var(--saathi-radius) 4px'
            : 'var(--saathi-radius) var(--saathi-radius) 4px var(--saathi-radius)',
          border: isSaathi ? 'none' : '1px solid var(--border)',
          lineHeight: 'var(--saathi-line-height)',
        }}
      >
        {isSaathi && (
          <span
            className="mb-1 block text-xs font-semibold"
            style={{ color: 'var(--saathi-accent-teal)' }}
          >
            Saathi
          </span>
        )}
        <p className="m-0 whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
}
```

### Task 4.2: VoiceButton component

**File:** `/mnt/experiments/astha-resume/src/saathi/components/VoiceButton.tsx` (NEW)

```typescript
// /mnt/experiments/astha-resume/src/saathi/components/VoiceButton.tsx

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
}

export function VoiceButton({ isListening, isSupported, onToggle }: VoiceButtonProps) {
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-all"
      style={{
        background: isListening
          ? 'var(--saathi-accent-teal)'
          : 'var(--bg-surface)',
        color: isListening ? '#fff' : 'var(--text-secondary)',
        border: isListening ? 'none' : '1px solid var(--border)',
        boxShadow: isListening
          ? '0 0 0 4px var(--saathi-accent-teal-light)'
          : 'none',
        transition: 'var(--saathi-transition)',
      }}
      aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      aria-pressed={isListening}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
      {isListening && (
        <span
          className="ml-1 text-xs font-medium"
          aria-live="polite"
        >
          Listening...
        </span>
      )}
    </button>
  );
}
```

### Task 4.3: SlotProgress component

**File:** `/mnt/experiments/astha-resume/src/saathi/components/SlotProgress.tsx` (NEW)

```typescript
// /mnt/experiments/astha-resume/src/saathi/components/SlotProgress.tsx

import type { ConversationPhase } from '../engine/slots';

interface SlotProgressProps {
  filledPercentage: number;
  phase: ConversationPhase;
}

const PHASE_LABELS: Record<ConversationPhase, string> = {
  warmup: 'Getting started',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  wrapup: 'Final details',
  review: 'Review',
};

export function SlotProgress({ filledPercentage, phase }: SlotProgressProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-2"
      style={{
        background: 'var(--saathi-accent-teal-light)',
      }}
      role="progressbar"
      aria-valuenow={filledPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Resume ${filledPercentage}% complete. Currently: ${PHASE_LABELS[phase]}`}
    >
      <div
        className="h-2 flex-1 overflow-hidden rounded-full"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${filledPercentage}%`,
            background: 'var(--saathi-accent-teal)',
            transition: 'width var(--saathi-transition)',
          }}
        />
      </div>
      <span
        className="shrink-0 text-xs font-medium"
        style={{ color: 'var(--saathi-accent-teal)' }}
      >
        {filledPercentage}%
      </span>
      <span
        className="shrink-0 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        {PHASE_LABELS[phase]}
      </span>
    </div>
  );
}
```

### Task 4.4: SaathiChat main component

**File:** `/mnt/experiments/astha-resume/src/saathi/components/SaathiChat.tsx` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/saathi/__tests__/SaathiChat.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaathiChat } from '../components/SaathiChat';

vi.mock('@/store/persist', () => ({
  createIndexedDBStorage: () => ({
    load: () => Promise.resolve(undefined),
    save: () => {},
  }),
}));

// Mock speech API as unavailable in JSDOM
vi.mock('../voice/speechInput', () => ({
  isSpeechSupported: () => false,
  createSpeechInput: () => null,
}));

describe('SaathiChat', () => {
  it('renders greeting message on mount', () => {
    render(<SaathiChat />);
    // Greeting contains "Saathi" label
    expect(screen.getByText('Saathi')).toBeInTheDocument();
  });

  it('has a text input field', () => {
    render(<SaathiChat />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('has a send button', () => {
    render(<SaathiChat />);
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('sends message on form submit', () => {
    render(<SaathiChat />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'My name is Rahul' } });
    fireEvent.submit(input.closest('form')!);
    // User message should appear
    expect(screen.getByText('My name is Rahul')).toBeInTheDocument();
    // Saathi should respond with name acknowledgment
    expect(screen.getByText(/Rahul/)).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    render(<SaathiChat />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('clears input after send', () => {
    render(<SaathiChat />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);
    expect(input.value).toBe('');
  });
});
```

**Implementation:**

```typescript
// /mnt/experiments/astha-resume/src/saathi/components/SaathiChat.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import {
  createConversation,
  processUserInput,
  type ConversationState,
} from '../engine/slotMachine';
import { slotsToResume } from '../engine/resumeGenerator';
import { isSpeechSupported, createSpeechInput, type SpeechInput } from '../voice/speechInput';
import { ChatBubble } from './ChatBubble';
import { VoiceButton } from './VoiceButton';
import { SlotProgress } from './SlotProgress';

export function SaathiChat() {
  const [conversation, setConversation] = useState<ConversationState>(() =>
    createConversation(),
  );
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<SpeechInput | null>(null);
  const setPersonal = useResumeStore((s) => s.setPersonal);
  const setSummary = useResumeStore((s) => s.setSummary);

  const speechSupported = isSpeechSupported();

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages.length]);

  // Sync conversation state to resume store when complete
  useEffect(() => {
    if (conversation.isComplete) {
      const resume = slotsToResume(conversation.slots);
      setPersonal(resume.personal);
      setSummary(resume.summary);
      // Sections are handled by the resume store reset + rebuild
      const store = useResumeStore.getState();
      // Update sections via store methods
      for (const section of resume.sections) {
        const existing = store.resume.sections.find((s) => s.type === section.type);
        if (existing) {
          for (const entry of section.entries) {
            store.addEntry(existing.id, entry);
          }
        }
      }
    }
  }, [conversation.isComplete, conversation.slots, setPersonal, setSummary]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;

      setConversation((prev) => processUserInput(prev, trimmed));
      setInputValue('');
      inputRef.current?.focus();
    },
    [inputValue],
  );

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      speechRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!speechRef.current) {
      speechRef.current = createSpeechInput('en-IN');
      if (!speechRef.current) return;

      speechRef.current.onResult = (transcript, isFinal) => {
        setInputValue(transcript);
        if (isFinal) {
          setConversation((prev) => processUserInput(prev, transcript));
          setInputValue('');
          setIsListening(false);
        }
      };

      speechRef.current.onEnd = () => {
        setIsListening(false);
      };

      speechRef.current.onError = () => {
        setIsListening(false);
      };
    }

    speechRef.current.start();
    setIsListening(true);
  }, [isListening]);

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: `linear-gradient(180deg, var(--saathi-bg-warm) 0%, var(--saathi-bg-cream) 100%)`,
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      {/* Progress bar */}
      <div className="p-4 pb-0">
        <SlotProgress
          filledPercentage={conversation.filledPercentage}
          phase={conversation.slots.phase}
        />
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4"
        role="list"
        aria-label="Conversation with Saathi"
      >
        {conversation.messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="border-t p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--saathi-bg-warm)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <VoiceButton
            isListening={isListening}
            isSupported={speechSupported}
            onToggle={handleVoiceToggle}
          />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type or speak..."
            className="min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--saathi-radius)',
            }}
            aria-label="Message to Saathi"
            autoComplete="off"
          />
          <button
            type="submit"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-4 text-sm font-medium text-white"
            style={{
              background: 'var(--saathi-accent-teal)',
              borderRadius: 'var(--saathi-radius)',
            }}
            aria-label="Send message"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Commit:** `feat: Saathi chat UI with voice input, progress tracking, resume store sync`

---

## Phase 5: Wellbeing Score Engine

### Task 5.1: Baked-in datasets

**Files (all NEW):**
- `/mnt/experiments/astha-resume/src/wellbeing/data/cityCoL.ts`
- `/mnt/experiments/astha-resume/src/wellbeing/data/cityAQI.ts`
- `/mnt/experiments/astha-resume/src/wellbeing/data/cityWBGT.ts`
- `/mnt/experiments/astha-resume/src/wellbeing/data/attritionRates.ts`
- `/mnt/experiments/astha-resume/src/wellbeing/data/transitCosts.ts`
- `/mnt/experiments/astha-resume/src/wellbeing/data/fuelRate.ts`

No test needed for static data. These are lookup tables.

```typescript
// /mnt/experiments/astha-resume/src/wellbeing/data/cityCoL.ts
/**
 * India city cost-of-living index (national median = 1.0).
 * Source: Numbeo India 2025, RBI CPIIW basket weights.
 * Update: quarterly.
 */
export const CITY_COL: Record<string, number> = {
  'mumbai': 1.52,
  'delhi': 1.38,
  'bangalore': 1.46,
  'bengaluru': 1.46,
  'hyderabad': 1.22,
  'chennai': 1.28,
  'pune': 1.30,
  'kolkata': 1.10,
  'ahmedabad': 1.08,
  'jaipur': 1.02,
  'lucknow': 0.92,
  'chandigarh': 1.15,
  'noida': 1.32,
  'gurgaon': 1.42,
  'gurugram': 1.42,
  'kochi': 1.12,
  'thiruvananthapuram': 1.05,
  'indore': 0.95,
  'bhopal': 0.90,
  'nagpur': 0.92,
  'coimbatore': 1.05,
  'visakhapatnam': 0.98,
  'surat': 1.02,
  'vadodara': 0.98,
  'patna': 0.88,
  'ranchi': 0.85,
  'bhubaneswar': 0.90,
  'dehradun': 1.00,
  'shimla': 1.05,
  'solan': 0.88,
  'mangalore': 1.00,
  'mysore': 0.95,
  'mysuru': 0.95,
  'trivandrum': 1.05,
  'guwahati': 0.92,
};

export const NATIONAL_MEDIAN_SALARY_ANNUAL = 600000; // INR 6L national median for tech freshers

export function getCityCoL(city: string): number {
  const normalized = city.toLowerCase().trim();
  for (const [key, value] of Object.entries(CITY_COL)) {
    if (normalized.includes(key)) return value;
  }
  return 1.0; // default to national median
}
```

```typescript
// /mnt/experiments/astha-resume/src/wellbeing/data/cityAQI.ts
/**
 * Annual average PM2.5 in ug/m3 for Indian cities.
 * Source: CPCB Annual Report 2025, IQAir World Air Quality Report.
 * Update: annually.
 */
export const CITY_AQI: Record<string, number> = {
  'delhi': 120,
  'noida': 115,
  'gurgaon': 110,
  'gurugram': 110,
  'lucknow': 95,
  'patna': 100,
  'kolkata': 70,
  'mumbai': 45,
  'pune': 38,
  'bangalore': 35,
  'bengaluru': 35,
  'hyderabad': 42,
  'chennai': 30,
  'jaipur': 65,
  'ahmedabad': 55,
  'chandigarh': 60,
  'kochi': 25,
  'thiruvananthapuram': 22,
  'trivandrum': 22,
  'coimbatore': 28,
  'mysore': 30,
  'mysuru': 30,
  'bhopal': 50,
  'indore': 45,
  'surat': 48,
  'visakhapatnam': 35,
  'bhubaneswar': 40,
  'dehradun': 55,
  'shimla': 20,
  'solan': 22,
  'mangalore': 28,
  'guwahati': 45,
  'ranchi': 48,
  'nagpur': 50,
  'vadodara': 52,
};

export function getCityPM25(city: string): number {
  const normalized = city.toLowerCase().trim();
  for (const [key, value] of Object.entries(CITY_AQI)) {
    if (normalized.includes(key)) return value;
  }
  return 50; // moderate default
}
```

```typescript
// /mnt/experiments/astha-resume/src/wellbeing/data/cityWBGT.ts
/**
 * Peak summer Wet Bulb Globe Temperature (WBGT) in Celsius.
 * Source: IMD Heatwave Reports 2025, Nature Scientific Reports 2026.
 * Update: annually.
 */
export const CITY_WBGT: Record<string, number> = {
  'delhi': 34,
  'noida': 34,
  'gurgaon': 33,
  'gurugram': 33,
  'mumbai': 32,
  'chennai': 33,
  'hyderabad': 32,
  'bangalore': 27,
  'bengaluru': 27,
  'kolkata': 34,
  'pune': 30,
  'ahmedabad': 36,
  'jaipur': 35,
  'lucknow': 34,
  'patna': 35,
  'chandigarh': 32,
  'kochi': 31,
  'thiruvananthapuram': 31,
  'trivandrum': 31,
  'coimbatore': 29,
  'bhopal': 33,
  'indore': 32,
  'nagpur': 36,
  'surat': 33,
  'visakhapatnam': 32,
  'bhubaneswar': 34,
  'dehradun': 29,
  'shimla': 22,
  'solan': 24,
  'mysore': 27,
  'mysuru': 27,
  'mangalore': 30,
  'guwahati': 32,
  'ranchi': 31,
  'vadodara': 35,
};

export function getCityWBGT(city: string): number {
  const normalized = city.toLowerCase().trim();
  for (const [key, value] of Object.entries(CITY_WBGT)) {
    if (normalized.includes(key)) return value;
  }
  return 30; // moderate default
}
```

```typescript
// /mnt/experiments/astha-resume/src/wellbeing/data/attritionRates.ts
/**
 * Industry attrition rates (% annual).
 * Source: NASSCOM/Aon India Attrition Report 2024, BusinessToday.
 * Update: annually.
 */
export const INDUSTRY_ATTRITION: Record<string, number> = {
  'it services': 21,
  'it': 21,
  'software': 21,
  'technology': 21,
  'bpo': 35,
  'ites': 35,
  'e-commerce': 28,
  'ecommerce': 28,
  'retail': 25,
  'banking': 18,
  'bfsi': 18,
  'finance': 18,
  'consulting': 22,
  'manufacturing': 12,
  'pharma': 15,
  'healthcare': 16,
  'telecom': 20,
  'media': 24,
  'education': 14,
  'automotive': 13,
  'fmcg': 16,
  'startups': 30,
  'startup': 30,
  'government': 5,
  'psu': 5,
};

export function getAttritionRate(industry: string): number {
  const normalized = industry.toLowerCase().trim();
  for (const [key, value] of Object.entries(INDUSTRY_ATTRITION)) {
    if (normalized.includes(key)) return value;
  }
  return 20; // moderate default
}
```

```typescript
// /mnt/experiments/astha-resume/src/wellbeing/data/transitCosts.ts
/**
 * Monthly transit pass costs and per-km fuel costs for Indian cities.
 * Source: Manual research from metro/bus websites, 2025.
 * Update: quarterly.
 */
export interface TransitCost {
  monthlyPass: number; // INR
  perKmFuel: number; // INR per km (petrol car, ~15 km/L)
}

export const CITY_TRANSIT: Record<string, TransitCost> = {
  'delhi': { monthlyPass: 1500, perKmFuel: 7.2 },
  'mumbai': { monthlyPass: 1800, perKmFuel: 7.5 },
  'bangalore': { monthlyPass: 1600, perKmFuel: 7.3 },
  'bengaluru': { monthlyPass: 1600, perKmFuel: 7.3 },
  'hyderabad': { monthlyPass: 1400, perKmFuel: 7.1 },
  'chennai': { monthlyPass: 1300, perKmFuel: 7.0 },
  'kolkata': { monthlyPass: 1200, perKmFuel: 7.2 },
  'pune': { monthlyPass: 1400, perKmFuel: 7.1 },
  'ahmedabad': { monthlyPass: 1100, perKmFuel: 7.0 },
  'jaipur': { monthlyPass: 1000, perKmFuel: 6.8 },
  'lucknow': { monthlyPass: 900, perKmFuel: 6.8 },
  'chandigarh': { monthlyPass: 1000, perKmFuel: 7.0 },
  'noida': { monthlyPass: 1500, perKmFuel: 7.2 },
  'gurgaon': { monthlyPass: 1500, perKmFuel: 7.2 },
  'gurugram': { monthlyPass: 1500, perKmFuel: 7.2 },
  'kochi': { monthlyPass: 1200, perKmFuel: 7.1 },
  'indore': { monthlyPass: 800, perKmFuel: 6.7 },
};

export function getTransitCost(city: string): TransitCost {
  const normalized = city.toLowerCase().trim();
  for (const [key, value] of Object.entries(CITY_TRANSIT)) {
    if (normalized.includes(key)) return value;
  }
  return { monthlyPass: 1200, perKmFuel: 7.0 }; // default
}
```

```typescript
// /mnt/experiments/astha-resume/src/wellbeing/data/fuelRate.ts
/**
 * Current petrol rate per litre and average fuel efficiency.
 * Source: IOCL published rates, April 2026.
 * Update: monthly.
 */
export const PETROL_RATE_PER_LITRE = 108; // INR
export const AVG_KM_PER_LITRE = 15;
export const FUEL_COST_PER_KM = PETROL_RATE_PER_LITRE / AVG_KM_PER_LITRE; // ~7.2 INR/km
export const WORKDAYS_PER_MONTH = 22;
```

### Task 5.2: Sub-score formulas

**File:** `/mnt/experiments/astha-resume/src/wellbeing/engine/formulas.ts` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/wellbeing/__tests__/formulas.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  commuteScore,
  workHoursScore,
  workModeScore,
  realSalaryScore,
  airQualityScore,
  attritionScore,
  heatStressScore,
  commuteCostScore,
} from '../engine/formulas';

describe('wellbeing formulas', () => {
  describe('commuteScore', () => {
    it('returns 100 for 0-15 min commute', () => {
      expect(commuteScore(0)).toBe(100);
      expect(commuteScore(10)).toBe(100);
      expect(commuteScore(15)).toBe(100);
    });
    it('decays to ~70 at 30 min', () => {
      expect(commuteScore(30)).toBe(70);
    });
    it('decays to ~40 at 45 min', () => {
      expect(commuteScore(45)).toBe(40);
    });
    it('decays to ~20 at 60 min', () => {
      expect(commuteScore(60)).toBeCloseTo(20, 0);
    });
    it('bottoms at 5 for 90+ min', () => {
      expect(commuteScore(90)).toBe(5);
      expect(commuteScore(120)).toBe(5);
    });
  });

  describe('workHoursScore', () => {
    it('returns 100 for 40 or fewer hours', () => {
      expect(workHoursScore(35)).toBe(100);
      expect(workHoursScore(40)).toBe(100);
    });
    it('returns 90 for 41-45', () => {
      expect(workHoursScore(42)).toBe(90);
    });
    it('returns 70 for 46-50', () => {
      expect(workHoursScore(48)).toBe(70);
    });
    it('returns 40 for 51-55', () => {
      expect(workHoursScore(53)).toBe(40);
    });
    it('returns 15 for 60+ hours', () => {
      expect(workHoursScore(60)).toBe(15);
    });
  });

  describe('workModeScore', () => {
    it('returns 100 for hybrid 2-3 days', () => {
      expect(workModeScore('hybrid')).toBe(100);
    });
    it('returns 50 for fully onsite', () => {
      expect(workModeScore('onsite')).toBe(50);
    });
    it('returns 70 for fully remote', () => {
      expect(workModeScore('remote')).toBe(70);
    });
  });

  describe('realSalaryScore', () => {
    it('scores based on adjusted salary vs national median', () => {
      // 12L salary in city with 1.46 CoL = 8.2L real
      const score = realSalaryScore(1200000, 1.46);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
    it('caps at 100', () => {
      expect(realSalaryScore(3000000, 1.0)).toBe(100);
    });
  });

  describe('airQualityScore', () => {
    it('returns 100 for clean air', () => {
      expect(airQualityScore(10)).toBe(100);
    });
    it('returns 30 for heavy pollution', () => {
      expect(airQualityScore(80)).toBe(30);
    });
    it('returns 10 for severe pollution', () => {
      expect(airQualityScore(150)).toBe(10);
    });
  });

  describe('attritionScore', () => {
    it('returns high score for low attrition', () => {
      expect(attritionScore(5)).toBe(85);
    });
    it('returns low score for high attrition', () => {
      expect(attritionScore(35)).toBe(0);
    });
  });

  describe('heatStressScore', () => {
    it('returns 100 for cool climate', () => {
      expect(heatStressScore(22)).toBe(100);
    });
    it('returns 30 for extreme heat', () => {
      expect(heatStressScore(35)).toBe(30);
    });
    it('returns 10 for dangerous heat', () => {
      expect(heatStressScore(38)).toBe(10);
    });
  });

  describe('commuteCostScore', () => {
    it('returns 100 for zero cost', () => {
      expect(commuteCostScore(0, 50000)).toBe(100);
    });
    it('penalizes high cost ratio', () => {
      // 5000/50000 = 10% -> score = 0
      expect(commuteCostScore(5000, 50000)).toBe(0);
    });
    it('returns moderate score for moderate cost', () => {
      // 2000/50000 = 4% -> score = 60
      expect(commuteCostScore(2000, 50000)).toBe(60);
    });
  });
});
```

**Implementation:**

```typescript
// /mnt/experiments/astha-resume/src/wellbeing/engine/formulas.ts

/**
 * Wellbeing sub-score formulas.
 * All return 0-100. Higher = better for candidate wellbeing.
 * Each formula cites research from spec section 4.3.
 */

/**
 * Commute score (non-linear decay).
 * Redmond & Mokhtarian 2001: optimal ~15 min.
 * Clark et al. 2020: 10 min extra = 19% pay cut equivalent.
 */
export function commuteScore(minutes: number): number {
  if (minutes <= 15) return 100;
  if (minutes <= 30) return Math.round(100 - (minutes - 15) * 2.0);
  if (minutes <= 45) return Math.round(70 - (minutes - 30) * 2.0);
  if (minutes <= 60) return Math.round(40 - (minutes - 45) * 1.33);
  if (minutes <= 90) return Math.round(20 - (minutes - 60) * 0.5);
  return 5;
}

/**
 * Work hours score.
 * WHO/ILO Pega et al. 2021: 55+ hrs/wk = 35% higher stroke risk.
 */
export function workHoursScore(hoursPerWeek: number): number {
  if (hoursPerWeek <= 40) return 100;
  if (hoursPerWeek <= 45) return 90;
  if (hoursPerWeek <= 50) return 70;
  if (hoursPerWeek <= 55) return 40;
  return 15;
}

export type WorkMode = 'hybrid' | 'remote' | 'onsite' | 'hybrid-1';

/**
 * Work mode score.
 * Bloom et al. 2024 (Nature): hybrid cuts quit rates 35%.
 */
export function workModeScore(mode: WorkMode): number {
  switch (mode) {
    case 'hybrid':
      return 100;
    case 'hybrid-1':
      return 85;
    case 'remote':
      return 70;
    case 'onsite':
      return 50;
    default:
      return 50;
  }
}

/**
 * Real salary score (adjusted for cost of living).
 * Gallup Five Elements: Financial wellbeing dimension.
 */
export function realSalaryScore(
  offeredAnnual: number,
  costOfLivingIndex: number,
  nationalMedian: number = 600000,
): number {
  const realSalary = offeredAnnual / costOfLivingIndex;
  return Math.min(100, Math.round((realSalary / nationalMedian) * 50));
}

/**
 * Air quality score (PM2.5 based).
 * WHO PM2.5 guidelines. Graff Zivin & Neidell (IZA).
 */
export function airQualityScore(pm25: number): number {
  if (pm25 <= 15) return 100;
  if (pm25 <= 25) return 80;
  if (pm25 <= 50) return 60;
  if (pm25 <= 100) return 30;
  return 10;
}

/**
 * Industry attrition score.
 * NASSCOM/Aon 2024 data.
 */
export function attritionScore(attritionPct: number): number {
  return Math.max(0, 100 - attritionPct * 3);
}

/**
 * Heat stress score (WBGT based).
 * Nature Scientific Reports 2026.
 */
export function heatStressScore(wbgtCelsius: number): number {
  if (wbgtCelsius <= 25) return 100;
  if (wbgtCelsius <= 30) return 70;
  if (wbgtCelsius <= 35) return 30;
  return 10;
}

/**
 * Commute cost score.
 * ORF India commute economics.
 */
export function commuteCostScore(
  monthlyCommuteCost: number,
  monthlySalary: number,
): number {
  if (monthlySalary <= 0) return 50;
  const costPct = (monthlyCommuteCost / monthlySalary) * 100;
  return Math.max(0, Math.round(100 - costPct * 10));
}
```

### Task 5.3: Research citations registry

**File:** `/mnt/experiments/astha-resume/src/wellbeing/engine/citations.ts` (NEW)

```typescript
// /mnt/experiments/astha-resume/src/wellbeing/engine/citations.ts

export interface Citation {
  id: string;
  short: string;
  full: string;
  insight: string;
}

export const CITATIONS: Record<string, Citation> = {
  commute_stutzer: {
    id: 'commute_stutzer',
    short: 'Stutzer & Frey 2008',
    full: 'Stutzer, A. & Frey, B.S. (2008). "Stress That Doesn\'t Pay." Scand. J. Economics 110(2):339-366.',
    insight: 'Longer commutes reduce life satisfaction with no compensating benefit from higher pay.',
  },
  commute_clark: {
    id: 'commute_clark',
    short: 'Clark et al. 2020',
    full: 'Clark, B. et al. (2020). "How commuting affects subjective wellbeing." Transportation 47:2783-2805.',
    insight: 'Each extra 10 minutes of commute feels like a 19% pay cut in wellbeing terms.',
  },
  commute_redmond: {
    id: 'commute_redmond',
    short: 'Redmond & Mokhtarian 2001',
    full: 'Redmond, L.S. & Mokhtarian, P.L. (2001). "Positive utility of the commute." Transportation 28(2):139-160.',
    insight: 'Optimal commute is about 15 minutes. Below or above reduces satisfaction.',
  },
  hours_who: {
    id: 'hours_who',
    short: 'WHO/ILO Pega et al. 2021',
    full: 'Pega, F. et al. / WHO/ILO (2021). "Long working hours and mortality." Environment International 194.',
    insight: 'Working 55+ hours per week increases stroke risk by 35% and heart disease risk by 17%.',
  },
  hybrid_bloom: {
    id: 'hybrid_bloom',
    short: 'Bloom et al. 2024',
    full: 'Bloom, N. et al. (2024). "Hybrid work study." Nature.',
    insight: 'Hybrid work (2-3 office days) cuts quit rates by 35% with equal productivity.',
  },
  remote_gajendran: {
    id: 'remote_gajendran',
    short: 'Gajendran & Harrison 2007',
    full: 'Gajendran, R.S. & Harrison, D.A. (2007). "Remote work meta-analysis." 108 studies, 45K participants.',
    insight: 'Remote work boosts job satisfaction and reduces role stress and turnover intent.',
  },
  air_graff: {
    id: 'air_graff',
    short: 'Graff Zivin & Neidell',
    full: 'Graff Zivin, J. & Neidell, M. "Air pollution and productivity." IZA World of Labour.',
    insight: 'A 10-unit AQI increase corresponds to 0.35% productivity loss.',
  },
  heat_nature: {
    id: 'heat_nature',
    short: 'Nature Sci. Reports 2026',
    full: 'Nature Scientific Reports (2026). "Heat stress on labour productivity, Southern India."',
    insight: 'WBGT above 30C critically reduces outdoor and semi-outdoor labour productivity.',
  },
  gallup_wellbeing: {
    id: 'gallup_wellbeing',
    short: 'Gallup Five Elements',
    full: 'Rath, T. & Harter, J. / Gallup (2010). Wellbeing: Five Essential Elements.',
    insight: 'Career, Social, Financial, Community, and Physical wellbeing are interconnected.',
  },
  commute_murphy: {
    id: 'commute_murphy',
    short: 'Murphy et al. 2023',
    full: 'Murphy, K. et al. (2023). "Commuting demands meta-analysis." Work & Stress.',
    insight: '39-study meta-analysis confirming commute stress impacts health and job performance.',
  },
};

export function getCitation(id: string): Citation | null {
  return CITATIONS[id] ?? null;
}

export function getInsight(id: string): string {
  return CITATIONS[id]?.insight ?? '';
}
```

### Task 5.4: Google Maps Distance Matrix client

**File:** `/mnt/experiments/astha-resume/src/wellbeing/engine/mapsClient.ts` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/wellbeing/__tests__/mapsClient.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getCommuteData, type CommuteData } from '../engine/mapsClient';

describe('mapsClient', () => {
  it('returns null without API key', async () => {
    const result = await getCommuteData('', 'Solan', 'Bangalore');
    expect(result).toBeNull();
  });

  it('returns null for empty origins/destinations', async () => {
    const result = await getCommuteData('test-key', '', 'Bangalore');
    expect(result).toBeNull();
  });

  it('returns mock data structure on network failure', async () => {
    // fetch will fail in test environment
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))));
    const result = await getCommuteData('fake-key', 'Solan', 'Bangalore');
    expect(result).toBeNull();
    vi.unstubAllGlobals();
  });
});
```

**Implementation:**

```typescript
// /mnt/experiments/astha-resume/src/wellbeing/engine/mapsClient.ts

export interface CommuteData {
  distanceKm: number;
  drivingMinutes: number;
  transitMinutes: number | null;
  origin: string;
  destination: string;
}

/**
 * Query Google Maps Distance Matrix API for commute data.
 * Returns driving and transit durations.
 */
export async function getCommuteData(
  apiKey: string,
  origin: string,
  destination: string,
): Promise<CommuteData | null> {
  if (!apiKey || !origin.trim() || !destination.trim()) return null;

  const baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';

  try {
    // Fetch driving and transit in parallel
    const [drivingRes, transitRes] = await Promise.allSettled([
      fetch(
        `${baseUrl}?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&key=${apiKey}`,
      ),
      fetch(
        `${baseUrl}?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=transit&key=${apiKey}`,
      ),
    ]);

    let distanceKm = 0;
    let drivingMinutes = 0;
    let transitMinutes: number | null = null;

    if (drivingRes.status === 'fulfilled') {
      const data = await drivingRes.value.json();
      const element = data?.rows?.[0]?.elements?.[0];
      if (element?.status === 'OK') {
        distanceKm = (element.distance?.value ?? 0) / 1000;
        drivingMinutes = (element.duration?.value ?? 0) / 60;
      }
    }

    if (transitRes.status === 'fulfilled') {
      const data = await transitRes.value.json();
      const element = data?.rows?.[0]?.elements?.[0];
      if (element?.status === 'OK') {
        transitMinutes = (element.duration?.value ?? 0) / 60;
      }
    }

    if (distanceKm === 0 && drivingMinutes === 0) return null;

    return {
      distanceKm,
      drivingMinutes,
      transitMinutes,
      origin,
      destination,
    };
  } catch {
    return null;
  }
}
```

### Task 5.5: Composite wellbeing scorer

**File:** `/mnt/experiments/astha-resume/src/wellbeing/engine/wellbeingScorer.ts` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/wellbeing/__tests__/wellbeingScorer.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  computeWellbeing,
  classifyScore,
  type WellbeingInput,
  type WellbeingResult,
} from '../engine/wellbeingScorer';

describe('wellbeingScorer', () => {
  function goodInput(): WellbeingInput {
    return {
      commuteMinutes: 15,
      workHoursPerWeek: 40,
      workMode: 'hybrid',
      offeredSalaryAnnual: 1200000,
      officeCity: 'Bangalore',
      candidateCity: 'Bangalore',
      industry: 'technology',
      commuteMode: 'transit',
      isRelocation: false,
    };
  }

  it('returns a composite score between 0-100', () => {
    const result = computeWellbeing(goodInput());
    expect(result.composite).toBeGreaterThanOrEqual(0);
    expect(result.composite).toBeLessThanOrEqual(100);
  });

  it('returns all 8 sub-scores', () => {
    const result = computeWellbeing(goodInput());
    expect(result.subscores.commute).toBeDefined();
    expect(result.subscores.workHours).toBeDefined();
    expect(result.subscores.workMode).toBeDefined();
    expect(result.subscores.realSalary).toBeDefined();
    expect(result.subscores.airQuality).toBeDefined();
    expect(result.subscores.attrition).toBeDefined();
    expect(result.subscores.heatStress).toBeDefined();
    expect(result.subscores.commuteCost).toBeDefined();
  });

  it('scores good conditions high', () => {
    const result = computeWellbeing(goodInput());
    expect(result.composite).toBeGreaterThan(70);
  });

  it('scores bad conditions low', () => {
    const result = computeWellbeing({
      commuteMinutes: 90,
      workHoursPerWeek: 60,
      workMode: 'onsite',
      offeredSalaryAnnual: 300000,
      officeCity: 'Delhi',
      candidateCity: 'Delhi',
      industry: 'bpo',
      commuteMode: 'driving',
      isRelocation: false,
    });
    expect(result.composite).toBeLessThan(40);
  });

  it('applies relocation penalty', () => {
    const without = computeWellbeing(goodInput());
    const withReloc = computeWellbeing({ ...goodInput(), isRelocation: true });
    expect(withReloc.composite).toBeLessThan(without.composite);
  });

  it('classifies scores correctly', () => {
    expect(classifyScore(90).level).toBe('thriving');
    expect(classifyScore(65).level).toBe('comfortable');
    expect(classifyScore(45).level).toBe('strained');
    expect(classifyScore(30).level).toBe('at-risk');
    expect(classifyScore(10).level).toBe('concerning');
  });

  it('provides citations for each sub-score', () => {
    const result = computeWellbeing(goodInput());
    expect(result.subscores.commute.citations.length).toBeGreaterThan(0);
    expect(result.subscores.workHours.citations.length).toBeGreaterThan(0);
  });

  it('handles remote work mode with commute = 100', () => {
    const result = computeWellbeing({
      ...goodInput(),
      workMode: 'remote',
      commuteMinutes: 0,
    });
    expect(result.subscores.commute.score).toBe(100);
  });
});
```

**Implementation:**

```typescript
// /mnt/experiments/astha-resume/src/wellbeing/engine/wellbeingScorer.ts

import {
  commuteScore,
  workHoursScore,
  workModeScore,
  realSalaryScore,
  airQualityScore,
  attritionScore,
  heatStressScore,
  commuteCostScore,
  type WorkMode,
} from './formulas';
import { getCityCoL, NATIONAL_MEDIAN_SALARY_ANNUAL } from '../data/cityCoL';
import { getCityPM25 } from '../data/cityAQI';
import { getCityWBGT } from '../data/cityWBGT';
import { getAttritionRate } from '../data/attritionRates';
import { getTransitCost } from '../data/transitCosts';
import { FUEL_COST_PER_KM, WORKDAYS_PER_MONTH } from '../data/fuelRate';
import { CITATIONS } from './citations';

export interface WellbeingInput {
  commuteMinutes: number;
  workHoursPerWeek: number;
  workMode: WorkMode;
  offeredSalaryAnnual: number;
  officeCity: string;
  candidateCity: string;
  industry: string;
  commuteMode: 'driving' | 'transit' | 'walking' | 'cycling';
  isRelocation: boolean;
  /** Optional: actual driving distance in km (from Maps API) */
  commuteDistanceKm?: number;
}

export interface SubScore {
  score: number;
  label: string;
  detail: string;
  citations: string[];
  weight: number;
}

export interface WellbeingResult {
  composite: number;
  subscores: {
    commute: SubScore;
    workHours: SubScore;
    workMode: SubScore;
    realSalary: SubScore;
    airQuality: SubScore;
    attrition: SubScore;
    heatStress: SubScore;
    commuteCost: SubScore;
  };
  classification: ScoreClassification;
}

export interface ScoreClassification {
  level: 'thriving' | 'comfortable' | 'strained' | 'at-risk' | 'concerning';
  message: string;
  color: string;
}

export function classifyScore(score: number): ScoreClassification {
  if (score >= 80)
    return {
      level: 'thriving',
      message: 'This role fits your life well.',
      color: 'var(--saathi-success-text)',
    };
  if (score >= 60)
    return {
      level: 'comfortable',
      message: 'Good match with a few things to consider.',
      color: 'var(--saathi-warning)',
    };
  if (score >= 40)
    return {
      level: 'strained',
      message: 'Your commute may feel like a 30% pay cut (Clark et al. 2020).',
      color: '#f97316',
    };
  if (score >= 20)
    return {
      level: 'at-risk',
      message: 'Research shows this combination impacts health significantly.',
      color: 'var(--saathi-concern)',
    };
  return {
    level: 'concerning',
    message: 'We want to be honest: this setup is associated with burnout risk.',
    color: '#dc2626',
  };
}

export function computeWellbeing(input: WellbeingInput): WellbeingResult {
  const effectiveCity = input.isRelocation ? input.officeCity : input.candidateCity;
  const col = getCityCoL(input.officeCity);
  const pm25 = getCityPM25(input.officeCity);
  const wbgt = getCityWBGT(input.officeCity);
  const attrition = getAttritionRate(input.industry);
  const transit = getTransitCost(effectiveCity);
  const monthlySalary = input.offeredSalaryAnnual / 12;

  // Commute cost calculation
  let monthlyCommuteCost = 0;
  if (input.workMode === 'remote') {
    monthlyCommuteCost = 0;
  } else if (input.commuteMode === 'transit') {
    monthlyCommuteCost = transit.monthlyPass;
  } else if (input.commuteMode === 'driving') {
    const distanceKm = input.commuteDistanceKm ?? input.commuteMinutes * 0.6; // rough estimate: 36 km/h avg
    monthlyCommuteCost = distanceKm * 2 * FUEL_COST_PER_KM * WORKDAYS_PER_MONTH;
  }

  const effectiveCommuteMinutes =
    input.workMode === 'remote' ? 0 : input.commuteMinutes;

  // Adjust heat stress for AC commute
  const adjustedWBGT =
    input.commuteMode === 'transit' || input.commuteMode === 'driving'
      ? wbgt * 0.85 // AC reduces effective WBGT
      : wbgt;

  const subscores = {
    commute: {
      score: commuteScore(effectiveCommuteMinutes),
      label: 'Commute',
      detail: `${effectiveCommuteMinutes} min one-way`,
      citations: [
        CITATIONS.commute_clark.short,
        CITATIONS.commute_stutzer.short,
        CITATIONS.commute_redmond.short,
      ],
      weight: 0.25,
    },
    workHours: {
      score: workHoursScore(input.workHoursPerWeek),
      label: 'Work Hours',
      detail: `${input.workHoursPerWeek} hrs/week`,
      citations: [CITATIONS.hours_who.short],
      weight: 0.20,
    },
    workMode: {
      score: workModeScore(input.workMode),
      label: 'Work Mode',
      detail: input.workMode,
      citations: [CITATIONS.hybrid_bloom.short],
      weight: 0.15,
    },
    realSalary: {
      score: realSalaryScore(input.offeredSalaryAnnual, col, NATIONAL_MEDIAN_SALARY_ANNUAL),
      label: 'Real Salary',
      detail: `Adjusted for ${input.officeCity} CoL (${col}x)`,
      citations: [CITATIONS.gallup_wellbeing.short],
      weight: 0.15,
    },
    airQuality: {
      score: airQualityScore(pm25),
      label: 'Air Quality',
      detail: `PM2.5: ${pm25} ug/m3`,
      citations: [CITATIONS.air_graff.short],
      weight: 0.10,
    },
    attrition: {
      score: attritionScore(attrition),
      label: 'Industry Stability',
      detail: `${attrition}% annual attrition`,
      citations: ['NASSCOM/Aon 2024'],
      weight: 0.05,
    },
    heatStress: {
      score: heatStressScore(adjustedWBGT),
      label: 'Heat Stress',
      detail: `WBGT ${Math.round(adjustedWBGT)}C`,
      citations: [CITATIONS.heat_nature.short],
      weight: 0.05,
    },
    commuteCost: {
      score: commuteCostScore(monthlyCommuteCost, monthlySalary),
      label: 'Commute Cost',
      detail: `~INR ${Math.round(monthlyCommuteCost).toLocaleString('en-IN')}/month`,
      citations: ['ORF India commute economics'],
      weight: 0.05,
    },
  };

  let composite =
    subscores.commute.score * subscores.commute.weight +
    subscores.workHours.score * subscores.workHours.weight +
    subscores.workMode.score * subscores.workMode.weight +
    subscores.realSalary.score * subscores.realSalary.weight +
    subscores.airQuality.score * subscores.airQuality.weight +
    subscores.attrition.score * subscores.attrition.weight +
    subscores.heatStress.score * subscores.heatStress.weight +
    subscores.commuteCost.score * subscores.commuteCost.weight;

  // Relocation penalty: -10 points (Gallup community wellbeing)
  if (input.isRelocation) {
    composite = Math.max(0, composite - 10);
  }

  composite = Math.round(composite);

  return {
    composite,
    subscores,
    classification: classifyScore(composite),
  };
}
```

**Commit:** `feat: Wellbeing score engine with 8 parameters, baked-in datasets, research citations`

---

## Phase 6: Candidate Wellbeing Dashboard

### Task 6.1: CandidateDashboard page

**File:** `/mnt/experiments/astha-resume/src/pages/CandidateDashboard.tsx` (NEW)

**Test first:** `/mnt/experiments/astha-resume/src/pages/__tests__/CandidateDashboard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/store/persist', () => ({
  createIndexedDBStorage: () => ({
    load: () => Promise.resolve(undefined),
    save: () => {},
  }),
}));

// Lazy import to allow mocking
const { CandidateDashboard } = await import('../CandidateDashboard');

describe('CandidateDashboard', () => {
  it('renders the dashboard heading', () => {
    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText('Your Career Health')).toBeInTheDocument();
  });

  it('shows three score cards', () => {
    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText('Skills Match')).toBeInTheDocument();
    expect(screen.getByText('Wellbeing Score')).toBeInTheDocument();
    expect(screen.getByText('Overall Fit')).toBeInTheDocument();
  });

  it('shows Life Impact Breakdown heading', () => {
    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText('Life Impact Breakdown')).toBeInTheDocument();
  });

  it("shows Saathi's Take section", () => {
    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText("Saathi's Take")).toBeInTheDocument();
  });
});
```

**Implementation:**

```typescript
// /mnt/experiments/astha-resume/src/pages/CandidateDashboard.tsx

import { useState, useMemo } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import {
  computeWellbeing,
  type WellbeingInput,
  type WellbeingResult,
  type SubScore,
} from '@/wellbeing/engine/wellbeingScorer';

function ScoreCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number;
  suffix: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--saathi-radius)',
      }}
    >
      <div
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      <div className="mt-2 text-4xl font-extrabold" style={{ color }}>
        {value}
        <span className="text-lg">{suffix}</span>
      </div>
    </div>
  );
}

function SubScoreRow({ sub }: { sub: SubScore & { key: string } }) {
  const barColor =
    sub.score >= 70
      ? 'var(--saathi-success-text)'
      : sub.score >= 40
        ? 'var(--saathi-warning)'
        : 'var(--saathi-concern)';

  return (
    <div
      className="border-b p-4 last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {sub.label}
          </span>
          <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {sub.detail}
          </span>
        </div>
        <span className="text-sm font-bold" style={{ color: barColor }}>
          {sub.score}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${sub.score}%`,
            background: barColor,
            transition: 'width var(--saathi-transition)',
          }}
        />
      </div>
      {sub.citations.length > 0 && (
        <p
          className="mt-1 text-xs italic"
          style={{ color: 'var(--text-muted)' }}
        >
          {sub.citations.join('; ')}
        </p>
      )}
    </div>
  );
}

export function CandidateDashboard() {
  const resume = useResumeStore((s) => s.resume);
  const name = resume.personal.name || 'Candidate';

  // For demo/initial state, use reasonable defaults
  const [input] = useState<WellbeingInput>({
    commuteMinutes: 30,
    workHoursPerWeek: 45,
    workMode: 'hybrid',
    offeredSalaryAnnual: 800000,
    officeCity: 'Bangalore',
    candidateCity: resume.personal.location || 'Bangalore',
    industry: 'technology',
    commuteMode: 'transit',
    isRelocation: false,
  });

  const result: WellbeingResult = useMemo(() => computeWellbeing(input), [input]);

  // Simple skills match placeholder (to be wired to orchestrator)
  const skillsMatch = 72;
  const overallFit = Math.round((skillsMatch + result.composite) / 2);

  const subscoreEntries = Object.entries(result.subscores).map(([key, sub]) => ({
    key,
    ...sub,
  }));

  const classification = result.classification;

  return (
    <div
      className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8"
      style={{
        background: `linear-gradient(180deg, var(--saathi-bg-warm) 0%, var(--saathi-bg-cream) 100%)`,
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <div className="mb-8 flex items-center justify-between">
        <h1
          className="text-2xl font-extrabold"
          style={{ color: 'var(--text-primary)' }}
        >
          Your Career Health
        </h1>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {name}
        </span>
      </div>

      {/* Three score cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScoreCard
          label="Skills Match"
          value={skillsMatch}
          suffix="%"
          color="var(--saathi-accent-teal)"
        />
        <ScoreCard
          label="Wellbeing Score"
          value={result.composite}
          suffix=""
          color={classification.color}
        />
        <ScoreCard
          label="Overall Fit"
          value={overallFit}
          suffix="%"
          color="var(--saathi-accent-teal)"
        />
      </div>

      {/* Classification banner */}
      <div
        className="mb-8 rounded-xl p-4 text-center"
        style={{
          background: 'var(--saathi-accent-teal-light)',
          borderRadius: 'var(--saathi-radius)',
        }}
      >
        <p
          className="text-sm font-medium"
          style={{ color: classification.color, lineHeight: 'var(--saathi-line-height)' }}
        >
          {classification.message}
        </p>
      </div>

      {/* Life Impact Breakdown */}
      <h2
        className="mb-4 text-lg font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Life Impact Breakdown
      </h2>
      <div
        className="mb-8 overflow-hidden rounded-xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--saathi-radius)',
        }}
      >
        {subscoreEntries.map((sub) => (
          <SubScoreRow key={sub.key} sub={sub} />
        ))}
      </div>

      {/* Saathi's Take */}
      <h2
        className="mb-4 text-lg font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Saathi's Take
      </h2>
      <div
        className="mb-8 rounded-xl p-5"
        style={{
          background: 'var(--saathi-accent-teal-light)',
          borderRadius: 'var(--saathi-radius)',
          lineHeight: 'var(--saathi-line-height)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {generateSaathiTake(result, name, input)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-[44px] rounded-xl px-6 py-2 text-sm font-medium text-white"
          style={{
            background: 'var(--saathi-accent-teal)',
            borderRadius: 'var(--saathi-radius)',
          }}
        >
          Apply with Confidence
        </button>
        <button
          type="button"
          className="min-h-[44px] rounded-xl border px-6 py-2 text-sm font-medium"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--saathi-radius)',
          }}
        >
          Save for Later
        </button>
      </div>
    </div>
  );
}

function generateSaathiTake(
  result: WellbeingResult,
  name: string,
  input: WellbeingInput,
): string {
  const parts: string[] = [];
  const { subscores } = result;

  // Lead with strengths
  const strengths = Object.values(subscores).filter((s) => s.score >= 80);
  if (strengths.length > 0) {
    parts.push(
      `Good news, ${name}: ${strengths.map((s) => s.label.toLowerCase()).join(' and ')} look strong.`,
    );
  }

  // Flag concerns
  const concerns = Object.values(subscores).filter((s) => s.score < 50);
  if (concerns.length > 0) {
    for (const c of concerns.slice(0, 2)) {
      if (c.label === 'Commute') {
        parts.push(
          `Watch the commute. ${input.commuteMinutes} minutes each way adds up. Consider locations closer to the office, or negotiate an extra WFH day.`,
        );
      } else if (c.label === 'Air Quality') {
        parts.push(
          `Air quality in ${input.officeCity} is a concern. An air purifier at home and an N95 for commute can help.`,
        );
      } else if (c.label === 'Work Hours') {
        parts.push(
          `${input.workHoursPerWeek} hours a week is above the WHO safety threshold. Make sure this is temporary, not the norm.`,
        );
      } else {
        parts.push(`Keep an eye on ${c.label.toLowerCase()}: ${c.detail}.`);
      }
    }
  }

  if (parts.length === 0) {
    parts.push(`This looks like a solid match, ${name}. The numbers back it up.`);
  }

  return parts.join(' ');
}
```

**Commit:** `feat: Candidate wellbeing dashboard with life impact breakdown and Saathi's take`

---

## Phase 7: Routing and Page Wiring

### Task 7.1: Rename Builder to BuilderLegacy, create SaathiBuilder

**File:** `/mnt/experiments/astha-resume/src/pages/SaathiBuilder.tsx` (NEW)

```typescript
// /mnt/experiments/astha-resume/src/pages/SaathiBuilder.tsx

import { SaathiChat } from '@/saathi/components/SaathiChat';

export function SaathiBuilder() {
  return <SaathiChat />;
}
```

**File:** `/mnt/experiments/astha-resume/src/pages/BuilderLegacy.tsx` (NEW)

```typescript
// /mnt/experiments/astha-resume/src/pages/BuilderLegacy.tsx
// Re-export the original Builder component as the legacy form builder.

export { Builder as BuilderLegacy } from './Builder';
```

### Task 7.2: Update App.tsx routes

**File:** `/mnt/experiments/astha-resume/src/App.tsx`
**Action:** Modify

Changes:
1. Import `SaathiBuilder` and `CandidateDashboard` as lazy components.
2. `/builder` now routes to `SaathiBuilder`.
3. `/builder/form` routes to the original `Builder` (legacy form).
4. `/builder/dashboard` routes to `CandidateDashboard`.

Replace the existing builder-related imports and routes:

In imports section, add after existing lazy imports:
```typescript
const SaathiBuilder = lazy(() =>
  import('./pages/SaathiBuilder').then((m) => ({ default: m.SaathiBuilder })),
);
const CandidateDashboard = lazy(() =>
  import('./pages/CandidateDashboard').then((m) => ({ default: m.CandidateDashboard })),
);
```

Change the import of `Builder` from a direct import to lazy:
```typescript
const BuilderLegacy = lazy(() =>
  import('./pages/Builder').then((m) => ({ default: m.Builder })),
);
```

Remove the direct import: `import { Builder } from './pages/Builder';`

In the Routes, replace:
```tsx
<Route path="builder" element={<Builder />} />
```
with:
```tsx
<Route path="builder" element={<SaathiBuilder />} />
<Route path="builder/form" element={<BuilderLegacy />} />
<Route path="builder/dashboard" element={<CandidateDashboard />} />
```

**Commit:** `feat: route /builder to Saathi, add /builder/form (legacy) and /builder/dashboard`

---

## Phase 8: Landing Page Update

### Task 8.1: Update Landing page for Saathi-first experience

**File:** `/mnt/experiments/astha-resume/src/pages/Landing.tsx`
**Action:** Modify

Changes:
1. Update hero copy to mention Saathi.
2. Update the "I'm a Student" card to say "Talk to Saathi" with warm teal accent.
3. Keep existing structure, update text and colors.

Replace the hero `<h1>` text:
```
Your Resume. Your Career.
AI-Powered.
```
with:
```
Meet Saathi. Your Career Companion.
```

Replace the hero `<p>` text with:
```
Talk to Saathi like a friend. In any language. Your resume builds itself. Then see which jobs actually fit your life.
```

Update pills:
```typescript
const PILLS = [
  'Conversational Resume Building',
  'Voice Input in 11 Languages',
  'Wellbeing Score for Every Job',
  'Research-Backed Insights',
  'Zero Data Leaves Your Device',
] as const;
```

Update the hero gradient to include warm teal:
```
background: linear-gradient(170deg, var(--accent-navy) 0%, var(--saathi-accent-teal) 60%, var(--accent-navy) 100%)
```

Update the "I'm a Student" card:
- Title: "Talk to Saathi"
- Description: "Build your resume through conversation. Voice or text. Any language. Get a career health score for every opportunity."
- Button text: "Start Talking"
- Button color: `background: 'var(--saathi-accent-teal)'`

**Commit:** `feat: update Landing page for Saathi-first experience`

---

## Phase 9: Integration and Gap Fixes

### Task 9.1: Add coachSuggestions to Candidate type

**File:** `/mnt/experiments/astha-resume/src/store/types.ts`
**Action:** Modify

Add to the `Candidate` interface:
```typescript
  coachSuggestions?: Array<{
    section: string;
    severity: 'high' | 'medium' | 'tip';
    title: string;
    description: string;
    fix?: string;
    citation?: string;
  }>;
```

### Task 9.2: Display coach suggestions in CandidateDetail

**File:** `/mnt/experiments/astha-resume/src/pages/CandidateDetail.tsx`
**Action:** Modify

After the existing `ScoreBreakdown` and `RedFlagPanel` sections, add a coach suggestions section:

```tsx
{candidate.coachSuggestions && candidate.coachSuggestions.length > 0 && (
  <section className="mt-6">
    <h3
      className="mb-3 text-lg font-bold"
      style={{ color: 'var(--accent-navy)' }}
    >
      Coach Suggestions
    </h3>
    <div className="space-y-3">
      {candidate.coachSuggestions.map((suggestion, i) => (
        <div
          key={i}
          className="rounded-lg p-4"
          style={{
            background:
              suggestion.severity === 'high'
                ? 'rgba(228,26,26,0.08)'
                : suggestion.severity === 'medium'
                  ? 'rgba(255,220,0,0.08)'
                  : 'rgba(46,204,64,0.08)',
            border: `1px solid ${
              suggestion.severity === 'high'
                ? 'var(--accent-red)'
                : suggestion.severity === 'medium'
                  ? 'var(--accent-gold)'
                  : '#2ecc40'
            }20`,
          }}
        >
          <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {suggestion.title}
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {suggestion.description}
          </p>
          {suggestion.fix && (
            <p className="mt-1 text-xs italic" style={{ color: 'var(--text-muted)' }}>
              Fix: {suggestion.fix}
            </p>
          )}
          {suggestion.citation && (
            <p className="mt-1 text-xs italic" style={{ color: 'var(--text-muted)' }}>
              {suggestion.citation}
            </p>
          )}
        </div>
      ))}
    </div>
  </section>
)}
```

### Task 9.3: Wire orchestrator coachSuggestions to Candidate

**File:** `/mnt/experiments/astha-resume/src/store/employerStore.ts`
**Action:** No change needed. The `updateCandidate` method already accepts `Partial<Candidate>`, so callers can add `coachSuggestions` via the existing API.

**File:** `/mnt/experiments/astha-resume/src/pages/Employer.tsx` (or wherever `analyzeResumeAgentic` is called)
**Action:** Verify caller passes `coachSuggestions` from pipeline result to `updateCandidate`.

Search for calls to `analyzeResumeAgentic` and ensure `coachSuggestions` is stored. The orchestrator already returns `coachSuggestions` in its result. The caller just needs to include it in the `updateCandidate` call.

### Task 9.4: Update stale references

**File:** `/mnt/experiments/astha-resume/src/ai/agents/L3_ReasonAgent.ts`
**Action:** Modify

Replace header comment:
```
L3 Reasoning Agent -- Gemma 4 E2B via WebLLM.
Loads gemma-4-E2B-it-ONNX in the browser via @mlc-ai/web-llm.
```
with:
```
L3 Reasoning Agent -- Gemma 4 E2B via Transformers.js.
Loads gemma-4-E2B-it-ONNX in the browser via @huggingface/transformers.
```

**File:** `/mnt/experiments/astha-resume/src/bridge/hooks/useSelfAssessment.ts`
**Action:** Modify

Replace comment reference:
```
Wang et al. (2020) MiniLM semantic similarity
```
with:
```
Wang et al. (2024) E5 Text Embeddings (ACL)
```

**File:** `/mnt/experiments/astha-resume/src/ai/agents/L2_EmbedAgent.ts`
**Action:** Check for MiniLM references and update to E5-small.

**File:** `/mnt/experiments/astha-resume/README.md`
**Action:** Replace any "MiniLM" with "E5-small" and "WebLLM" with "Transformers.js".

### Task 9.5: Wire orchestrator to bridge self-assessment

**File:** `/mnt/experiments/astha-resume/src/bridge/hooks/useSelfAssessment.ts`
**Action:** Modify

Replace the sync-only `analyzeL2Sync` call with an async path that tries `analyzeL2` first (which uses E5-small ONNX) and falls back to `analyzeL2Sync` (TF-IDF).

In the `assess` function, change:
```typescript
const l2 = analyzeL2Sync(resumeText, jdText);
```
to:
```typescript
let l2;
try {
  l2 = await analyzeL2(resumeText, jdText);
} catch {
  l2 = analyzeL2Sync(resumeText, jdText);
}
```

And update the `assess` function signature to be `async`.

### Task 9.6: Remove dead code

**File:** `/mnt/experiments/astha-resume/src/ai/pipeline.ts`
**Action:** Verify no imports reference it other than the spec. If no runtime imports exist (only the orchestrator index.ts exports the new pipeline), keep it but ensure the `@deprecated` tag is prominent. Based on the grep results, no src files import from `pipeline.ts`, so it can be safely deleted.

**File:** `/mnt/experiments/astha-resume/src/ai/models/capabilities.ts`
**Action:** Based on grep, only `ModelDownloadScreen.tsx` imports from it. The `capabilities.ts` file is actually in use. Leave it.

**File:** `/mnt/experiments/astha-resume/src/employer/components/CitationTooltip.tsx`
**Action:** Based on grep, it IS used by `ScoreBreakdown.tsx` and `RedFlagPanel.tsx`. It is NOT dead code. Leave it.

**Commit:** `fix: add coachSuggestions to Candidate, update stale refs, wire orchestrator to bridge, remove dead pipeline.ts`

---

## Phase 10: DistilBERT-NER ONNX Integration (Tier 1)

### Task 10.1: NER model loader

**File:** `/mnt/experiments/astha-resume/src/saathi/engine/nerModel.ts` (NEW)

```typescript
// /mnt/experiments/astha-resume/src/saathi/engine/nerModel.ts

/**
 * DistilBERT-NER ONNX model loader via @huggingface/transformers.
 * Loads Xenova/distilbert-NER INT8 (67MB) for entity extraction.
 * Entities: PER, ORG, LOC, MISC.
 * Citation: Sanh, V. et al. (2019). "DistilBERT." NeurIPS Workshop.
 */

import { pipeline as tfPipeline, type TokenClassificationPipeline } from '@huggingface/transformers';

let nerPipeline: TokenClassificationPipeline | null = null;
let loading: Promise<TokenClassificationPipeline> | null = null;

export interface NEREntity {
  word: string;
  entity_group: 'PER' | 'ORG' | 'LOC' | 'MISC';
  score: number;
  start: number;
  end: number;
}

/**
 * Load the NER model. Cached after first load.
 * Returns null if loading fails (graceful degradation to regex-only extraction).
 */
export async function loadNER(): Promise<TokenClassificationPipeline | null> {
  if (nerPipeline) return nerPipeline;
  if (loading) return loading;

  loading = tfPipeline('token-classification', 'Xenova/distilbert-NER', {
    dtype: 'q8',
  })
    .then((p) => {
      nerPipeline = p as TokenClassificationPipeline;
      return nerPipeline;
    })
    .catch(() => {
      loading = null;
      return null;
    });

  return loading;
}

/**
 * Run NER on text. Returns extracted entities with types.
 * Falls back to empty array if model not loaded.
 */
export async function extractNEREntities(text: string): Promise<NEREntity[]> {
  const model = await loadNER();
  if (!model) return [];

  try {
    const results = await model(text, { aggregation_strategy: 'simple' });
    return (results as any[]).map((r) => ({
      word: r.word,
      entity_group: r.entity_group,
      score: r.score,
      start: r.start,
      end: r.end,
    }));
  } catch {
    return [];
  }
}

/** Check if NER model is ready (loaded) */
export function isNERReady(): boolean {
  return nerPipeline !== null;
}
```

### Task 10.2: Enhance entity extractor with NER

**File:** `/mnt/experiments/astha-resume/src/saathi/engine/entityExtractor.ts`
**Action:** Modify

Add an async version that uses NER for better extraction:

Add at the end of the file:

```typescript
import { extractNEREntities, type NEREntity } from './nerModel';

/**
 * Enhanced entity extraction using DistilBERT-NER + regex patterns.
 * NER extracts PER (name), ORG (company/institution), LOC (location).
 * Regex patterns extract structured data (email, phone, GPA, dates, skills).
 * Falls back to regex-only if NER model not available.
 */
export async function extractEntitiesEnhanced(text: string): Promise<ExtractedEntities> {
  // Start with regex extraction
  const result = extractEntities(text);

  // Enhance with NER
  const nerEntities = await extractNEREntities(text);

  for (const entity of nerEntities) {
    if (entity.score < 0.5) continue; // low confidence

    switch (entity.entity_group) {
      case 'PER':
        // Names: only use if regex didn't find one and it looks like a name
        if (result.properNouns.indexOf(entity.word) === -1) {
          result.properNouns.push(entity.word);
        }
        break;
      case 'ORG':
        // Might be company or institution
        if (result.properNouns.indexOf(entity.word) === -1) {
          result.properNouns.push(entity.word);
        }
        break;
      case 'LOC':
        // Locations
        if (result.properNouns.indexOf(entity.word) === -1) {
          result.properNouns.push(entity.word);
        }
        break;
    }
  }

  return result;
}
```

**Commit:** `feat: DistilBERT-NER ONNX integration for enhanced entity extraction`

---

## Phase 11: Final Polish

### Task 11.1: Add Saathi barrel export

**File:** `/mnt/experiments/astha-resume/src/saathi/index.ts` (NEW)

```typescript
export { SaathiChat } from './components/SaathiChat';
export { createConversation, processUserInput } from './engine/slotMachine';
export type { ConversationState, ChatMessage } from './engine/slotMachine';
export { slotsToResume } from './engine/resumeGenerator';
export { extractEntities, extractEntitiesEnhanced } from './engine/entityExtractor';
export { isSpeechSupported } from './voice/speechInput';
```

### Task 11.2: Add Wellbeing barrel export

**File:** `/mnt/experiments/astha-resume/src/wellbeing/index.ts` (NEW)

```typescript
export { computeWellbeing, classifyScore } from './engine/wellbeingScorer';
export type { WellbeingInput, WellbeingResult, SubScore, ScoreClassification } from './engine/wellbeingScorer';
export { CITATIONS, getCitation, getInsight } from './engine/citations';
export { getCommuteData } from './engine/mapsClient';
export type { CommuteData } from './engine/mapsClient';
```

### Task 11.3: Update vite.config.ts manual chunks

**File:** `/mnt/experiments/astha-resume/vite.config.ts`
**Action:** Modify

Add manual chunk for the saathi and wellbeing modules to keep them lazy-loaded:

```typescript
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  state: ['zustand'],
},
```

This is sufficient. The lazy imports in App.tsx already handle code splitting for the Saathi page.

### Task 11.4: Delete dead pipeline.ts

**File:** `/mnt/experiments/astha-resume/src/ai/pipeline.ts`
**Action:** Delete

Verify no imports reference it first. Based on grep, no src files import from `pipeline.ts`. Remove the file.

**Commit:** `chore: barrel exports, delete deprecated pipeline.ts`

---

## Verification Checklist

| Spec Section | Task(s) | Status |
|---|---|---|
| 3.1 Three-Tier AI Strategy | Tier 0: Tasks 2.1-2.5 (slot machine, templates). Tier 1: Task 10.1-10.2 (DistilBERT-NER). Tier 2/3: existing L3/L4 agents unchanged. | Covered |
| 3.2 Voice Input | Tasks 3.1-3.2 (Web Speech API, 11 languages) | Covered |
| 3.3 Entity Extraction Pipeline | Tasks 2.3, 10.1-10.2 (regex + NER) | Covered |
| 3.4 Slot-Filling State Machine | Tasks 2.1-2.4 (slots, phases, deviation handling) | Covered |
| 3.5 Response Generation | Task 2.2 (200+ template variants) | Covered |
| 4.1-4.7 Wellbeing Score Engine | Tasks 5.1-5.5 (8 params, formulas, datasets, Maps API, composite) | Covered |
| 5.1-5.3 Candidate Dashboard | Task 6.1 (score cards, life impact, Saathi's take, design tokens) | Covered |
| 6.1 Greeting Variants | Task 2.2 (8 greeting variants in response bank) | Covered |
| 6.2 NER Model Selection | Task 10.1 (DistilBERT-NER INT8 ONNX via Transformers.js) | Covered |
| 6.3 Language Handling | Task 3.1 (script detection for 10 Indic scripts) | Covered |
| 6.4 Resume Generation | Task 2.5 (slotsToResume) | Covered |
| 7.1 Critical Fixes | Task 9.1 (coachSuggestions), 9.2 (display), 9.4 (stale refs), 9.5 (bridge), 9.6 (dead code) | Covered |
| 7.2 Stale References | Task 9.4 (MiniLM->E5, WebLLM->Transformers.js) | Covered |
| 8 Data Sources | Task 5.1 (6 baked-in datasets, ~35KB total) | Covered |
| 9 Route Changes | Task 7.1-7.2 (/builder->Saathi, /builder/form, /builder/dashboard) | Covered |
| 10 Research Citations | Task 5.3 (10 citations with short/full/insight) | Covered |
| Design Tokens (5.3) | Task 1.1 (warm teal, soft gradients, spacing, transitions) | Covered |
| Landing Page Update | Task 8.1 (Saathi-first copy, warm teal accent) | Covered |

## File Map

### New Files (25)
```
src/saathi/engine/slots.ts
src/saathi/engine/responseBank.ts
src/saathi/engine/entityExtractor.ts
src/saathi/engine/slotMachine.ts
src/saathi/engine/resumeGenerator.ts
src/saathi/engine/nerModel.ts
src/saathi/voice/languageDetect.ts
src/saathi/voice/speechInput.ts
src/saathi/components/SaathiChat.tsx
src/saathi/components/ChatBubble.tsx
src/saathi/components/VoiceButton.tsx
src/saathi/components/SlotProgress.tsx
src/saathi/index.ts
src/saathi/__tests__/slots.test.ts
src/saathi/__tests__/responseBank.test.ts
src/saathi/__tests__/entityExtractor.test.ts
src/saathi/__tests__/slotMachine.test.ts
src/saathi/__tests__/resumeGenerator.test.ts
src/saathi/__tests__/languageDetect.test.ts
src/saathi/__tests__/speechInput.test.ts
src/saathi/__tests__/SaathiChat.test.tsx
src/wellbeing/engine/formulas.ts
src/wellbeing/engine/wellbeingScorer.ts
src/wellbeing/engine/citations.ts
src/wellbeing/engine/mapsClient.ts
src/wellbeing/data/cityCoL.ts
src/wellbeing/data/cityAQI.ts
src/wellbeing/data/cityWBGT.ts
src/wellbeing/data/attritionRates.ts
src/wellbeing/data/transitCosts.ts
src/wellbeing/data/fuelRate.ts
src/wellbeing/index.ts
src/wellbeing/__tests__/formulas.test.ts
src/wellbeing/__tests__/wellbeingScorer.test.ts
src/wellbeing/__tests__/mapsClient.test.ts
src/pages/SaathiBuilder.tsx
src/pages/BuilderLegacy.tsx
src/pages/CandidateDashboard.tsx
src/pages/__tests__/CandidateDashboard.test.tsx
src/theme/__tests__/tokens.test.ts
```

### Modified Files (8)
```
src/theme/tokens.css                    (add Saathi design tokens)
src/App.tsx                             (update routes)
src/pages/Landing.tsx                   (Saathi-first copy)
src/store/types.ts                      (add coachSuggestions to Candidate)
src/pages/CandidateDetail.tsx           (display coach suggestions)
src/ai/agents/L3_ReasonAgent.ts         (update WebLLM -> Transformers.js comment)
src/bridge/hooks/useSelfAssessment.ts   (async L2, update MiniLM ref)
README.md                              (update MiniLM/WebLLM references)
```

### Deleted Files (1)
```
src/ai/pipeline.ts                      (deprecated, no imports)
```
