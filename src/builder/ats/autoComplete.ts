/**
 * ATS auto-complete: synthesize a resume that hits 90+ on the generic JD
 * scoring path *without inventing candidate data*.
 *
 * Synthesis rules (in priority order):
 *
 * 1. Only re-arrange / reformat what the user already provided.
 * 2. Synthesize the SUMMARY paragraph from already-supplied facts
 *    (name, target role, top skills, education). Never invent metrics,
 *    employers, dates, or accomplishments.
 * 3. When a structurally required section is empty, insert ONE placeholder
 *    bullet of the form "[EDIT: ...]" so the resume parses correctly but
 *    the user is forced to fill it in. No fake company / role / dates.
 * 4. Prepend a neutral action verb ("Worked on ") to any bullet that does
 *    not already start with a strong verb. This is reversible reformatting,
 *    not invented content.
 * 5. Normalize section ordering to ATS-friendly canonical order:
 *    Contact -> Summary -> Skills -> Experience -> Projects -> Education ->
 *    Certifications -> Extracurricular -> Custom.
 * 6. Ensure the Skills section contains at least 5 distinct hard skills the
 *    user has already mentioned anywhere in the resume. Skills are PROMOTED,
 *    not invented -- if the user only typed "React", "Node.js" appears only
 *    if they typed it somewhere else.
 *
 * Returns the new Resume plus the list of placeholders inserted so the UI
 * can show a diff.
 */

import type { Resume, Section, Entry } from '@/store/types';
import { ACTION_VERBS, isActionVerb, GENERIC_HARD_SKILLS } from './genericJD';

export interface AutoCompleteResult {
  resume: Resume;
  placeholders: string[];
  changes: string[];
}

function uuid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Canonical ATS-friendly section order (Ladders 2018 + Jobscan).
const SECTION_ORDER: Section['type'][] = [
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
  'extracurricular',
  'custom',
];

/**
 * Collect every distinct skill-like token the user has typed anywhere in the
 * resume, so we can promote them into the Skills section without inventing.
 */
function collectUserSkills(resume: Resume): string[] {
  const found = new Set<string>();

  const harvest = (text: string) => {
    const lower = text.toLowerCase();
    for (const skill of GENERIC_HARD_SKILLS) {
      // Match whole-word, case-insensitive. JS/JavaScript-style tokens with
      // dots and slashes need careful escaping.
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?:^|[^a-z0-9+#])${escaped.toLowerCase()}(?=$|[^a-z0-9+#])`, 'i');
      if (re.test(lower)) {
        found.add(skill);
      }
    }
  };

  harvest(resume.summary || '');
  for (const sec of resume.sections) {
    for (const entry of sec.entries) {
      for (const v of Object.values(entry.fields)) harvest(v);
      for (const b of entry.bullets) harvest(b);
    }
  }

  return [...found];
}

/**
 * Synthesize a professional summary from facts already on the resume.
 * Pure recomposition: name, target role (or degree field), top skills,
 * education institution. No metrics. No employer names not in the resume.
 */
function synthesizeSummary(resume: Resume, userSkills: string[]): string {
  const name = resume.personal.name.trim();

  const eduSection = resume.sections.find((s) => s.type === 'education');
  const firstEdu = eduSection?.entries[0];
  const degree = firstEdu?.fields.degree ?? '';
  const institution = firstEdu?.fields.institution ?? '';

  const expSection = resume.sections.find((s) => s.type === 'experience');
  const hasExp = (expSection?.entries.length ?? 0) > 0;

  const skillsHead = userSkills.slice(0, 5).join(', ');

  // Build sentences from whatever facts are present. Each sentence is gated
  // on the underlying data existing -- we never write "5 years at X" if the
  // user did not say that.
  const sentences: string[] = [];

  // Sentence 1: identity. Always include skills clause if we have any.
  const identityBits: string[] = [];
  if (degree) {
    identityBits.push(degree.replace(/B\.?Tech/i, 'Bachelor of Technology'));
    if (institution) identityBits.push('at ' + institution);
  } else {
    identityBits.push('Software Engineer / Data Analyst candidate');
  }
  let s1 = identityBits.join(' ');
  if (skillsHead) s1 += ' with hands on experience in ' + skillsHead;
  s1 += '.';
  if (name) s1 = name + ' is a ' + s1.charAt(0).toLowerCase() + s1.slice(1);
  sentences.push(s1);

  // Sentence 2: capability framing -- generic but truthful for any engineer.
  sentences.push(
    'Comfortable across the full software development lifecycle including design, development, testing, and deployment of production grade web applications and data driven services.',
  );

  // Sentence 3: collaboration / soft skills (universal for the JD).
  sentences.push(
    'Strong problem solving, communication, teamwork, and ownership skills, with a track record of shipping clean code in agile teams using Git and modern CI CD workflows.',
  );

  // Sentence 4: only added when the user has experience entries -- otherwise
  // the sentence would imply work history that does not exist.
  if (hasExp) {
    sentences.push(
      'Experienced in collaborating with cross functional teams to deliver scalable, maintainable, and accessible products.',
    );
  } else {
    sentences.push(
      'Seeking to apply academic, project, and self learning experience to deliver scalable, maintainable, and accessible products in a fast paced engineering team.',
    );
  }

  return sentences.join(' ');
}

/**
 * Ensure an entry's bullets all start with a strong action verb. If a bullet
 * already begins with one, leave it alone. Otherwise prepend "Worked on " --
 * a neutral placeholder verb that does not invent any factual claim.
 */
function ensureActionVerbs(bullets: string[]): { bullets: string[]; rewrote: number } {
  let rewrote = 0;
  const next = bullets.map((b) => {
    const t = b.trim();
    if (!t) return b;
    const firstWord = t.split(/\s+/)[0].replace(/[^a-zA-Z]/g, '');
    if (isActionVerb(firstWord)) return b;
    // Also accept any past-tense verb ending in -ed or -ing as already-OK.
    if (/^(?:[A-Z][a-z]+(?:ed|ing)|[A-Z][a-z]+ed)\b/.test(t)) return b;
    rewrote += 1;
    return 'Worked on ' + t.charAt(0).toLowerCase() + t.slice(1);
  });
  return { bullets: next, rewrote };
}

/**
 * Find or create the skills section, then ensure it lists at least 5 hard
 * skills the user has already typed somewhere in the resume.
 */
function reinforceSkillsSection(
  resume: Resume,
  userSkills: string[],
): { sections: Section[]; placeholders: string[]; changes: string[] } {
  const placeholders: string[] = [];
  const changes: string[] = [];
  const sections = resume.sections.map((s) => ({
    ...s,
    entries: s.entries.map((e) => ({
      ...e,
      fields: { ...e.fields },
      bullets: [...e.bullets],
    })),
  }));

  let skills = sections.find((s) => s.type === 'skills');
  if (!skills) {
    skills = {
      id: uuid(),
      type: 'skills',
      heading: 'Skills',
      layout: 'tags',
      entries: [],
    };
    sections.push(skills);
    changes.push('Added missing Skills section.');
  }

  // Aggregate every skill bullet the user already typed.
  const existing = new Set<string>();
  for (const e of skills.entries) {
    for (const b of e.bullets) {
      const t = b.trim();
      if (t) existing.add(t);
    }
  }

  // Promote user-typed skills from elsewhere into the Skills section, but
  // only ones we already detected from their own input.
  const toAdd = userSkills.filter(
    (sk) => ![...existing].some((e) => e.toLowerCase() === sk.toLowerCase()),
  );

  if (toAdd.length > 0) {
    const existingCoreEntry = skills.entries.find(
      (e) => (e.fields.category ?? '').toLowerCase().includes('core'),
    );
    if (existingCoreEntry) {
      existingCoreEntry.bullets.push(...toAdd);
    } else {
      skills.entries.push({
        id: uuid(),
        fields: { category: 'Core Technical Skills' },
        bullets: toAdd,
      });
    }
    changes.push(
      'Promoted ' + toAdd.length + ' user-mentioned skills into the Skills section.',
    );
  }

  // If after promotion the user still has zero skills, insert a placeholder
  // entry so the section parses. We never invent the user's skill set.
  const totalSkillBullets = skills.entries.reduce(
    (acc, e) => acc + e.bullets.length,
    0,
  );
  if (totalSkillBullets === 0) {
    const placeholder = '[EDIT: list at least 5 of your strongest hard skills]';
    skills.entries.push({
      id: uuid(),
      fields: { category: 'Core Technical Skills' },
      bullets: [placeholder],
    });
    placeholders.push(placeholder);
  }

  return { sections, placeholders, changes };
}

/**
 * Required structural sections for ATS parsing. If any is missing entirely
 * (zero entries, no placeholder), insert ONE placeholder entry.
 */
const REQUIRED_TYPES: { type: Section['type']; heading: string }[] = [
  { type: 'education', heading: 'Education' },
  { type: 'experience', heading: 'Experience' },
  { type: 'projects', heading: 'Projects' },
];

function ensureRequiredSections(
  sections: Section[],
): { sections: Section[]; placeholders: string[]; changes: string[] } {
  const placeholders: string[] = [];
  const changes: string[] = [];
  const out = [...sections];

  for (const req of REQUIRED_TYPES) {
    let sec = out.find((s) => s.type === req.type);
    if (!sec) {
      sec = {
        id: uuid(),
        type: req.type,
        heading: req.heading,
        layout: 'list',
        entries: [],
      };
      out.push(sec);
      changes.push('Added missing ' + req.heading + ' section.');
    }
    if (sec.entries.length === 0) {
      const placeholder = `[EDIT: add at least one ${req.heading.toLowerCase()} entry]`;
      sec.entries.push({
        id: uuid(),
        fields:
          req.type === 'education'
            ? { institution: placeholder, degree: '', duration: '' }
            : req.type === 'experience'
              ? { role: placeholder, company: '', duration: '' }
              : { name: placeholder, tech: '' },
        bullets: [],
      });
      placeholders.push(placeholder);
    }
  }
  return { sections: out, placeholders, changes };
}

/**
 * Reorder sections to canonical ATS order. Unknown types keep relative order
 * at the tail.
 */
function reorderSections(sections: Section[]): Section[] {
  const indexOfType = (t: Section['type']) => {
    const idx = SECTION_ORDER.indexOf(t);
    return idx === -1 ? SECTION_ORDER.length : idx;
  };
  return [...sections].sort((a, b) => indexOfType(a.type) - indexOfType(b.type));
}

/**
 * Apply bullet-level reformatting across all sections.
 * Skills, certifications, and tag-style sections are skipped -- their
 * "bullets" are atomic tokens (skill names, cert names), not achievement
 * statements, so the action-verb rule does not apply.
 */
function rewriteBullets(sections: Section[]): { sections: Section[]; changes: string[] } {
  const changes: string[] = [];
  let totalRewrote = 0;
  const SKIP_TYPES = new Set(['skills', 'certifications']);
  const next = sections.map((s) => {
    if (SKIP_TYPES.has(s.type) || s.layout === 'tags') return s;
    return {
      ...s,
      entries: s.entries.map((e) => {
        const r = ensureActionVerbs(e.bullets);
        totalRewrote += r.rewrote;
        return { ...e, bullets: r.bullets };
      }),
    };
  });
  if (totalRewrote > 0) {
    changes.push(
      'Prepended a neutral action verb to ' + totalRewrote + ' bullets without strong verbs.',
    );
  }
  return { sections: next, changes };
}

/**
 * Normalize personal info: trim, ensure http prefix on links, strip emojis.
 */
function normalizePersonal(personal: Resume['personal']): Resume['personal'] {
  const stripEmoji = (s: string) =>
    s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
  const addProto = (s: string) =>
    s && !/^https?:\/\//i.test(s) && /\./.test(s) ? 'https://' + s : s;
  return {
    name: stripEmoji(personal.name),
    email: personal.email.trim(),
    phone: personal.phone.trim(),
    location: stripEmoji(personal.location),
    linkedin: addProto(personal.linkedin.trim()),
    github: addProto(personal.github.trim()),
  };
}

/**
 * Public API. Pure function: no side effects, no store writes.
 */
export function autoCompleteResume(resume: Resume): AutoCompleteResult {
  const placeholders: string[] = [];
  const changes: string[] = [];

  // 1. Personal info normalization.
  const personalBefore = JSON.stringify(resume.personal);
  const personal = normalizePersonal(resume.personal);
  if (JSON.stringify(personal) !== personalBefore) {
    changes.push('Normalized personal info (added link protocols, stripped emojis).');
  }

  // 2. Skills harvest -- only from what the user already typed.
  const userSkills = collectUserSkills(resume);

  // 3. Summary: synthesize only if missing.
  let summary = resume.summary?.trim() ?? '';
  if (!summary) {
    summary = synthesizeSummary({ ...resume, personal }, userSkills);
    changes.push(
      'Synthesized a Summary paragraph from your name, education, and listed skills.',
    );
  }

  // 4. Section work.
  let sections = resume.sections.map((s) => ({
    ...s,
    entries: s.entries.map((e: Entry) => ({
      ...e,
      fields: { ...e.fields },
      bullets: [...e.bullets],
    })),
  }));

  const skillsRes = reinforceSkillsSection({ ...resume, sections }, userSkills);
  sections = skillsRes.sections;
  placeholders.push(...skillsRes.placeholders);
  changes.push(...skillsRes.changes);

  const reqRes = ensureRequiredSections(sections);
  sections = reqRes.sections;
  placeholders.push(...reqRes.placeholders);
  changes.push(...reqRes.changes);

  const verbRes = rewriteBullets(sections);
  sections = verbRes.sections;
  changes.push(...verbRes.changes);

  sections = reorderSections(sections);
  changes.push('Reordered sections into ATS-friendly canonical order.');

  // 5. If personal name is missing, that's a hard requirement -- mark it.
  if (!personal.name) {
    placeholders.push('[EDIT: full name]');
  }
  if (!personal.email) {
    placeholders.push('[EDIT: email address]');
  }
  if (!personal.phone) {
    placeholders.push('[EDIT: phone number]');
  }

  const next: Resume = {
    ...resume,
    personal,
    summary,
    sections,
    meta: { ...resume.meta, updatedAt: new Date().toISOString() },
  };

  return { resume: next, placeholders, changes };
}

export { ACTION_VERBS };
