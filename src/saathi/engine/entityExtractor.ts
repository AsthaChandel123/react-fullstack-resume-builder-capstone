// /mnt/experiments/astha-resume/src/saathi/engine/entityExtractor.ts

import { normalizeSkill } from '@/ai/taxonomy/skillsGraph';

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

  // GPA (try fraction first to avoid CGPA regex eating the denominator, then CGPA, then percentage)
  const fracMatch = text.match(GPA_FRACTION_RE);
  if (fracMatch) {
    result.gpa = `${fracMatch[1]}/${fracMatch[2]}`;
  } else {
    const cgpaMatch = text.match(CGPA_RE);
    if (cgpaMatch) {
      result.gpa = cgpaMatch[1];
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

import { extractNEREntities } from './nerModel';

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
