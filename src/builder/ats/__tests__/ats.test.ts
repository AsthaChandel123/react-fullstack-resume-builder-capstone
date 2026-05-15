import { describe, it, expect } from 'vitest';
import type { Resume } from '@/store/types';
import { computeAtsScore, resumeToAtsText } from '../atsScore';
import { autoCompleteResume } from '../autoComplete';

function uuid(): string {
  return 'id-' + Math.random().toString(36).slice(2);
}

/**
 * A richly filled, hand-authored resume. No invented employers -- "TechCorp"
 * and "DataCo" appear in this test's input, NOT in autoComplete output, so we
 * can later assert autoComplete does not introduce them on its own.
 */
function fullResume(): Resume {
  return {
    id: 'r1',
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templateId: 'ats-classic',
    },
    personal: {
      name: 'Astha Chandel',
      email: 'astha@example.com',
      phone: '+91 98765 43210',
      location: 'Solan, Himachal Pradesh',
      linkedin: 'https://linkedin.com/in/astha',
      github: 'https://github.com/astha',
    },
    summary:
      'Software engineering candidate with hands on experience in JavaScript, TypeScript, React, Node.js, Python, SQL, and REST APIs. Comfortable across the full software development lifecycle including design, development, testing, and deployment of production grade web applications and data driven services. Strong problem solving, communication, teamwork, and ownership skills with a track record of shipping clean code in agile teams using Git and modern CI CD workflows. Experience collaborating with cross functional teams to deliver scalable, maintainable, and accessible products.',
    sections: [
      {
        id: uuid(),
        type: 'skills',
        heading: 'Skills',
        layout: 'tags',
        entries: [
          {
            id: uuid(),
            fields: { category: 'Languages & Frameworks' },
            bullets: [
              'JavaScript',
              'TypeScript',
              'Python',
              'Java',
              'React',
              'Node.js',
              'Express',
              'HTML',
              'CSS',
            ],
          },
          {
            id: uuid(),
            fields: { category: 'Tools & Infrastructure' },
            bullets: [
              'Git',
              'GitHub',
              'Docker',
              'PostgreSQL',
              'MongoDB',
              'REST APIs',
              'Jest',
              'Vitest',
              'CI/CD',
              'AWS',
              'Agile',
              'Scrum',
            ],
          },
        ],
      },
      {
        id: uuid(),
        type: 'experience',
        heading: 'Experience',
        layout: 'list',
        entries: [
          {
            id: uuid(),
            fields: {
              role: 'Software Engineering Intern',
              company: 'TechCorp',
              duration: 'May 2024 - Aug 2024',
              location: 'Bengaluru, India',
            },
            bullets: [
              'Built REST APIs in Node.js and Express that served 50,000 requests per day with 99.9% uptime',
              'Designed PostgreSQL schemas and wrote integration tests with Jest, increasing coverage from 40% to 85%',
              'Shipped a React TypeScript dashboard that reduced support ticket time by 30%',
            ],
          },
        ],
      },
      {
        id: uuid(),
        type: 'projects',
        heading: 'Projects',
        layout: 'list',
        entries: [
          {
            id: uuid(),
            fields: {
              name: 'Open Source Resume Builder',
              tech: 'React, TypeScript, Zustand',
              description: 'Offline-first resume builder with ATS scoring.',
            },
            bullets: [
              'Engineered an offline-first React + TypeScript app with Zustand state and IndexedDB persistence',
              'Implemented an ATS scoring engine using TF-IDF and Jaccard that runs entirely in the browser',
            ],
          },
        ],
      },
      {
        id: uuid(),
        type: 'education',
        heading: 'Education',
        layout: 'list',
        entries: [
          {
            id: uuid(),
            fields: {
              institution: 'Shoolini University',
              degree: 'B.Tech in Computer Science and Engineering',
              duration: '2022 - 2026',
              gpa: '8.9 / 10.0',
              coursework: 'Data Structures, Algorithms, Operating Systems, Databases, Software Engineering',
            },
            bullets: [
              'Awarded merit scholarship for top 5% academic performance',
            ],
          },
        ],
      },
      {
        id: uuid(),
        type: 'certifications',
        heading: 'Certifications',
        layout: 'list',
        entries: [
          {
            id: uuid(),
            fields: {
              name: 'AWS Certified Cloud Practitioner',
              issuer: 'Amazon Web Services',
              date: '2024',
            },
            bullets: [],
          },
        ],
      },
      {
        id: uuid(),
        type: 'extracurricular',
        heading: 'Extracurricular',
        layout: 'list',
        entries: [
          {
            id: uuid(),
            fields: {
              role: 'President',
              org: 'Coding Club, Shoolini University',
              duration: '2023 - 2024',
            },
            bullets: [
              'Led a team of 30 students to organize 5 hackathons and 12 workshops on web development',
            ],
          },
        ],
      },
    ],
  };
}

/**
 * A stub resume: minimum a Saathi user provides before bailing out.
 * Just name, email, phone, target degree, a few skills. No bullets, no exp.
 */
function stubResume(): Resume {
  return {
    id: 'r2',
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templateId: 'ats-classic',
    },
    personal: {
      name: 'Riya Sharma',
      email: 'riya@example.com',
      phone: '+91 91234 56789',
      location: 'Delhi',
      linkedin: '',
      github: '',
    },
    summary: '',
    sections: [
      {
        id: uuid(),
        type: 'skills',
        heading: 'Skills',
        layout: 'tags',
        entries: [
          {
            id: uuid(),
            fields: { category: 'Core' },
            bullets: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git'],
          },
        ],
      },
      {
        id: uuid(),
        type: 'education',
        heading: 'Education',
        layout: 'list',
        entries: [
          {
            id: uuid(),
            fields: {
              institution: 'Delhi University',
              degree: 'B.Tech in Computer Science',
              duration: '2022 - 2026',
            },
            bullets: [],
          },
        ],
      },
    ],
  };
}

describe('computeAtsScore', () => {
  it('returns a score >= 90 on a fully-filled, well-formed resume', () => {
    const result = computeAtsScore(fullResume());
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.matchedSkills.length).toBeGreaterThanOrEqual(5);
  });

  it('produces a structured breakdown and parseable resume text', () => {
    const result = computeAtsScore(fullResume());
    expect(result.breakdown.skills).toBeGreaterThan(0);
    expect(result.breakdown.education).toBeGreaterThan(0);
    expect(result.breakdown.completeness).toBeGreaterThan(0.9);
    expect(result.resumeText).toContain('Astha Chandel');
    expect(result.resumeText).toContain('Skills');
  });

  it('flags missingForNinety on a sparse resume', () => {
    const sparse: Resume = {
      ...stubResume(),
      sections: [], // no sections at all
    };
    const result = computeAtsScore(sparse);
    expect(result.score).toBeLessThan(90);
    expect(result.missingForNinety.length).toBeGreaterThan(0);
  });
});

describe('autoCompleteResume', () => {
  it('lifts a minimal stub resume to ATS 90+ after auto-complete', () => {
    const stub = stubResume();
    const before = computeAtsScore(stub);
    const { resume: completed, placeholders } = autoCompleteResume(stub);
    const after = computeAtsScore(completed);

    expect(after.score).toBeGreaterThan(before.score);
    expect(after.score).toBeGreaterThanOrEqual(90);

    // It MUST have inserted placeholders because the stub had no experience
    // or projects -- structural requirements for ATS parsing.
    expect(placeholders.length).toBeGreaterThan(0);
    expect(placeholders.some((p) => p.startsWith('[EDIT:'))).toBe(true);
  });

  it('never invents companies, roles, or institutions the user did not provide', () => {
    const stub = stubResume();
    const { resume: completed } = autoCompleteResume(stub);

    const completedText = resumeToAtsText(completed).toLowerCase();

    // None of these were in the user's input -- so autoComplete must NEVER
    // produce them on its own.
    const forbidden = [
      'techcorp',
      'dataco',
      'flipkart',
      'google',
      'amazon',
      'microsoft',
      'iit bombay',
      'stanford',
      'mit',
      'jan 2024',
      'present',
    ];
    for (const word of forbidden) {
      expect(completedText).not.toContain(word);
    }
  });

  it('preserves user-provided facts verbatim and only synthesizes from them', () => {
    const stub = stubResume();
    const { resume: completed } = autoCompleteResume(stub);

    // Original facts must still be present.
    expect(completed.personal.name).toBe('Riya Sharma');
    expect(completed.personal.email).toBe('riya@example.com');

    // Synthesized summary must mention either the institution or the degree.
    expect(completed.summary).toMatch(/Riya Sharma|Bachelor of Technology|Delhi University|Computer Science/i);
  });

  it('inserts canonical [EDIT: ...] placeholders for missing required sections', () => {
    const stub = stubResume();
    const { resume: completed, placeholders } = autoCompleteResume(stub);

    // The stub had no experience and no projects -- both must now exist
    // with placeholder entries.
    const exp = completed.sections.find((s) => s.type === 'experience');
    const proj = completed.sections.find((s) => s.type === 'projects');

    expect(exp).toBeDefined();
    expect(proj).toBeDefined();
    expect(exp!.entries.length).toBeGreaterThan(0);
    expect(proj!.entries.length).toBeGreaterThan(0);

    // The placeholder bag must include both.
    expect(placeholders.join(' ')).toMatch(/experience/i);
    expect(placeholders.join(' ')).toMatch(/project/i);
  });

  it('does not regress a fully-filled resume below 90', () => {
    const full = fullResume();
    const { resume: completed } = autoCompleteResume(full);
    const result = computeAtsScore(completed);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it('promotes user-typed skills into the Skills section, never extras', () => {
    const stub = stubResume();
    // Note: stub skills are JavaScript, React, Node.js, Python, SQL, Git
    const { resume: completed } = autoCompleteResume(stub);
    const skills = completed.sections.find((s) => s.type === 'skills');
    expect(skills).toBeDefined();
    const allSkillTokens = skills!.entries
      .flatMap((e) => e.bullets)
      .map((s) => s.toLowerCase());
    // Every promoted skill must have been typed by the user already.
    const userTypedLower = ['javascript', 'react', 'node.js', 'python', 'sql', 'git'];
    for (const token of allSkillTokens) {
      // Either it is a user-typed skill or the [EDIT: ...] placeholder.
      const isPlaceholder = token.startsWith('[edit:');
      const isUserTyped = userTypedLower.includes(token);
      expect(isPlaceholder || isUserTyped).toBe(true);
    }
  });
});

describe('resumeToAtsText', () => {
  it('emits the canonical section headings ATS parsers look for', () => {
    const text = resumeToAtsText(fullResume());
    expect(text).toMatch(/^Summary$/m);
    expect(text).toMatch(/^Skills$/m);
    expect(text).toMatch(/^Experience$/m);
    expect(text).toMatch(/^Education$/m);
  });
});
