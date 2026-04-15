/**
 * JD Processing Agent -- Structured requirement extraction from job descriptions.
 *
 * Turns unstructured JD text into typed, normalized data the entire pipeline consumes.
 * Pure NLP/regex/heuristic. No async, no model inference, no network.
 *
 * Methodology citations:
 * - ESCO v1.1.1 (European Skills/Competences/Occupations taxonomy) for skill classification.
 * - O*NET 28.1 (Occupational Information Network) for seniority/responsibility mapping.
 * - Burning Glass / Lightcast (2023) for skill extraction pattern methodology.
 * - Marinescu & Rathelot (2018), AEJ:Macro 10(3):42-70 for location signal parsing.
 * - NACE Job Outlook 2024 for skill importance weighting.
 */

import type { SkillNode } from '../taxonomy/skillsGraph';
import { normalizeSkill, matchSkillsToTaxonomy } from '../taxonomy/skillsGraph';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface JDRequirements {
  title: string;
  seniority: 'intern' | 'entry' | 'mid' | 'senior' | 'lead' | 'principal' | 'executive';
  requiredSkills: SkillRequirement[];
  preferredSkills: SkillRequirement[];
  experienceRange: { min: number; max: number | null };
  educationRequirements: EducationReq[];
  responsibilities: string[];
  benefits: string[];
  location: { text: string; remote: boolean; hybrid: boolean };
  salary: { min: number | null; max: number | null; currency: string } | null;
  companySignals: {
    size: 'startup' | 'mid' | 'enterprise' | 'unknown';
    techStack: string[];
    culture: string[];
  };
}

export interface SkillRequirement {
  raw: string;
  normalized: string;
  category: string;
  isRequired: boolean;
  contextClue: string;
}

export interface EducationReq {
  level: 'any' | 'diploma' | 'bachelors' | 'masters' | 'phd';
  field: string;
  required: boolean;
}

// ---------------------------------------------------------------------------
// Section splitting
// ---------------------------------------------------------------------------

/** Heading patterns for splitting JD into logical sections. */
const SECTION_HEADINGS: Record<string, RegExp> = {
  requirements: /^(?:requirements?|must.have|required|mandatory|minimum qualifications?|what you.?(?:ll)? need)/i,
  preferred: /^(?:nice.to.have|preferred|bonus|good.to.have|desired|plus|optional qualifications?|what.?s nice to have)/i,
  responsibilities: /^(?:responsibilities|duties|what you.?(?:ll)? do|role|key responsibilities|about the role|the role|your impact|day to day)/i,
  qualifications: /^(?:qualifications?|eligibility|who you are|about you|what we.?re looking for|you should have)/i,
  benefits: /^(?:benefits?|perks?|compensation|what we offer|why (?:join|work)|our offer)/i,
  about: /^(?:about (?:us|the company|the team)|who we are|our (?:mission|story|team|culture))/i,
  skills: /^(?:skills?|technical skills?|tech stack|technologies|tools?(?:\s+&\s+technologies)?)/i,
  education: /^(?:education|academic|degree|qualification)/i,
  experience: /^(?:experience|work experience)/i,
};

interface JDSection {
  name: string;
  content: string;
  lines: string[];
}

/**
 * Split JD text into logical sections using heading detection.
 * Falls back to a single "body" section if no headings found.
 */
function splitSections(text: string): JDSection[] {
  const lines = text.split('\n');
  const sections: JDSection[] = [];
  let current: JDSection = { name: 'body', content: '', lines: [] };

  for (const raw of lines) {
    const trimmed = raw.trim();
    // Strip markdown/formatting noise from heading candidates
    const cleaned = trimmed.replace(/^[#*_\-=:]+\s*/, '').replace(/[*_:]+$/, '').trim();

    let matched = false;
    if (cleaned.length > 0 && cleaned.length < 80) {
      for (const [name, pattern] of Object.entries(SECTION_HEADINGS)) {
        if (pattern.test(cleaned)) {
          // Save previous section
          if (current.lines.length > 0) {
            current.content = current.lines.join('\n');
            sections.push(current);
          }
          current = { name, content: '', lines: [] };
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      current.lines.push(trimmed);
    }
  }

  // Push last section
  if (current.lines.length > 0) {
    current.content = current.lines.join('\n');
    sections.push(current);
  }

  return sections;
}

/**
 * Get all text from sections matching any of the given names.
 */
function getSectionText(sections: JDSection[], names: string[]): string {
  return sections
    .filter((s) => names.includes(s.name))
    .map((s) => s.content)
    .join('\n');
}

// ---------------------------------------------------------------------------
// Title extraction
// ---------------------------------------------------------------------------

/**
 * Extract job title from JD text.
 * Heuristic: first non-empty line that looks like a title (short, no bullets).
 */
function extractTitle(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Skip lines that look like section headings, bullets, or URLs
    if (/^[-*\u2022#]/.test(line)) continue;
    if (/^https?:\/\//i.test(line)) continue;
    if (/^(about|description|company|location|salary|apply)/i.test(line)) continue;
    // Title lines are typically short
    if (line.length <= 80 && /[a-zA-Z]/.test(line)) {
      return line.replace(/[|,].*$/, '').trim();
    }
  }
  return 'Untitled Position';
}

// ---------------------------------------------------------------------------
// Experience extraction
// ---------------------------------------------------------------------------

/** Patterns for experience year ranges. */
const EXP_RANGE = /(\d{1,2})\s*[-\u2013\u2014to]+\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)/i;
const EXP_PLUS = /(\d{1,2})\s*\+\s*(?:years?|yrs?)/i;
const EXP_MIN = /(?:minimum|at\s+least|min\.?)\s*(\d{1,2})\s*(?:years?|yrs?)/i;
const EXP_SIMPLE = /(\d{1,2})\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp\.?|work)/i;

function extractExperience(text: string): { min: number; max: number | null } {
  const lower = text.toLowerCase();

  const rangeMatch = lower.match(EXP_RANGE);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) };
  }

  const plusMatch = lower.match(EXP_PLUS);
  if (plusMatch) {
    return { min: parseInt(plusMatch[1], 10), max: null };
  }

  const minMatch = lower.match(EXP_MIN);
  if (minMatch) {
    return { min: parseInt(minMatch[1], 10), max: null };
  }

  const simpleMatch = lower.match(EXP_SIMPLE);
  if (simpleMatch) {
    return { min: parseInt(simpleMatch[1], 10), max: null };
  }

  return { min: 0, max: null };
}

// ---------------------------------------------------------------------------
// Seniority inference
// ---------------------------------------------------------------------------

/**
 * Infer seniority level from title keywords, experience range, and responsibility language.
 *
 * O*NET Job Zones:
 * Zone 1 = little/no prep, Zone 5 = extensive prep.
 * Mapped to: intern/entry/mid/senior/lead/principal/executive.
 */
function inferSeniority(
  text: string,
  title: string,
  expRange: { min: number; max: number | null },
): JDRequirements['seniority'] {
  const combined = (title + ' ' + text).toLowerCase();

  // Title keyword signals (strongest signal)
  if (/\b(intern|internship|trainee|apprentice)\b/.test(combined)) return 'intern';
  if (/\b(cto|ceo|cfo|coo|vp|vice\s*president|director|head\s+of|chief)\b/.test(combined)) return 'executive';
  if (/\b(principal|staff|distinguished|fellow)\b/.test(combined)) return 'principal';
  if (/\b(lead|tech\s*lead|team\s*lead|architect|engineering\s*manager)\b/.test(combined)) return 'lead';
  if (/\b(senior|sr\.?|experienced)\b/.test(combined)) return 'senior';
  if (/\b(junior|jr\.?|entry[\s-]?level|fresher|graduate|new\s*grad)\b/.test(combined)) return 'entry';

  // Experience-based fallback
  if (expRange.min >= 10) return 'principal';
  if (expRange.min >= 7) return 'senior';
  if (expRange.min >= 3) return 'mid';
  if (expRange.min >= 1) return 'entry';

  // Responsibility language signals
  if (/\b(architect|define\s+strategy|set\s+direction|mentor|lead\s+team)\b/.test(combined)) return 'senior';
  if (/\b(assist\s+with|support|help\s+with|learn|shadow)\b/.test(combined)) return 'entry';

  return 'mid';
}

// ---------------------------------------------------------------------------
// Skill extraction
// ---------------------------------------------------------------------------

/**
 * Common tech skill patterns.
 * Covers programming languages, frameworks, tools, cloud, databases, methodologies.
 * Source: Burning Glass / Lightcast top digital skills 2023.
 */
const SKILL_PATTERNS: RegExp[] = [
  // Programming languages
  /\b(javascript|typescript|python|java|c\+\+|c#|ruby|go|golang|rust|swift|kotlin|scala|php|perl|r|matlab|julia|dart|elixir|clojure|haskell|lua|objective[\s-]?c|assembly|fortran|cobol|vba)\b/gi,
  // Frontend
  /\b(react(?:\.?js)?|angular(?:\.?js)?|vue(?:\.?js)?|svelte|next\.?js|nuxt(?:\.?js)?|gatsby|remix|solid\.?js|ember|backbone|jquery|html5?|css3?|sass|scss|less|tailwind(?:\s*css)?|bootstrap|material[\s-]?ui|chakra[\s-]?ui|styled[\s-]?components|webpack|vite|rollup|esbuild|babel|postcss)\b/gi,
  // Backend
  /\b(node(?:\.?js)?|express(?:\.?js)?|fastify|nest\.?js|django|flask|fastapi|spring(?:\s*boot)?|rails|laravel|asp\.?net|gin|echo|fiber|actix|rocket|phoenix|sinatra|koa)\b/gi,
  // Databases
  /\b(sql|mysql|postgresql|postgres|sqlite|oracle|mssql|mongodb|redis|elasticsearch|cassandra|dynamodb|couchdb|neo4j|influxdb|timescaledb|supabase|firebase|firestore|cockroachdb|planetscale|prisma|sequelize|mongoose|typeorm|drizzle)\b/gi,
  // Cloud/DevOps
  /\b(aws|amazon\s*web\s*services|azure|gcp|google\s*cloud|docker|kubernetes|k8s|terraform|ansible|jenkins|github\s*actions|gitlab\s*ci|circleci|travis\s*ci|cloudflare|vercel|netlify|heroku|digitalocean|nginx|apache|linux|ubuntu|centos|debian)\b/gi,
  // Data/ML/AI
  /\b(machine\s*learning|deep\s*learning|natural\s*language\s*processing|nlp|computer\s*vision|tensorflow|pytorch|keras|scikit[\s-]?learn|pandas|numpy|scipy|matplotlib|seaborn|jupyter|spark|hadoop|kafka|airflow|dbt|snowflake|bigquery|redshift|databricks|mlflow|hugging\s*face|langchain|openai|llm|large\s*language\s*model|generative\s*ai|gen\s*ai|transformers|rag|fine[\s-]?tuning)\b/gi,
  // Mobile
  /\b(react\s*native|flutter|ios|android|swiftui|jetpack\s*compose|xamarin|ionic|capacitor|cordova|expo)\b/gi,
  // Testing
  /\b(jest|mocha|chai|cypress|playwright|selenium|puppeteer|vitest|testing[\s-]?library|junit|pytest|rspec|postman|k6|locust|artillery)\b/gi,
  // Design/Product
  /\b(figma|sketch|adobe\s*xd|invision|zeplin|storybook|design\s*system)\b/gi,
  // Methodology/Soft
  /\b(agile|scrum|kanban|ci[\s/]?cd|devops|sre|site\s*reliability|microservices|rest(?:ful)?|graphql|grpc|websocket|oauth|jwt|saml|sso|api\s*design|system\s*design|distributed\s*systems|event[\s-]?driven|message\s*queue|pub[\s/]?sub)\b/gi,
  // Data formats/protocols
  /\b(json|xml|yaml|protobuf|avro|parquet|csv|mqtt|amqp|http2|quic)\b/gi,
  // Version control
  /\b(git|github|gitlab|bitbucket|svn|mercurial)\b/gi,
];

/**
 * Extract raw skill strings from text using regex patterns.
 * Returns deduplicated skill names.
 */
function extractRawSkills(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of SKILL_PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      found.add(m[1].trim());
    }
  }
  return [...found];
}

/**
 * Find the sentence or line containing a skill mention for context.
 */
function findContextClue(text: string, skill: string): string {
  const lower = text.toLowerCase();
  const skillLower = skill.toLowerCase();
  const idx = lower.indexOf(skillLower);
  if (idx === -1) return '';

  const before = text.lastIndexOf('\n', idx);
  const after = text.indexOf('\n', idx + skill.length);
  const start = before === -1 ? 0 : before + 1;
  const end = after === -1 ? text.length : after;
  return text.slice(start, end).trim().slice(0, 200);
}

/**
 * Safe wrapper around normalizeSkill that handles missing taxonomy gracefully.
 */
function normalizeSkillSafe(raw: string): string {
  try {
    return normalizeSkill(raw) ?? raw.toLowerCase().replace(/\s+/g, '-');
  } catch {
    return raw.toLowerCase().replace(/\s+/g, '-');
  }
}

/**
 * Build SkillRequirement objects.
 * Pass 1: regex extraction. Pass 2: taxonomy normalization.
 */
function buildSkillRequirements(
  sectionText: string,
  isRequired: boolean,
  fullText: string,
): SkillRequirement[] {
  const rawSkills = extractRawSkills(sectionText);
  if (rawSkills.length === 0) return [];

  // Pass 2: normalize against taxonomy
  let taxonomyResult: { matched: SkillNode[]; unmatched: string[] };
  try {
    taxonomyResult = matchSkillsToTaxonomy(rawSkills);
  } catch {
    // Taxonomy module not yet available; fall back to raw-only
    taxonomyResult = { matched: [], unmatched: rawSkills };
  }

  const results: SkillRequirement[] = [];
  const seen = new Set<string>();

  // Matched skills from taxonomy
  for (const node of taxonomyResult.matched) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    const raw = rawSkills.find(
      (r) => normalizeSkillSafe(r) === node.id || r.toLowerCase() === node.name.toLowerCase(),
    ) ?? node.name;
    results.push({
      raw,
      normalized: node.id,
      category: node.category ?? 'uncategorized',
      isRequired,
      contextClue: findContextClue(fullText, raw),
    });
  }

  // Unmatched skills: still useful, just not normalized
  for (const raw of taxonomyResult.unmatched) {
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      raw,
      normalized: key.replace(/\s+/g, '-'),
      category: 'uncategorized',
      isRequired,
      contextClue: findContextClue(fullText, raw),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Education extraction
// ---------------------------------------------------------------------------

const DEGREE_PATTERNS: { level: EducationReq['level']; pattern: RegExp }[] = [
  { level: 'phd', pattern: /\b(ph\.?d|doctorate|doctoral)\b/i },
  { level: 'masters', pattern: /\b(master(?:'?s)?|m\.?s\.?|m\.?tech|m\.?sc|m\.?eng|mba|m\.?a\.?)\b/i },
  { level: 'bachelors', pattern: /\b(bachelor(?:'?s)?|b\.?s\.?|b\.?tech|b\.?sc|b\.?eng|b\.?a\.?|b\.?e\.?|undergraduate|under\s*grad)\b/i },
  { level: 'diploma', pattern: /\b(diploma|associate(?:'?s)?|certificate\s+program|polytechnic)\b/i },
];

const FIELD_PATTERNS: RegExp[] = [
  /\b(computer\s*science|cs|software\s*engineering|information\s*technology|it|electrical\s*engineering|electronics|ece|eee|mechanical\s*engineering|civil\s*engineering|chemical\s*engineering|data\s*science|artificial\s*intelligence|machine\s*learning|mathematics|statistics|physics|chemistry|biology|business\s*administration|management|finance|economics|marketing|design|arts|humanities|communications?|psychology|mca|bca)\b/gi,
];

function extractEducation(text: string): EducationReq[] {
  const lower = text.toLowerCase();
  const results: EducationReq[] = [];

  for (const { level, pattern } of DEGREE_PATTERNS) {
    if (!pattern.test(lower)) continue;
    pattern.lastIndex = 0;

    // Find associated field
    let field = '';
    for (const fp of FIELD_PATTERNS) {
      fp.lastIndex = 0;
      const fm = fp.exec(text);
      if (fm) {
        field = fm[1].trim();
        break;
      }
    }

    const isRequired = !/\b(prefer(?:red|ably)?|nice\s*to\s*have|bonus|or\s*equivalent)\b/i.test(lower);
    results.push({ level, field: field || 'any', required: isRequired });
  }

  // Deduplicate by level
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.level)) return false;
    seen.add(r.level);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Location / remote detection
// ---------------------------------------------------------------------------

function extractLocation(text: string): JDRequirements['location'] {
  const lower = text.toLowerCase();

  const remote = /\b(remote|work\s*from\s*home|wfh|fully\s*remote|remote[\s-]?first|distributed\s*team|anywhere)\b/i.test(lower);
  const hybrid = /\b(hybrid|flexible\s*(?:work|location)|partly\s*remote|semi[\s-]?remote|office\s*\+\s*remote)\b/i.test(lower);

  let locText = '';
  const locPatterns = [
    /(?:location|based\s+in|office(?:\s+in)?|city|headquarter(?:ed|s)?\s+in)[:\s]+([^\n,;]{3,60})/i,
    /\b((?:bengaluru|bangalore|mumbai|delhi|ncr|hyderabad|pune|chennai|kolkata|noida|gurgaon|gurugram|ahmedabad|jaipur|lucknow|kochi|thiruvananthapuram|indore|chandigarh|bhopal|new\s*york|san\s*francisco|london|berlin|singapore|tokyo|sydney|toronto|dubai|amsterdam|paris|seattle|austin|boston|chicago|los\s*angeles)\b(?:\s*,\s*[a-zA-Z\s]+)?)/i,
  ];

  for (const p of locPatterns) {
    const m = text.match(p);
    if (m) {
      locText = m[1].trim().replace(/[.,;]+$/, '');
      break;
    }
  }

  return { text: locText, remote, hybrid };
}

// ---------------------------------------------------------------------------
// Salary extraction
// ---------------------------------------------------------------------------

/**
 * Extract salary ranges. Handles:
 * - USD: "$120k-$150k", "$120,000 - $150,000"
 * - INR: "12-18 LPA", "Rs 12,00,000", "INR 12L"
 * - EUR: "50,000 - 70,000"
 * - Generic: "120000 - 150000 per annum"
 */
function extractSalary(text: string): JDRequirements['salary'] {
  // Indian LPA format
  const lpaMatch = text.match(
    /(?:(?:INR|Rs\.?|₹)\s*)?(\d+(?:\.\d+)?)\s*[-\u2013to]+\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?\s*(?:per\s*annum)?)/i,
  );
  if (lpaMatch) {
    return {
      min: parseFloat(lpaMatch[1]) * 100000,
      max: parseFloat(lpaMatch[2]) * 100000,
      currency: 'INR',
    };
  }

  // Single LPA
  const singleLpa = text.match(
    /(?:(?:INR|Rs\.?|₹)\s*)?(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?\s*(?:per\s*annum)?)/i,
  );
  if (singleLpa) {
    return {
      min: parseFloat(singleLpa[1]) * 100000,
      max: null,
      currency: 'INR',
    };
  }

  // USD range: $120k - $150k or $120,000 - $150,000
  const usdMatch = text.match(
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*k?\s*[-\u2013to]+\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*k?/i,
  );
  if (usdMatch) {
    let min = parseFloat(usdMatch[1].replace(/,/g, ''));
    let max = parseFloat(usdMatch[2].replace(/,/g, ''));
    if (min < 1000) min *= 1000;
    if (max < 1000) max *= 1000;
    return { min, max, currency: 'USD' };
  }

  // EUR range
  const eurMatch = text.match(
    /\u20AC\s*(\d{1,3}(?:[.,]\d{3})*)\s*[-\u2013to]+\s*\u20AC?\s*(\d{1,3}(?:[.,]\d{3})*)/i,
  );
  if (eurMatch) {
    return {
      min: parseFloat(eurMatch[1].replace(/[.,]/g, '')),
      max: parseFloat(eurMatch[2].replace(/[.,]/g, '')),
      currency: 'EUR',
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Benefits extraction
// ---------------------------------------------------------------------------

const BENEFIT_KEYWORDS = /\b(health\s*(?:insurance|coverage|plan)|dental|vision|401k|pension|stock\s*options?|esop|equity|pto|paid\s*(?:time\s*off|leave|vacation|holiday)|maternity|paternity|parental\s*leave|wellness|gym|fitness|learning\s*(?:budget|stipend|allowance)|education\s*(?:reimbursement|assistance)|remote\s*(?:work|friendly)|flexible\s*(?:hours|schedule|work)|free\s*(?:meals?|lunch|snacks|food)|travel\s*(?:allowance|reimbursement)|relocation|team\s*(?:outing|event)|annual\s*bonus|performance\s*bonus|signing\s*bonus|commuter|childcare|insurance|gratuity|provident\s*fund|pf|esi|medical)\b/gi;

function extractBenefits(text: string): string[] {
  const benefits = new Set<string>();
  BENEFIT_KEYWORDS.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BENEFIT_KEYWORDS.exec(text)) !== null) {
    benefits.add(m[1].trim().toLowerCase());
  }
  return [...benefits];
}

// ---------------------------------------------------------------------------
// Responsibilities extraction
// ---------------------------------------------------------------------------

/**
 * Extract key responsibilities from bullet points in responsibilities sections.
 */
function extractResponsibilities(text: string): string[] {
  const lines = text.split('\n');
  const results: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*\u2022\u25E6\u25AA\u25AB\d+.)]\s*/.test(trimmed)) {
      const clean = trimmed.replace(/^[-*\u2022\u25E6\u25AA\u25AB\d+.)]\s*/, '').trim();
      if (clean.length > 10 && clean.length < 300) {
        results.push(clean);
      }
    }
  }

  return results.slice(0, 15);
}

// ---------------------------------------------------------------------------
// Company signals
// ---------------------------------------------------------------------------

function extractCompanySignals(text: string): JDRequirements['companySignals'] {
  const lower = text.toLowerCase();

  let size: JDRequirements['companySignals']['size'] = 'unknown';
  if (/\b(startup|early[\s-]?stage|seed|pre[\s-]?series|series\s*[ab]|bootstrapped|small\s*team)\b/.test(lower)) {
    size = 'startup';
  } else if (/\b(fortune\s*\d+|enterprise|multinational|mnc|global\s*(?:company|org)|large[\s-]?scale|publicly\s*traded|nasdaq|nyse|bse|nse)\b/.test(lower)) {
    size = 'enterprise';
  } else if (/\b(mid[\s-]?size|growing\s*(?:company|team)|series\s*[cd]|scaling)\b/.test(lower)) {
    size = 'mid';
  }

  const techStack = extractRawSkills(text).slice(0, 20);

  const culturePatterns = /\b(fast[\s-]?paced|collaborative|innovative|diverse|inclusive|transparent|flat\s*(?:hierarchy|structure)|ownership|autonomous|work[\s-]?life[\s-]?balance|growth[\s-]?mindset|meritocr|open[\s-]?source|customer[\s-]?first|mission[\s-]?driven|impact[\s-]?driven|agile|lean|data[\s-]?driven|learning\s*culture|mentorship|hackathon|open\s*door)\b/gi;
  const culture: string[] = [];
  culturePatterns.lastIndex = 0;
  let cm: RegExpExecArray | null;
  while ((cm = culturePatterns.exec(lower)) !== null) {
    const kw = cm[1].trim();
    if (!culture.includes(kw)) culture.push(kw);
  }

  return { size, techStack, culture };
}

// ---------------------------------------------------------------------------
// Main public API
// ---------------------------------------------------------------------------

/**
 * Process a job description into structured requirements.
 *
 * Synchronous. Pure NLP/heuristic. Works offline on any device.
 * This is the foundation function the entire pipeline builds on.
 *
 * @param jdText Raw job description text (plain text or lightly formatted)
 * @returns Fully structured JD requirements
 */
export function processJD(jdText: string): JDRequirements {
  if (!jdText || !jdText.trim()) {
    return emptyResult();
  }

  const sections = splitSections(jdText);
  const title = extractTitle(jdText);
  const experienceRange = extractExperience(jdText);

  // Required skills: from requirements, qualifications, skills sections
  const requiredText = getSectionText(sections, ['requirements', 'qualifications', 'skills']);
  const requiredSkills = buildSkillRequirements(
    requiredText || jdText,
    true,
    jdText,
  );

  // Preferred skills: from preferred/nice-to-have sections
  const preferredText = getSectionText(sections, ['preferred']);
  const preferredSkills = buildSkillRequirements(preferredText, false, jdText);

  const seniority = inferSeniority(jdText, title, experienceRange);

  // Education
  const eduText = getSectionText(sections, ['requirements', 'qualifications', 'education']);
  const educationRequirements = extractEducation(eduText || jdText);

  // Responsibilities
  const respText = getSectionText(sections, ['responsibilities']);
  const responsibilities = extractResponsibilities(respText || jdText);

  // Benefits
  const benefitsText = getSectionText(sections, ['benefits']);
  const benefits = extractBenefits(benefitsText || jdText);

  const location = extractLocation(jdText);
  const salary = extractSalary(jdText);

  // Company signals
  const aboutText = getSectionText(sections, ['about', 'body']);
  const companySignals = extractCompanySignals(aboutText || jdText);

  return {
    title,
    seniority,
    requiredSkills,
    preferredSkills,
    experienceRange,
    educationRequirements,
    responsibilities,
    benefits,
    location,
    salary,
    companySignals,
  };
}

/**
 * Simplified skill extraction for backwards compatibility.
 * Returns plain skill name lists without normalization details.
 *
 * @param jdText Raw job description text
 * @returns Required and preferred skill name arrays
 */
export function extractSkillsFromJD(jdText: string): { required: string[]; preferred: string[] } {
  if (!jdText || !jdText.trim()) {
    return { required: [], preferred: [] };
  }

  const sections = splitSections(jdText);
  const requiredText = getSectionText(sections, ['requirements', 'qualifications', 'skills']);
  const preferredText = getSectionText(sections, ['preferred']);

  const required = extractRawSkills(requiredText || jdText);
  const preferred = extractRawSkills(preferredText);

  // Remove preferred duplicates already in required
  const requiredSet = new Set(required.map((s) => s.toLowerCase()));
  const filteredPreferred = preferred.filter((s) => !requiredSet.has(s.toLowerCase()));

  return { required, preferred: filteredPreferred };
}

/**
 * Returns an empty JDRequirements object for invalid/empty input.
 */
function emptyResult(): JDRequirements {
  return {
    title: '',
    seniority: 'mid',
    requiredSkills: [],
    preferredSkills: [],
    experienceRange: { min: 0, max: null },
    educationRequirements: [],
    responsibilities: [],
    benefits: [],
    location: { text: '', remote: false, hybrid: false },
    salary: null,
    companySignals: { size: 'unknown', techStack: [], culture: [] },
  };
}
