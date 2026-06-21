/**
 * ATS score helper for the builder UI.
 *
 * Flattens the Resume object into ATS-readable plain text the way an ATS
 * parser would see it, then runs the existing L1 NLP path + ScoreAgent
 * against a fixed generic engineering JD. Returns a 0-100 score plus a list
 * of "what's missing for 90+" hints.
 *
 * Synchronous on purpose: no network, no model load, runs inside React
 * render cycles cheaply. Uses analyzeL2Sync (TF-IDF) so it works in tests.
 */

import type { Resume } from '@/store/types';
import { analyzeL1 } from '@/ai/agents/L1_NLPAgent';
import { analyzeL2Sync } from '@/ai/agents/L2_EmbedAgent';
import { computeScore } from '@/ai/agents/ScoreAgent';
import { GENERIC_ENGINEERING_JD, GENERIC_HARD_SKILLS } from './genericJD';

export interface AtsBreakdown {
  skills: number;
  experience: number;
  education: number;
  projects: number;
  certifications: number;
  extracurricular: number;
  completeness: number;
}

export interface AtsScoreResult {
  score: number;
  breakdown: AtsBreakdown;
  missingForNinety: string[];
  matchedSkills: string[];
  resumeText: string;
}

/**
 * Convert a Resume object into the linear text a real ATS would extract.
 * Headings preserved in canonical form so section detection succeeds.
 */
export function resumeToAtsText(resume: Resume): string {
  const lines: string[] = [];

  // Header
  if (resume.personal.name) lines.push(resume.personal.name);
  const contactBits = [
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
    resume.personal.linkedin,
    resume.personal.github,
  ].filter(Boolean);
  if (contactBits.length) lines.push(contactBits.join(' | '));
  lines.push('');

  if (resume.summary && resume.summary.trim()) {
    lines.push('Summary');
    lines.push(resume.summary.trim());
    lines.push('');
  }

  // Map our section types to the canonical heading word the L1 regex
  // recognises. Keep "Skills", "Experience", "Education" etc. literal.
  const headingFor: Record<string, string> = {
    skills: 'Skills',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
    certifications: 'Certifications',
    extracurricular: 'Extracurricular Activities',
    custom: '',
  };

  for (const section of resume.sections) {
    if (section.entries.length === 0) continue;
    const heading = headingFor[section.type] || section.heading;
    if (heading) {
      lines.push(heading);
    }

    for (const entry of section.entries) {
      const fieldLine = Object.values(entry.fields).filter(Boolean).join(' | ');
      if (fieldLine) lines.push(fieldLine);
      for (const b of entry.bullets) {
        if (b.trim()) lines.push('- ' + b.trim());
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Strip smart quotes / non-ASCII so AcroForm appearance and ATS parsing
 * stay happy. Pure utility.
 */
export function asciiSafe(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[…]/g, '...')
    .replace(/[ ]/g, ' ');
}

function hasExtracurricular(l1: { sections: string[] }): boolean {
  return l1.sections.includes('extracurricular');
}

/**
 * Detect which of our benchmark hard skills appear (case-insensitive
 * whole-word) anywhere in the resume text.
 */
function detectHardSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const present: string[] = [];
  for (const sk of GENERIC_HARD_SKILLS) {
    const esc = sk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase();
    const re = new RegExp(`(?:^|[^a-z0-9+#])${esc}(?=$|[^a-z0-9+#])`);
    if (re.test(lower)) present.push(sk);
  }
  return present;
}

/**
 * Compute the ATS score against the generic engineering JD.
 *
 * Builder-time scoring layers two signals:
 *
 *   1. The existing L1 + L2 (sync TF-IDF) + ScoreAgent composite. This is
 *      the same path the employer dashboard uses, so the score is directly
 *      comparable across the product.
 *   2. A direct hard-skill coverage signal -- how many of the benchmark JD's
 *      hard skills actually appear in the resume. Real ATS systems rely
 *      heavily on this Boolean keyword presence rather than semantic
 *      similarity, so we surface it explicitly and blend it back into the
 *      skills and experience sub-scores before re-weighting.
 *
 * Distance is null because builder-time scoring has no employer coordinates;
 * ScoreAgent redistributes the 5% distance weight proportionally.
 */
export function computeAtsScore(resume: Resume): AtsScoreResult {
  const resumeText = asciiSafe(resumeToAtsText(resume));
  const jdText = GENERIC_ENGINEERING_JD;

  const l1 = analyzeL1(resumeText, jdText);
  const l2 = analyzeL2Sync(resumeText, jdText);
  const scores = computeScore(l1, l2, null, null);

  const matched = detectHardSkills(resumeText);

  // Boolean coverage signal: matched / target benchmark skills.
  // Saturates at 6+ matches -- matches the "at least 5 distinct hard
  // skills" ATS-friendly checklist target. Real ATS systems treat keyword
  // presence as Boolean; we use the smooth ramp only to avoid score
  // discontinuities under the threshold.
  const coverage = Math.min(1, matched.length / 6);

  // Blend coverage into skills (which the spec treats as 30% of the
  // composite). This addresses the dilution of TF-IDF over long mixed
  // documents while staying within the existing weighting scheme.
  const blendedSkills = Math.max(scores.skillsMatch.score, coverage);

  // Experience / certifications use the same TF-IDF semantic similarity as
  // L2, which under-rewards a resume that has the section + relevant tech
  // mentions. If the section exists AND coverage is high, treat it as a
  // strong match.
  const hasExp = l1.sections.includes('experience') ? 1 : 0;
  const blendedExperience = hasExp
    ? Math.max(scores.experience.score, coverage)
    : scores.experience.score;

  const hasCert = l1.sections.includes('certifications') ? 1 : 0;
  const blendedCerts = hasCert
    ? Math.max(scores.certifications.score, coverage)
    : scores.certifications.score;

  // Re-apply the ScoreAgent weights, redistributing weight for sections
  // that are entirely absent (no entries). An ATS doesn't penalize a
  // candidate for not having certifications -- it just doesn't reward them.
  // Redistribution follows the same proportional pattern that ScoreAgent
  // already uses for the distance dimension.
  const W = {
    skills: 0.30,
    experience: 0.20,
    education: 0.15,
    projects: 0.10,
    certifications: 0.05,
    extracurricular: 0.05,
    gpa: 0.03,
    completeness: 0.02,
  };

  let excluded = 0.05; // distance is always excluded at builder time
  if (!hasCert) excluded += W.certifications;
  if (!hasExtracurricular(l1)) excluded += W.extracurricular;
  if (!scores.gpa) excluded += W.gpa;

  const total = 1 - excluded;
  const w = {
    skills: W.skills / total,
    experience: W.experience / total,
    education: W.education / total,
    projects: W.projects / total,
    certifications: hasCert ? W.certifications / total : 0,
    extracurricular: hasExtracurricular(l1) ? W.extracurricular / total : 0,
    gpa: scores.gpa ? W.gpa / total : 0,
    completeness: W.completeness / total,
  };

  const gpaScore = scores.gpa?.score ?? 0;
  const projectScore =
    coverage >= 0.5 && l1.sections.includes('projects')
      ? Math.max(scores.projects.score, 0.85)
      : scores.projects.score;

  let blendedOverall =
    100 *
    (w.skills * blendedSkills +
      w.experience * blendedExperience +
      w.education * scores.education.score +
      w.projects * projectScore +
      w.certifications * blendedCerts +
      w.extracurricular * scores.extracurricular.score +
      w.gpa * gpaScore +
      w.completeness * scores.completeness.score);

  // Parseability gate (Ladders 2018): if the L1 parser can't find core
  // sections, the resume is unreadable to an ATS regardless of content.
  if (!l1.parseability) blendedOverall = 0;

  blendedOverall = Math.max(0, Math.min(100, blendedOverall));
  blendedOverall = Math.round(blendedOverall * 100) / 100;

  const missing: string[] = [];
  if (matched.length < 5) {
    missing.push(
      'Add at least ' + (5 - matched.length) + ' more hard skills from the generic JD (e.g. Python, REST APIs, Git).',
    );
  }
  if (!l1.parseability) {
    missing.push(
      'Add the missing required sections (Contact, Education, Experience/Projects, Skills).',
    );
  }
  if (!resume.summary || resume.summary.trim().length < 80) {
    missing.push('Write a richer professional Summary (3-4 sentences).');
  }
  if (blendedSkills < 0.7) {
    missing.push('Mention more JD-aligned keywords in your bullets.');
  }
  if (blendedExperience < 0.4 && projectScore < 0.4) {
    missing.push('Add at least one Experience or Project entry with quantified outcomes.');
  }
  if (scores.completeness.score < 1) {
    missing.push('Fill every core section: name, summary, skills, education, projects/experience.');
  }
  if (blendedOverall < 90) {
    missing.push('Aim for 5+ JD-aligned hard skills AND quantified bullets to clear 90.');
  }

  return {
    score: blendedOverall,
    breakdown: {
      skills: blendedSkills,
      experience: blendedExperience,
      education: scores.education.score,
      projects: projectScore,
      certifications: blendedCerts,
      extracurricular: scores.extracurricular.score,
      completeness: scores.completeness.score,
    },
    missingForNinety: missing,
    matchedSkills: matched,
    resumeText,
  };
}
